import { Awaitable, Context } from 'koishi';
import {
  DefinePlugin,
  MultiInstancePlugin,
  RegisterSchema,
  SchemaProperty,
} from 'koishi-thirdeye';
import { PicResult, PicSourceConfig, PicSourcePlugin } from '../src';

@RegisterSchema()
class Config extends PicSourceConfig {
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

@DefinePlugin()
export class TestMultiPicSourcePlugin extends MultiInstancePlugin(
  TestPicSourcePlugin,
) {}

export default class ExtrasInDev {
  constructor(ctx: Context) {
    ctx.plugin(TestMultiPicSourcePlugin, {
      instances: [
        {
          // name: 'zh-CN',
          isDefault: true,
          endpoint: 'https://cdn02.moecube.com:444',
        },
        {
          name: 'en-US',
        },
      ],
    });
  }

  static using = ['pics'] as const;
}
