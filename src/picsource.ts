import { Context, Awaitable, Logger } from 'koishi';
import {
  PartialDeep,
  InjectConfig,
  Inject,
  InjectLogger,
  BasePlugin,
} from 'koishi-thirdeye';
import PicsContainer from '.';
import { PicSourceConfig } from './config';
import { PicSourceInfo, PicResult, Instances } from './def';

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

export class PicSourcePlugin<
  C extends PicSourceConfig = PicSourceConfig,
> extends PicSource {
  constructor(ctx: Context, config: PartialDeep<C>) {
    super(ctx);
  }

  @InjectConfig()
  protected config: C;

  @Inject(true)
  protected pics: PicsContainer;

  @InjectLogger()
  protected logger: Logger;

  onApply() {
    this.config.applyTo(this);
    this.pics.addSource(this);
  }
}

export class MultiPicSourcePlugin<
  C extends PicSourceConfig = PicSourceConfig,
> extends BasePlugin<Instances<C>> {
  @Inject(true)
  protected pics: PicsContainer;

  @InjectLogger()
  protected logger: Logger;

  onApply() {
    const { instances } = this.config;
  }
}
