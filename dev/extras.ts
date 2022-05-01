import { Schema } from 'koishi';
import { Awaitable, Context } from 'koishi';
import { DefinePlugin, RegisterSchema, SchemaProperty } from 'koishi-thirdeye';
import {
  DefineMultiSourcePlugin,
  PicResult,
  PicSourceConfig,
  PicSourcePlugin,
} from '../src';

@RegisterSchema()
class Config extends PicSourceConfig {
  @SchemaProperty({ default: 'https://cdn02.moecube.com:444' })
  endpoint: string;
}

@DefinePlugin({ name: 'test-source', schema: Config })
class TestPicSourcePlugin extends PicSourcePlugin<Config> {
  randomPic(picTags: string[]): Awaitable<PicResult> {
    return {
      url: `${this.config.endpoint}/images/ygopro-images-${this.name}/${
        picTags[0] || '10000'
      }.jpg`,
      description: picTags[0] || '10000',
    };
  }
}

export class TestMultiPicSourcePlugin extends DefineMultiSourcePlugin(
  TestPicSourcePlugin,
  Config,
) {}

console.log((TestMultiPicSourcePlugin['Config'] as Schema).dict.instances.type);

export default class ExtrasInDev {
  constructor(ctx: Context) {
    ctx.plugin(TestMultiPicSourcePlugin, {
      instances: [
        {
          name: 'zh-CN',
          isDefault: true,
          endpoint: 'https://cdn02.moecube.com:444',
        },
        { name: 'en-US' },
      ],
    });
  }

  static using = ['pics'] as const;
}
