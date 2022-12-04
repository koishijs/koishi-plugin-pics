import { DefinePlugin, Inject } from 'koishi-thirdeye';
import Assets from '@koishijs/assets';
import { PicNext } from '../def';
import { PicMiddlewarePlugin } from '../middleware';

@DefinePlugin()
export class PicAssetsTransformMiddleware extends PicMiddlewarePlugin() {
  @Inject()
  private assets: Assets;

  override async use(url: string, next: PicNext) {
    const finalUrl = await next(url);
    if (!this.assets) {
      return finalUrl;
    }
    return this.assets.upload(finalUrl, undefined);
  }
}
