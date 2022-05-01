import { Awaitable } from 'koishi';
import { ClassType, SchemaProperty } from 'koishi-thirdeye';

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

export interface Instances<T> {
  instances: T[];
}


export function ToInstancesConfig<T>(
  instanceConfig: ClassType<T>,
): new () => Instances<T> {
  const instanceConfigClass = class InstancesConfig {
    instances: T[];
  };

  SchemaProperty({ type: instanceConfig, default: [] })(
    instanceConfigClass.prototype,
    'instances',
  );
  return instanceConfigClass;
}
