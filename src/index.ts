// import 'source-map-support/register';
import { Context, Random, Logger, remove, Session, Dict } from 'koishi';
import { PicsPluginConfig } from './config';
import _ from 'lodash';
import { segment, Quester, Element } from 'koishi';
import {
  StarterPlugin,
  Caller,
  CommandExample,
  CommandLocale,
  DefinePlugin,
  Inject,
  InjectLogger,
  LifecycleEvents,
  Provide,
  PutArgs,
  PutOption,
  PutRenderer,
  Renderer,
  UseCommand,
  UseComponent,
} from 'koishi-thirdeye';
import { PicAssetsTransformMiddleware } from './middlewares/assets';
import { PicDownloaderMiddleware } from './middlewares/download';
import { PicMiddleware, PicNext, PicResult } from './def';
import { PicSource } from './picsource';
import FileType from 'file-type';
import path from 'path';
import ext2mime from 'ext2mime';
import * as fs from 'fs';
export * from './config';
export * from './middleware';
export * from './picsource';
export * from './def';

declare module 'koishi' {
  interface Context {
    pics: PicsContainer;
  }
}

@Provide('pics', { immediate: true })
@DefinePlugin({ name: 'pics' })
export default class PicsContainer
  extends StarterPlugin(PicsPluginConfig)
  implements LifecycleEvents
{
  private sources = new Map<PicSource, () => boolean>();
  private picMiddlewares: PicMiddleware[] = [];

  @Caller()
  private caller: Context;

  @InjectLogger()
  private logger: Logger;

  @Inject(true)
  private http: Quester;

  private _http: Quester;

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

  middleware(mid: PicMiddleware, targetCtx?: Context) {
    const processingCtx: Context = targetCtx || this.caller;
    mid.name ||= processingCtx.state?.runtime?.plugin?.name;
    const disposable = processingCtx.on('dispose', () => {
      disposable();
      this.removeMiddlware(mid);
    });
    if (mid.prepend) {
      this.picMiddlewares.unshift(mid);
    } else {
      this.picMiddlewares.push(mid);
    }
  }

  removeMiddlware(mid: PicMiddleware) {
    remove(this.picMiddlewares, mid);
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

  async urlToBuffer(url: string): Promise<{ buffer: Buffer; mime: string }> {
    if (url.startsWith('base64://')) {
      const buf = Buffer.from(url.slice(9), 'base64');
      const type = await FileType.fromBuffer(buf);
      return { buffer: buf, mime: type?.mime || 'application/octet-stream' };
    }
    if (url.startsWith('file://')) {
      const filePath = url.slice(7);
      const buf = await fs.promises.readFile(filePath);
      const mime =
        ext2mime(path.extname(filePath)) ||
        (await FileType.fromBuffer(buf)).mime;
      return { buffer: buf, mime };
    }
    const data = await this._http.file(url);
    return {
      buffer: data.data as Buffer,
      mime: data.mime,
    };
  }

  async bufferToUrl(buffer: Buffer, mime?: string) {
    if (!mime) {
      const result = await FileType.fromBuffer(buffer);
      if (result) {
        mime = result.mime;
      } else {
        mime = 'application/octet-stream';
      }
    }
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  async download(url: string) {
    if (url.startsWith('base64://')) {
      return this.bufferToUrl(Buffer.from(url.slice(9), 'base64'));
    }
    const data = await this.urlToBuffer(url);
    return this.bufferToUrl(data.buffer, data.mime);
  }

  async resolveUrl(url: string, middlewares = this.picMiddlewares) {
    if (!middlewares.length) {
      return url;
    }
    const next: PicNext = async (nextUrl) => {
      nextUrl ||= url;
      const nextResult = await this.resolveUrl(nextUrl, middlewares.slice(1));
      return nextResult || nextUrl;
    };
    try {
      let result = await middlewares[0].use(url, next);
      if (!result) {
        this.logger.warn(
          `Got empty result from middleware ${middlewares[0].name || '???'}`,
        );
        result = url;
      }
      return result;
    } catch (e) {
      this.logger.warn(`Resolve url ${url} failed: ${e.toString()}`);
      return url;
    }
  }

  async getSegment(url: string) {
    url = await this.resolveUrl(url);
    return segment.image(url);
  }

  private installDefaultMiddlewares() {
    if (this.config.useAssets) {
      this.ctx.plugin(PicAssetsTransformMiddleware);
    }
    if (this.config.useBase64) {
      this.ctx.plugin(PicDownloaderMiddleware);
    }
  }

  @UseCommand('{{commandName}} [...tags:string]')
  @CommandLocale('zh', {
    description: '获取随机图片',
    options: {
      source: `指定图源，逗号分隔。图源可以用 {{commandName}}.sources 查询。`,
    },
    usage: `从各个图源中随机获取一张随机图片。图源可以用 {{commandName}}.sources 查询。参数均为可选。`,
    messages: {
      'not-found': '未找到任何图片。',
    },
  })
  @CommandLocale('en', {
    description: 'Get random picture',
    options: {
      source: `Specify the source, separated by comma. You can query the sources with {{commandName}}.sources.`,
    },
    usage: `Get a random picture from a random source. Sources can be queried with command {{commandName}}.sources`,
    messages: {
      'not-found': 'No pictures found.',
    },
  })
  @CommandExample(`{{commandName}}`)
  @CommandExample(`{{commandName}} yuyuko`)
  @CommandExample(`{{commandName}} -s yande`)
  @CommandExample(`{{commandName}} -s yande yuyuko saigyouji`)
  async onPic(
    @PutOption('source', `-s <source>`) source: string,
    @PutArgs() picTags: string[],
    @PutRenderer('.not-found') notFound: Renderer,
  ) {
    const sourceTags = source?.split(/[ ,+\uFF0C\uFF0B\u3001]/) || [];
    picTags ||= [];
    const result = await this.randomPic(picTags, sourceTags);
    if (!result) {
      return notFound();
    }

    let msg = (await this.getSegment(result.url)).toString();
    if (result.description) {
      msg += `\n${result.description}`;
    }
    return msg;
  }

  @UseCommand('{{commandName}}.sources')
  @CommandLocale('zh', {
    description: '查询图源列表',
    options: {},
    usage: '图源标签可用于图片获取的图源筛选。',
    messages: {
      list: '图源的列表如下:',
    },
  })
  @CommandLocale('en', {
    description: 'Query picture sources',
    options: {},
    usage: 'Source tags can be used to filter picture sources.',
    messages: {
      list: 'List of sources:',
    },
  })
  @CommandExample(`{{commandName}}.sources`)
  @CommandExample(`{{commandName}}.sources pixiv`)
  async onQuerySource(
    @PutArgs() sourceTags: string[],
    @PutRenderer('.list') list: Renderer,
  ) {
    sourceTags ||= [];
    const sources = this.pickAvailableSources(sourceTags, true);
    return `${list()}\n${sources.map((s) => s.getDisplayString()).join('\n')}`;
  }

  onApply() {
    this._http = this.http.extend(this.config.httpConfig);
    this.installDefaultMiddlewares();
  }

  @UseComponent('pics')
  async picsComponent(attrs: Dict<any>, children: Element[], session: Session) {
    const tags = attrs.tags?.split(/[ ,+\uFF0C\uFF0B\u3001]/) || [];
    const sourceTags = attrs.source?.split(/[ ,+\uFF0C\uFF0B\u3001]/) || [];
    const result = await this.randomPic(tags, sourceTags);
    if (!result) {
      return attrs.fallback || '';
    }
    const segment = await this.getSegment(result.url);
    if (result.description) {
      segment.attrs.description = result.description;
    }
    return segment;
  }
}
