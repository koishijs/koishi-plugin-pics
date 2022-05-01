import { DefinePlugin, Inject } from 'koishi-thirdeye';
import { Assets } from 'koishi';
import { PicMiddlewareBase } from '../middleware';
import { PicMiddlewareConfig } from '../config';
import { PicNext } from '../def';

@DefinePlugin({ schema: PicMiddlewareConfig })
export class PicAssetsTransformMiddleware extends PicMiddlewareBase {
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
