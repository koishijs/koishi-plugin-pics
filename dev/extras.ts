import { Awaitable, Context } from 'koishi';
import { PicResult, PicSource } from '../src';

class TestPicsource extends PicSource {
  constructor(ctx: Context, public name: string) {
    super(ctx);
  }
  isDefault = true;
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
    ctx.pics.addSource(new TestPicsource(ctx, 'zh-CN'));
    ctx.pics.addSource(new TestPicsource(ctx, 'en-US'));
  }

  static using = ['pics'] as const;
}
