import { Awaitable } from 'koishi';
import { ClassType, SchemaClass, SchemaProperty } from 'koishi-thirdeye';
import { Context } from 'vm';

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

  SchemaProperty({
    type: SchemaClass(instanceConfig),
    default: [],
    array: true,
  })(instanceConfigClass.prototype, 'instances');
  return instanceConfigClass;
}

export function ClonePlugin<P extends { new (...args: any[]): any }>(
  target: P,
  name: string,
): P {
  const pluginName = target.name;
  const clonedPlugin = class extends target {};
  for (const property of ['Config', 'schema', 'using']) {
    Object.defineProperty(clonedPlugin, property, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: target[property],
    });
  }
  Object.defineProperty(clonedPlugin, 'name', {
    enumerable: true,
    configurable: true,
    writable: true,
    value: pluginName,
  });
  return clonedPlugin;
}

export type TypeFromClass<T> = T extends { new (...args: any[]): infer U }
  ? U
  : never;
