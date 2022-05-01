import { Schema } from 'koishi';
import { Awaitable, Context } from 'koishi';
import { DefinePlugin } from 'koishi-thirdeye';
import {
  DefineMultiSourcePlugin,
  PicResult,
  PicSourceConfig,
  PicSourcePlugin,
} from '../src';

@DefinePlugin({ name: 'test-source', schema: PicSourceConfig })
class TestPicSourcePlugin extends PicSourcePlugin {
  randomPic(picTags: string[]): Awaitable<PicResult> {
    return {
      url: `https://cdn02.moecube.com:444/images/ygopro-images-${this.name}/${
        picTags[0] || '10000'
      }.jpg`,
      description: picTags[0] || '10000',
    };
  }
}

export class TestMultiPicSourcePlugin extends DefineMultiSourcePlugin(
  TestPicSourcePlugin,
  PicSourceConfig,
) {}

console.log((TestMultiPicSourcePlugin['Config'] as Schema).dict.instances.type);

export default class ExtrasInDev {
  constructor(ctx: Context) {
    ctx.plugin(TestMultiPicSourcePlugin, {
      instances: [{ name: 'zh-CN', isDefault: true }, { name: 'en-US' }],
    });
  }

  static using = ['pics'] as const;
}
