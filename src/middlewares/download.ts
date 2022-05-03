import { DefinePlugin } from 'koishi-thirdeye';
import { PicMiddlewarePlugin } from '../middleware';
import { PicNext } from '../def';

@DefinePlugin()
export class PicDownloaderMiddleware extends PicMiddlewarePlugin() {
  override async use(url: string, next: PicNext) {
    const downloadedUrl = await this.pics.download(url);
    return next(downloadedUrl);
  }
}
