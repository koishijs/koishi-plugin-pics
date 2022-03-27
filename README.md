# koishi-plugin-pics

Koishi 的随机图片插件

## 安装

### npm

```bash
npm install koishi-plugin-pics
```

## 快速开始

```yaml
# koishi.yml
plugins:
  pics:
    commandName: pic
  picsource-lolicon: # Lolicon 图源
    $install: true
    $community: true
    name: lolicon
    r18: 2
    tags:
      - anime
      - 动漫
      - 二次元
    description: 'Lolicon API 的图'
    isDefault: true
    weight: 2
  picsource-yande: # Yande 图源插件
    $install: true
    $community: true
    instances:
      - name: yande # Yande 图源
        tags:
          - anime
          - foreign
          - 动漫
          - 二次元
        weight: 1
        isDefault: true
        description: 'Yande 的图'
        endpoint: https://yande.re/post.json
        pageLimit: 200
        useOriginal: true
      - name: konachan # Konachan 图源
        tags:
          - anime
          - foreign
          - 动漫
          - 二次元
        weight: 1
        isDefault: true
        description: 'Konachan 的图'
        endpoint: https://konachan.com/post.json
        pageLimit: 270
        useOriginal: true
```

安装后，可以使用指令 `pic` 获取一张随机图片，使用指令 `pic -t <tag>` 获取一张特定 tag 的图片，也可以使用 `pic -s konachan` 来获取 Konachan 的图片。

## 指令

### 获取随机图片

```
pic [...tags:string]
获取随机图片
从各个图源中随机获取一张随机图片。图源可以用 pic.sources 查询。参数均为可选。
可用的选项有：
-t, --tag <tag> 需要查询的图片标签，逗号分隔。
使用示例：
pic 获取一张随机图片。
pic yuyuko 获取一张 yuyuko 标签的图片。
pic -s yande 获取一张 yande 图源的图片。
pic -s yande yuyuko saigyouji 从 yande 图源中获取一张具有 yuyuko 以及 saigyouji 标签的图。
可用的子指令有：
pic.sources 查询图源列表
```

### 查询图源列表

```
pic.sources
查询图源列表
图源标签可用于图片获取的图源筛选。

使用示例：
pic.sources 查询全部的图源。
pic pixiv 查询含有 pixiv 标签的图源。
```

## 配置

koishi-plugin-pics 的配置仅有 `commandName` 一项，用于指定指令名称。

其余配置均在各图源中自定义。通常来说具有下面几个字段。

```ts
export interface PicSourceInfo {
  // 图源的标签列表，使用 -s 参数匹配。
  tags: string[];
  // 图源权重，权重越大随机到的概率越大，默认 1
  weight: number;
  // 图源名称。
  name: string;
  // 图源介绍
  description: string;
  // 是否为默认图源。用户未指定参数时使用默认图源。
  isDefault: boolean;
}
```

```yaml
plugins:
  pics:
    commandName: pic
  picsource-lolicon:
    $install: true
    $community: true
    name: lolicon
    r18: 2
    tags:
      - anime
      - 动漫
      - 二次元
    description: 'Lolicon API 的图'
    isDefault: true
    weight: 2
```

> 有些形如 yande 的图源插件，可能会配置多个图源。这时候每个图源都需要依照定义分开配置。

```yaml
# koishi.yml
plugins:
  pics:
    commandName: pic
  picsource-yande:
    $install: true
    $community: true
    instances:
      - name: yande # Yande 图源
        tags:
          - anime
          - foreign
          - 动漫
          - 二次元
        weight: 1
        isDefault: true
        description: 'Yande 的图'
        endpoint: https://yande.re/post.json
        pageLimit: 200
        useOriginal: true
      - name: konachan # Konachan 图源
        tags:
          - anime
          - foreign
          - 动漫
          - 二次元
        weight: 1
        isDefault: true
        description: 'Konachan 的图'
        endpoint: https://konachan.com/post.json
        pageLimit: 270
        useOriginal: true
```

## 图源

图源由其他 Koishi 插件提供。这些插件需要实现 `PicSource` 类，并使用 `ctx.pics.addSource(picSource, ctx)` 进行注入。

### 图源插件

下面是一些开箱即用的图源。如果你希望你编写的图源插件在此处列出，欢迎提交 Pull Request 或发邮件给 `nanahira@momobako.com` 。

* [`koishi-plugin-picsource-localfs`](https://github.com/koishijs/koishi-plugin-picsource-localfs) 本地文件图源。

* [`koishi-plugin-picsource-lolicon`](https://github.com/koishijs/koishi-plugin-picsource-lolicon) [Lolicon](https://api.lolicon.app/ ) 图源。

* [`koishi-plugin-picsource-heisi`](https://code.mycard.moe/3rdeye/koishi-plugin-picsource-heisi) 黑丝图源。

* [`koishi-plugin-picsource-yande`](https://code.mycard.moe/3rdeye/koishi-plugin-picsource-yande) [Yande](https://yande.re/) 以及 [Konachan](https://konachan.com) 图源。

### 类定义

图源插件推荐在 `package.json` 的 `keywords` 内写上 `required:pics` 以保证正确被 Koishi 插件市场搜索。

```ts
export interface PicResult {
  // 图片 URL
  url: string;
  // 图片介绍，会一并出现在底部
  description?: string;
}

export class PicSource {
  // 构造函数传入 ctx 对象
  constructor(ctx: Context);

  // 图源的标签列表，使用 -s 参数匹配。
  tags: string[];
  // 图源权重，权重越大随机到的概率越大，默认 1
  weight: number;
  // 图源名称。
  name: string;
  // 图源介绍
  description: string;
  // 是否为默认图源。用户未指定参数时使用默认图源。
  isDefault: boolean;

  // 获取随机图片。 picTags 可能是空数组。
  randomPic(picTags: string[]): PicResult | Promise<PicResult>;
  // 图源启动时运行，可选
  onStartup(): Awaitable<void>;
  // 图源卸载时运行，可选
  onShutdown(): Awaitable<void>;
}
```

### 插件示例

#### 单图源

```ts
import { Context } from "koishi";
import { DefinePlugin, RegisterSchema, SchemaProperty, LifecycleEvents } from "koishi-thirdeye";
import { PicSource, PicsContainer, PicSourceConfig } from "koishi-plugin-pics";

@RegisterSchema()
export class Config extends PicSourceConfig {
  @SchemaProperty({ default: 10000 })
  code: number;
}


@DefinePlugin({ name: 'my-picsource', schema: Config })
export default class MyPicSource extends PicSource implements LifecycleEvents {
  constructor(ctx: Context, config: Partial<Config>) {
    super(ctx);
  }

  @InjectConfig()
  private config: Config;

  @Inject(true)
  private pics: PicsContainer;

  async randomPic(tags: string[]) {
    return { url: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${this.config.code}.jpg`, description: `${this.config.code}` };
  }

  onApply() {
    this.config.applyTo(this);
    this.pics.addSource(this);
  }
}
```

#### 多图源

```ts
import { Context } from "koishi";
import { DefinePlugin, RegisterSchema, SchemaProperty, LifecycleEvents } from "koishi-thirdeye";
import { PicSource, PicsContainer, PicSourceConfig } from "koishi-plugin-pics";

@RegisterSchema()
export class InstanceConfig extends PicSourceConfig {
  @SchemaProperty({ default: 10000 })
  code: number;
}

@RegisterSchema()
export class Config {
  constructor(config: Partial<InstanceConfig>[]) {}

  @SchemaProperty({ type: InstanceConfig })
  instances: InstanceConfig[];
}


export default class MyPicSourceInstance extends PicSource {
  constructor(ctx: Context, config: Partial<Config>) {
    super(ctx);
    config.applyTo(this);
  }

  async randomPic(tags: string[]) {
    return { url: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${this.config.code}.jpg`, description: `${this.config.code}` };
  }
}


@DefinePlugin({ name: 'my-picsource', schema: Config })
export default class MyPicSource extends BasePlugin<Config> implements LifecycleEvents {

  @InjectConfig()
  private config: Config;

  @Inject(true)
  private pics: PicsContainer;

  onApply() {
    for (const instanceConfig of this.config.instances) {
      const instance = new MyPicSourceInstance(this.ctx, instanceConfig);
      this.pics.addSource(instance);
    }
  }
}
```

### 开箱即用的 Schema 定义

为了方便编写图源插件的配置部分，这里提供了一些开箱即用的配置文件 Schema 定义，可以从 `koishi-plugin-pics` 中导出。 

#### `PicSourceSchema`

包含下列字段的 Schema 定义，方便创建图源插件的配置。

```ts
export interface PicSourceInfo {
  // 图源的标签列表，使用 -s 参数匹配。
  tags: string[];
  // 图源权重，权重越大随机到的概率越大，默认 1
  weight: number;
  // 图源名称。
  name: string;
  // 图源介绍
  description: string;
  // 是否为默认图源。用户未指定参数时使用默认图源。
  isDefault: boolean;
}
```

同时 `PicSourceInfo` 也可以从 `koishi-plugin-pics` 中导出。

#### `PicSourceConfig`

[`schemastery-gen`](https://code.mycard.moe/3rdeye/schemastery-gen) 或 [`koishi-thirdeye`](https://code.mycard.moe/3rdeye/koishi-thirdeye) 用户可以使用 `PicSourceConfig` 类。插件的配置文件直接继承该类即可。

> 继承 `PicSourceConfig` 的类需要手动使用 `@RegisterSchema()` 装饰器将自身注册为 Schema 定义。

> `schemastery-gen` 包请**不要**使用 Webpack 打包。使用 Webpack 编写插件的用户请把该包列为 external 。

```ts
export class PicSourceConfig {
  @SchemaProperty({ type: 'string', default: [], desc: '图源标签' })
  tags: string[];
  @SchemaProperty({ default: 1, desc: '图源权重' })
  weight: number;
  @SchemaProperty({ default: 1, desc: '图源名称', required: true })
  name: string;
  @SchemaProperty({ desc: '图源描述' })
  description?: string;
  @SchemaProperty({ desc: '是否为默认图源' })
  isDefault?: boolean;

  // 给目标对象注入上述对象。
  applyTo(target: PicSourceInfo) {
    target.tags ||= this.tags;
    target.weight ||= this.weight;
    target.name ||= this.name;
    target.description ||= this.description;
    target.isDefault = this.isDefault;
  }
}
```

## 提供服务

`pics` 也作为服务导出。对于其他插件需要使用随机图片的场景，可以使用 `ctx.pics.randomPic()` 方法来获取随机图片。

> 若不希望注册随机图片指令，可以使用 `ctx.never().plugin('koishi-plugin-pics')` 来禁用指令注册。

### API

* `randomPic(picTags: string[] = [], sourceTags: string[] = []): Promise<{ url: string, description?: string }>`

### 示例

```ts
import { PicsContainer } from 'koishi-plugin-pics';
import { Inject, DefinePlugin } from 'koishi-thirdeye';

@DefinePlugin()
export default class SomePlugin {
  @Inject(true)
  private pics: PicsContainer;

  // ...

  // somewhere needed
  async getRandomPics(picTags: string[], sourceTags: string[] = []) {
    const pics = await this.pics.randomPic(picTags, sourceTags);
    return pics;
  }
}
```
