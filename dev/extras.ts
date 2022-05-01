import { Awaitable, Context } from 'koishi';
import { DefinePlugin } from 'koishi-thirdeye';
import { PicResult, PicSourceConfig, PicSourcePlugin } from '../src';

@DefinePlugin({ schema: PicSourceConfig })
class TestPicsource extends PicSourcePlugin {
  randomPic(picTags: string[]): Awaitable<PicResult> {
    return {
      url: `https://cdn02.moecube.com:444/images/ygopro-images-${this.name}/${
        picTags[0] || '10000'
      }.jpg`,
      description: picTags[0] || '10000',
    };
  }
}

export default class ExtrasInDev {
  constructor(ctx: Context) {
    ctx.plugin(TestPicsource, { name: 'zh-CN', isDefault: true });
  }

  static using = ['pics'] as const;
}
