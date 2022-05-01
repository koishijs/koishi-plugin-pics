import { DefinePlugin } from 'koishi-thirdeye';
import { PicMiddlewareBase } from '../middleware';
import { PicMiddlewareConfig } from '../config';
import { PicNext } from '../def';

@DefinePlugin({ schema: PicMiddlewareConfig })
export class PicDownloaderMiddleware extends PicMiddlewareBase {
  override async use(url: string, next: PicNext) {
    const downloadedUrl = await this.pics.download(url);
    return next(downloadedUrl);
  }
}
