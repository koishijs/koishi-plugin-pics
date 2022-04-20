import { DefinePlugin } from 'koishi-thirdeye';
import { PicMiddlewareBase, PicNext } from '../middleware';
import { PicMiddlewareConfig } from '../config';

@DefinePlugin({ schema: PicMiddlewareConfig })
export class PicDownloaderMiddleware extends PicMiddlewareBase {
  override async use(url: string, next: PicNext) {
    if (url.startsWith('base64://')) {
      return next();
    }
    const downloadedUrl = await this.pics.download(url);
    return next(downloadedUrl);
  }
}
