import { Context, Awaitable, Logger } from 'koishi';
import {
  PartialDeep,
  InjectConfig,
  Inject,
  InjectLogger,
  CreatePluginFactory,
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

export class BasePicSourcePlugin extends PicSource {
  constructor(ctx: Context, config: PartialDeep<PicSourceConfig>) {
    super(ctx);
  }

  @InjectConfig()
  config: PicSourceConfig;

  @Inject(true)
  pics: PicsContainer;

  @InjectLogger()
  logger: Logger;

  onApply() {
    this.config.applyTo(this);
    this.pics.addSource(this);
  }
}

export const PicSourcePlugin = CreatePluginFactory(
  BasePicSourcePlugin,
  PicSourceConfig,
);
