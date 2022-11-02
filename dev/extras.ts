import { Awaitable, Context, Schema } from 'koishi';
import {
  DefinePlugin,
  MultiInstancePlugin,
  RegisterSchema,
  SchemaProperty,
} from 'koishi-thirdeye';
import {
  PicResult,
  PicSource,
  PicSourceConfig,
  PicSourceInfo,
  PicSourcePlugin,
  PlainPicSourcePlugin,
} from '../src';

@RegisterSchema()
class Config {
  @SchemaProperty({ default: 'zh-CN' })
  name: string;

  @SchemaProperty({ default: 'https://cdn02.moecube.com:444' })
  endpoint: string;
}

@DefinePlugin()
class TestPicSourcePlugin extends PicSourcePlugin(Config) {
  randomPic(picTags: string[]): Awaitable<PicResult> {
    return {
      url: `${this.config.endpoint}/images/ygopro-images-${this.name}/${
        picTags[0] || '10000'
      }.jpg`,
      description: picTags[0] || '10000',
    };
  }
}

const plainBase = PlainPicSourcePlugin({
  name: Schema.string().default('zh-CN'),
  endpoint: Schema.string().default('https://cdn02.moecube.com:444'),
});

class TestPlainPicSourcePlugin extends plainBase {
  static using = ['pics'] as const;
  static Config = plainBase.Config;
  randomPic(picTags: string[]): Awaitable<PicResult> {
    return {
      url: `${this.config.endpoint}/images/ygopro-images-${this.name}/${
        picTags[0] || '10000'
      }.jpg`,
      description: picTags[0] || '10000',
    };
  }
}

@DefinePlugin()
export class TestMultiPicSourcePlugin extends MultiInstancePlugin(
  TestPicSourcePlugin,
) {}

export default class ExtrasInDev {
  constructor(ctx: Context) {
    ctx.plugin(TestPicSourcePlugin, {
      // name: 'zh-CN',
      isDefault: true,
      // endpoint: 'https://cdn02.moecube.com:444',
    });
  }

  static using = ['pics'] as const;
}
