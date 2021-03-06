// import 'source-map-support/register';
import { Context, Random, Logger, Bot, remove } from 'koishi';
import { PicsPluginConfig } from './config';
import _ from 'lodash';
import { segment, Quester } from 'koishi';
import {
  BasePlugin,
  Caller,
  CommandExample,
  CommandLocale,
  DefinePlugin,
  Inject,
  InjectLogger,
  LifecycleEvents,
  Provide,
  PutArgs,
  PutBot,
  PutOption,
  PutRenderer,
  Renderer,
  UseCommand,
} from 'koishi-thirdeye';
import { AxiosRequestConfig } from 'axios';
import { PicAssetsTransformMiddleware } from './middlewares/assets';
import { PicDownloaderMiddleware } from './middlewares/download';
import { PicMiddleware, PicNext, PicResult } from './def';
import { PicSource } from './picsource';
export * from './config';
export * from './middleware';
export * from './picsource';
export * from './def';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      pics: PicsContainer;
    }
  }
}

@Provide('pics', { immediate: true })
@DefinePlugin({ name: 'pics', schema: PicsPluginConfig })
export default class PicsContainer
  extends BasePlugin<PicsPluginConfig>
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

  isOneBotBot(bot?: Bot) {
    return (
      bot &&
      (bot.platform === 'onebot' ||
        (bot.platform === 'qqguild' && bot['parentBot']?.platform === 'onebot'))
    );
  }

  async urlToBuffer(url: string, extraConfig: AxiosRequestConfig = {}) {
    if (url.startsWith('base64://')) {
      return Buffer.from(url.slice(9), 'base64');
    }
    return this._http.get<Buffer>(url, {
      responseType: 'arraybuffer',
      ...extraConfig,
    });
  }

  bufferToUrl(buffer: Buffer) {
    return `base64://${buffer.toString('base64')}`;
  }

  async download(url: string, extraConfig: AxiosRequestConfig = {}) {
    if (url.startsWith('base64://')) {
      return url;
    }
    const buffer = await this.urlToBuffer(url, extraConfig);
    return this.bufferToUrl(buffer);
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

  async getSegment(url: string, bot?: Bot) {
    url = await this.resolveUrl(url);
    const picData: segment.Data = {
      [(url.startsWith('base64://') && this.isOneBotBot(bot)) ||
      this.config.preferFile
        ? 'file'
        : 'url']: url,
      cache: true,
    };
    return segment('image', picData);
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
    description: '??????????????????',
    options: {
      source: `????????????????????????????????????????????? {{commandName}}.sources ?????????`,
    },
    usage: `?????????????????????????????????????????????????????????????????? {{commandName}}.sources ??????????????????????????????`,
    messages: {
      'not-found': '????????????????????????',
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
    @PutBot() bot: Bot,
  ) {
    const sourceTags = source?.split(/[ ,+\uFF0C\uFF0B\u3001]/) || [];
    picTags ||= [];
    const result = await this.randomPic(picTags, sourceTags);
    if (!result) {
      return notFound();
    }

    let msg = await this.getSegment(result.url, bot);
    if (result.description) {
      msg += `\n${result.description}`;
    }
    return msg;
  }

  @UseCommand('{{commandName}}.sources')
  @CommandLocale('zh', {
    description: '??????????????????',
    options: {},
    usage: '???????????????????????????????????????????????????',
    messages: {
      list: '?????????????????????:',
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
}
