import { Awaitable } from 'koishi';

export interface PicSourceInfo {
  tags?: string[];
  weight?: number;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface PicResult {
  url: string;
  description?: string;
}

export type PicNext = (url?: string) => Awaitable<string>;

export interface PicMiddleware extends PicMiddlewareInfo {
  use(url: string, next: PicNext): Awaitable<string>;
}

export interface PicMiddlewareInfo {
  name?: string;
  prepend?: boolean;
}
