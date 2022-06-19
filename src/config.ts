// import 'source-map-support/register';
import { SchemaProperty, RegisterSchema, SchemaClass } from 'koishi-thirdeye';
import { Quester } from 'koishi';
import { PicMiddleware, PicMiddlewareInfo, PicSourceInfo } from './def';

@RegisterSchema()
export class PicsPluginConfig {
  constructor(config: Partial<PicsPluginConfig>) {}
  @SchemaProperty({ description: '指令名', default: 'pic', hidden: true })
  commandName: string;

  @SchemaProperty({
    description: 'Assets 服务可用时，使用 Assets 缓存图片。',
    default: true,
  })
  useAssets: boolean;

  @SchemaProperty({ description: '使用 Base64 发送图片结果。', default: false })
  useBase64: boolean;

  @SchemaProperty({ type: Quester.createSchema(), default: {} })
  httpConfig: Quester.Config;

  @SchemaProperty({
    description: 'OneBot 机器人永远使用 file 字段。',
    default: false,
  })
  preferFile: boolean;
}

export type PicsPluginConfigLike = Partial<PicsPluginConfig>;

// For convenience of plugins

export class PicSourceConfig implements PicSourceInfo {
  @SchemaProperty({ type: 'string', default: [], description: '图源标签' })
  tags: string[];
  @SchemaProperty({ default: 1, description: '图源权重' })
  weight: number;
  @SchemaProperty({ description: '图源名称', required: true })
  name: string;
  @SchemaProperty({ description: '图源描述' })
  description?: string;
  @SchemaProperty({ description: '是否为默认图源' })
  isDefault?: boolean;

  // 给目标对象注入上述对象。
  applyTo(target: PicSourceInfo) {
    target.tags = this.tags;
    target.weight = this.weight;
    target.name = this.name;
    target.description = this.description;
    target.isDefault = this.isDefault;
  }
}

export class PicMiddlewareConfig {
  constructor(config: PicMiddlewareInfo) {}
  @SchemaProperty({ description: '中间件名称。' })
  name: string;
  @SchemaProperty({ description: '是否在首位插入中间件。', default: false })
  prepend: boolean;

  applyTo(target: PicMiddleware) {
    target.name = this.name;
    target.prepend = this.prepend;
  }
}
