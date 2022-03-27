// import 'source-map-support/register';
import { Context, Assets, Awaitable, Random, Logger } from 'koishi';
import { PicSourceInfo, PicsPluginConfig } from './config';
import _ from 'lodash';
import { segment } from 'koishi';
import {
  BasePlugin,
  Caller,
  DefinePlugin,
  Inject,
  InjectLogger,
  LifecycleEvents,
  Provide,
} from 'koishi-thirdeye';
export * from './config';

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
  isDefault = false;
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

@Provide('pics', { immediate: true })
@DefinePlugin({ name: 'pics', schema: PicsPluginConfig })
export default class PicsContainer
  extends BasePlugin<PicsPluginConfig>
  implements LifecycleEvents
{
  private sources = new Map<PicSource, () => boolean>();

  @Caller()
  private caller: Context;

  @InjectLogger()
  private logger: Logger;

  @Inject()
  private assets: Assets;

  addSource(source: PicSource, targetCtx?: Context) {
    const processingCtx: Context = targetCtx || this.caller;
    const dispose = processingCtx.on('dispose', () =>
      this.removeSource(source),
    );
    this.sources.set(source, dispose);
    processingCtx.on('ready', () => source.onStartup());
    this.logger.info(`Loaded pic source ${source.name}.`);
  }

  async removeSource(source: PicSource) {
    try {
      await source.onShutdown();
    } catch (e) {
      this.logger.warn(`Shutdown of ${source.name} failed: ${e.toString()}`);
    }
    const disposable = this.sources.get(source);
    this.sources.delete(source);
    if (disposable) {
      disposable();
    }
    this.logger.info(`Removed pic source ${source.name}.`);
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
    } else if (!includeNonDefault && sources.length > 1) {
      sources = sources.filter((s) => s.isDefault);
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
    this.logger.debug(
      `Using source ${source.name} for searching ${picTags.join(',')}`,
    );
    try {
      const result = await source.randomPic(picTags);
      if (!result) {
        this.logger.debug(
          `Pic not found from ${source.name}, retrying with another source.`,
        );
        return this.retryWithAnotherSource(source, sources, picTags);
      }
      this.logger.debug(`Got pic ${result.url}`);
      return result;
    } catch (e) {
      this.logger.warn(
        `Fetch pic failed from ${
          source.name
        }, retrying with another source: ${e.toString()}`,
      );
      return this.retryWithAnotherSource(source, sources, picTags);
    }
  }

  async randomPic(picTags: string[] = [], sourceTags: string[] = []) {
    const sources = this.pickAvailableSources(sourceTags);
    return this.fetchPicsWithSources(sources, picTags);
  }

  async onApply() {
    const ctx = this.ctx;
    ctx.i18n.define('zh', `commands.${this.config.commandName}`, {
      description: '获取随机图片',
      options: {
        source: `指定图源，逗号分隔。图源可以用 ${this.config.commandName}.sources 查询。`,
      },
      messages: {
        'not-found': '未找到任何图片。',
      },
    });
    ctx.i18n.define('en', `commands.${this.config.commandName}`, {
      description: 'Get random picture',
      options: {},
      messages: {
        'not-found': 'No pictures found.',
      },
    });
    ctx.i18n.define('zh', `commands.${this.config.commandName}.sources`, {
      description: '查询图源列表',
      options: {},
      messages: {
        list: '图源的列表如下:',
      },
    });
    ctx.i18n.define('en', `commands.${this.config.commandName}.sources`, {
      description: 'Query picture sources',
      options: {},
      messages: {
        list: 'List of sources:',
      },
    });
    ctx
      .command(`${this.config.commandName} [...tags:string]`, '获取随机图片')
      .usage(
        `从各个图源中随机获取一张随机图片。图源可以用 ${this.config.commandName}.sources 查询。参数均为可选。`,
      )
      .option(
        'source',
        `-s <source:string>  指定图源，逗号分隔。图源可以用 ${this.config.commandName}.sources 查询。`,
      )
      .example(`${this.config.commandName} 获取一张随机图片。`)
      .example(`${this.config.commandName} yuyuko 获取一张 yuyuko 标签的图片。`)
      .example(
        `${this.config.commandName} -s yande 获取一张 yande 图源的图片。`,
      )
      .example(
        `${this.config.commandName} -s yande yuyuko saigyouji 从 yande 图源中获取一张具有 yuyuko 以及 saigyouji 标签的图。`,
      )
      .action(async (argv, ...picTags) => {
        const sourceTags = argv.options.source
          ? argv.options.source.split(/[ ,+\uFF0C\uFF0B\u3001]/)
          : [];
        picTags ||= [];
        const result = await this.randomPic(picTags, sourceTags);
        if (!result) {
          return argv.session.text('.not-found');
        }
        const picData: segment.Data = {
          url: result.url,
          cache: true,
        };
        if (this.config.preseveFilename) {
          picData.file = result.url.split('/').pop();
        }
        let msg = segment('image', picData);
        if (result.description) {
          msg += `\n${result.description}`;
        }
        if (this.assets) {
          msg = await this.assets.transform(msg);
        }
        return msg;
      })
      .subcommand('.sources [...tags:string]', '查询图源列表')
      // .option('source', '-s <source:string>  要查询的图源标签，逗号分隔。')
      .usage('图源标签可用于图片获取的图源筛选。')
      .example(`${this.config.commandName}.sources 查询全部的图源。`)
      .example(`${this.config.commandName} pixiv 查询含有 pixiv 标签的图源。`)
      .action(async (argv, ...sourceTags) => {
        sourceTags ||= [];
        const sources = this.pickAvailableSources(sourceTags, true);
        return `${argv.session.text('.list')}\n${sources
          .map((s) => s.getDisplayString())
          .join('\n')}`;
      });
  }
}
