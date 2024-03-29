import { Context, Awaitable, Logger, Schema, Quester } from 'koishi';
import {
  PartialDeep,
  InjectConfig,
  Inject,
  InjectLogger,
  CreatePluginFactory,
  schemaFromClass,
  Apply,
  Reusable,
  SchemaClass,
} from 'koishi-thirdeye';
import PicsContainer from '.';
import { PicSourceConfig } from './config';
import { PicSourceInfo, PicResult } from './def';

export class PicSource implements PicSourceInfo {
  constructor(public ctx: Context) {}
  tags: string[] = [];
  weight = 1;
  name = 'default';
  description = '';
  isDefault = false;

  applyConfig(src: Partial<PicSourceInfo>) {
    this.name = src.name;
    this.tags ??= src.tags;
    this.weight ??= src.weight;
    this.description ??= src.description;
    this.isDefault ??= src.isDefault;
  }

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

@Reusable()
export class BasePicSourcePlugin extends PicSource {
  constructor(ctx: Context, config: PartialDeep<PicSourceConfig>) {
    super(ctx);
  }

  http: Quester;

  @InjectConfig()
  config: PicSourceConfig;

  @Inject(true)
  pics: PicsContainer;

  @InjectLogger()
  logger: Logger;

  @Apply()
  initializeSource() {
    this.http = this.ctx.http.extend(this.config.http || {});
    this.config.applyTo(this);
    this.pics.addSource(this);
  }
}

export const PicSourcePlugin = CreatePluginFactory(
  BasePicSourcePlugin,
  PicSourceConfig,
);

export function PlainPicSourcePlugin<C>(dict: {
  [K in keyof C]: Schema<C[K]>;
}) {
  const Config = SchemaClass(PicSourceConfig) as unknown as Schema<
    PartialDeep<PicSourceConfig & C>,
    PicSourceConfig & C
  >;
  Object.assign(Config.dict, dict);
  return class PlainPicSourcePluginBase extends PicSource {
    http: Quester;
    config: PicSourceConfig & C;
    constructor(ctx: Context, config: PartialDeep<C & PicSourceConfig>) {
      super(ctx);
      this.config = config as PicSourceConfig & C;
      this.http = this.ctx.http.extend(this.config.http || {});
      this.applyConfig(config);
      ctx.pics.addSource(this);
    }
    static Config = Config;
    static using = ['pics'] as const;
    static reusable = true;
  };
}
