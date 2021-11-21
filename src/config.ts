import 'source-map-support/register';
import { DefineSchema, RegisterSchema, schemaFromClass } from 'schemastery-gen';
import { Schema } from 'koishi';

@RegisterSchema()
export class PicsPluginConfig {
  @DefineSchema({ desc: '命令名', default: 'pic', hidden: true })
  commandName: string;

  @DefineSchema({
    desc: '获取失败的提示信息',
    default: '未找到任何图片。',
    hidden: true,
  })
  failedMessage: string;
}

export type PicsPluginConfigLike = Partial<PicsPluginConfig>;

// For convenience of plugins

export interface PicSourceInfo {
  tags?: string[];
  weight?: number;
  name: string;
  description?: string;
  default?: boolean;
}

export class PicSourceConfig implements PicSourceInfo {
  @DefineSchema({ type: 'string', default: [], desc: '图源标签' })
  tags: string[];
  @DefineSchema({ default: 1, desc: '图源权重' })
  weight: number;
  @DefineSchema({ default: 1, desc: '图源名称', required: true })
  name: string;
  @DefineSchema({ desc: '图源描述' })
  description?: string;
  @DefineSchema({ desc: '是否为默认图源' })
  default?: boolean;

  // 给目标对象注入上述对象。
  applyTo(target: PicSourceInfo) {
    target.tags = this.tags;
    target.weight = this.weight;
    target.name = this.name;
    target.description = this.description;
    target.default = this.default;
  }
}

export const PicSourceSchema = schemaFromClass(PicSourceConfig);
