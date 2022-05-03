import { DefinePlugin, Inject } from 'koishi-thirdeye';
import { Assets } from 'koishi';
import { PicNext } from '../def';
import { PicMiddlewarePlugin } from '../middleware';

@DefinePlugin()
export class PicAssetsTransformMiddleware extends PicMiddlewarePlugin() {
  @Inject()
  private assets: Assets;

  override async use(url: string, next: PicNext) {
    if (!this.assets) {
      return next();
    }
    const transformed = await this.assets.upload(url, undefined);
    return next(transformed);
  }
}
