import 'source-map-support/register';
import { Context, Schema, Awaitable, Random } from 'koishi';
import {
  PicSourceInfo,
  PicsPluginConfig,
  PicsPluginConfigLike,
} from './config';
import {
  DefineSchema,
  schemaFromClass,
  schemaTransform,
} from 'koishi-utils-schemagen';
import _ from 'lodash';
import { segment } from 'koishi';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      pics: PicsContainer;
    }
  }
}

export interface PicResult {
  url: string;
  description?: string;
}

export class PicSource implements PicSourceInfo {
  constructor(protected ctx: Context) {}
  tags: string[] = [];
  weight = 1;
  name = 'default';
  description = '';
  default = false;
  randomPic(picTags: string[]): Awaitable<PicResult> {
    // For override
    throw new Error(`Not implemented`);
  }

  onStartup(): Awaitable<void> {
    return;
  }
  onShutdown(): Awaitable<void> {
    return;
  }
  getDisplayString() {
    let pattern = this.name;
    if (this.tags.length) {
      pattern += `\t标签: ${this.tags.join(',')}`;
    }
    if (this.description) {
      pattern += `\t${this.description}`;
    }
    return pattern;
  }
}

export class PicsContainer {
  constructor(private ctx: Context) {}
  private sources = new Map<PicSource, () => boolean>();

  addSource(source: PicSource, targetCtx?: Context) {
    const processingCtx: Context = targetCtx || this[Context.current];
    const dispose = processingCtx.on('disconnect', () =>
      this.removeSource(source),
    );
    this.sources.set(source, dispose);
    processingCtx.on('connect', () => source.onStartup());
    this.ctx.logger('pics').info(`Loaded pic source ${source.name}.`);
  }

  async removeSource(source: PicSource) {
    try {
      await source.onShutdown();
    } catch (e) {
      this.ctx
        .logger('pics')
        .warn(`Shutdown of ${source.name} failed: ${e.toString()}`);
    }
    const disposable = this.sources.get(source);
    this.sources.delete(source);
    if (disposable) {
      disposable();
    }
    this.ctx.logger('pics').info(`Removed pic source ${source.name}.`);
  }

  private allSources() {
    return Array.from(this.sources.keys());
  }

  pickAvailableSources(sourceTags: string[] = [], includeNonDefault = false) {
    let sources = this.allSources();
    if (sourceTags.length) {
      sources = sources.filter(
        (s) =>
          sourceTags.some((exact) => s.name === exact) ||
          sourceTags.every((t) => s.tags.includes(t)),
      );
    } else if (!includeNonDefault) {
      sources = sources.filter((s) => s.default);
    }
    return sources;
  }

  randomSourceWithWeight(sources: PicSource[] = this.allSources()) {
    if (!sources.length) {
      return null;
    }
    if (sources.length === 1) {
      return sources[0];
    }
    const weightedSources = _.flatten(
      sources.map((s) => _.range(s.weight).map(() => s)),
    );
    return Random.pick(weightedSources);
  }

  private async retryWithAnotherSource(
    failedSource: PicSource,
    sources: PicSource[],
    picTags: string[],
  ) {
    const remainingSources = sources.filter((s) => s !== failedSource);
    return this.fetchPicsWithSources(remainingSources, picTags);
  }

  private async fetchPicsWithSources(
    sources: PicSource[],
    picTags: string[],
  ): Promise<PicResult> {
    const source = this.randomSourceWithWeight(sources);
    if (!source) {
      return null;
    }
    this.ctx
      .logger('pics')
      .debug(`Using source ${source.name} for searching ${picTags.join(',')}`);
    try {
      const result = await source.randomPic(picTags);
      if (!result) {
        this.ctx
          .logger('pics')
          .debug(
            `Pic not found from ${source.name}, retrying with another source.`,
          );
        return this.retryWithAnotherSource(source, sources, picTags);
      }
      this.ctx.logger('pics').debug(`Got pic ${result.url}`);
      return result;
    } catch (e) {
      this.ctx
        .logger('pics')
        .warn(
          `Fetch pic failed from ${
            source.name
          }, retrying with another source: ${e.toString()}`,
        );
      return this.retryWithAnotherSource(source, sources, picTags);
    }
  }

  async randomPic(picTags: string[] = [], sourceTags: string[] = []) {
    const sources = this.pickAvailableSources(sourceTags);
    return this.fetchPicsWithSources(sources, sourceTags);
  }
}

export class PicsPlugin {
  private config: PicsPluginConfig;
  private ctx: Context;
  name = 'pics-main';
  schema: Schema<PicsPluginConfigLike> = schemaFromClass(PicsPluginConfig);
  apply(ctx: Context, config: PicsPluginConfigLike) {
    this.ctx = ctx;
    this.config = schemaTransform(PicsPluginConfig, config);
    ctx.pics = new PicsContainer(ctx);
    ctx
      .command(`${this.config.commandName}`, '获取随机图片')
      .usage(
        `从各个图源中随机获取一张随机图片。图源可以用 ${this.config.commandName}.sources 查询。参数均为可选。`,
      )
      .option(
        'source',
        `-s <source:string>  指定图源，逗号分隔。图源可以用 ${this.config.commandName}.sources 查询。`,
      )
      .option('tag', '-t <tag:string>  需要查询的图片标签，逗号分隔。')
      .example(
        `${this.config.commandName} -s pixiv -t yuyuko  从 pixiv 图源中获取一张具有 yuyuko 标签的图。`,
      )
      .action(async (argv) => {
        const sourceTags = argv.options.source
          ? argv.options.source.split(',')
          : [];
        const picTags = argv.options.tag ? argv.options.tag.split(',') : [];
        const result = await ctx.pics.randomPic(picTags, sourceTags);
        if (!result) {
          return this.config.failedMessage;
        }
        let msg = `获取到图片:\n${segment('image', {
          url: result.url,
          cache: true,
        })}`;
        if (result.description) {
          msg += `\n${result.description}`;
        }
        if (ctx.assets) {
          msg = await ctx.assets.transform(msg);
        }
        return msg;
      })
      .subcommand('.sources', '查询图源列表')
      .option('source', '-s <source:string>  要查询的图源标签，逗号分隔。')
      .usage('图源标签可用于图片获取的图源筛选。')
      .example(
        `${this.config.commandName}.sources 查询全部的图源。 ${this.config.commandName} -s pixiv 查询含有 pixiv 标签的图源。`,
      )
      .action(async (argv) => {
        const sourceTags = argv.options.source
          ? argv.options.source.split(',')
          : [];
        const sources = ctx.pics.pickAvailableSources(sourceTags, true);
        return `图源的列表如下:\n${sources
          .map((s) => s.getDisplayString())
          .join('\n')}`;
      });
  }
}
