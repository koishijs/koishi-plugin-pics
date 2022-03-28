// import 'source-map-support/register';
import { DefineSchema, RegisterSchema, SchemaClass } from 'koishi-thirdeye';

@RegisterSchema()
export class PicsPluginConfig {
  constructor(config: Partial<PicsPluginConfig>) {}
  @DefineSchema({ description: '指令名', default: 'pic', hidden: true })
  commandName: string;

  @DefineSchema({ description: '保留 URL 中的文件名。', default: false })
  preseveFilename: boolean;
}

export type PicsPluginConfigLike = Partial<PicsPluginConfig>;

// For convenience of plugins

export interface PicSourceInfo {
  tags?: string[];
  weight?: number;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export class PicSourceConfig implements PicSourceInfo {
  constructor(config: Partial<PicSourceInfo>) {}

  @DefineSchema({ type: 'string', default: [], description: '图源标签' })
  tags: string[];
  @DefineSchema({ default: 1, description: '图源权重' })
  weight: number;
  @DefineSchema({ default: 1, description: '图源名称', required: true })
  name: string;
  @DefineSchema({ description: '图源描述' })
  description?: string;
  @DefineSchema({ description: '是否为默认图源' })
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

export const PicSourceSchema = SchemaClass(PicSourceConfig);
