# koishi-plugin-pics

Koishi 的随机图片插件

## 安装

### npm

```bash
npm install koishi-plugin-pics
```

## 命令

### 获取随机图片

```
pic
获取随机图片
从各个图源中随机获取一张随机图片。图源可以用 pic.sources 查询。参数均为可选。
可用的选项有：
-s, --source <source> 指定图源，逗号分隔。图源可以用 ${this.config.commandName}.sources 查询。
-t, --tag <tag> 需要查询的图片标签，逗号分隔。
使用示例：
pic -s pixiv -t yuyuko 从 pixiv 图源中获取一张具有 yuyuko 标签的图。
可用的子指令有：
pic.sources 查询图源列表
```

### 查询图源列表

```
pic.sources
查询图源列表
图源标签可用于图片获取的图源筛选。
可用的选项有：
-s, --source <source> 要查询的图源标签，逗号分隔。
使用示例：
pic.sources 查询全部的图源。 pic -s pixiv 查询含有 pixiv 标签的图源。
```

## 图源

图源由其他 Koishi 插件提供。这些插件需要实现 `PicSource` 类，并使用 `ctx.pics.addSource(picSource, ctx)` 进行注入。

### 图源插件

下面是一些开箱即用的图源。如果你希望你编写的图源插件在此处列出，欢迎提交 Pull Request 或发邮件给 `nanahira@momobako.com` 。

* [`koishi-plugin-picsource-localfs`](https://github.com/koishijs/koishi-plugin-picsource-localfs) 本地文件图源。

* [`koishi-plugin-picsource-lolicon`](https://github.com/koishijs/koishi-plugin-picsource-lolicon) [Lolicon](https://api.lolicon.app/ ) 图源。

* [`koishi-plugin-picsource-heisi`](https://github.com/koishijs/koishi-plugin-picsource-localfs) 黑丝图源。

* [`koishi-plugin-picsource-yande`](https://github.com/koishijs/koishi-plugin-picsource-lolicon) [Yande](https://yande.re/) 以及 [Konachan](https://konachan.com) 图源。

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

```ts
import { Context } from "koishi";
import { DefinePlugin, Provide } from "koishi-thirdeye";
import { PicSource, PicsContainer } from "koishi-plugin-pics";


@DefinePlugin({ name: 'my-picsource', schema: Config })
export default class MyPicSource extends PicSource {
  constructor(ctx: Context, config: Partial<Config>) {
    super(ctx);
  }

  @Inject(true)
  private pics: PicsContainer;

  randomPic(tags: string[]) {
    return { url: 'https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/10000.jpg', description: '图片介绍' }
  }

  onApply() {
    this.config.applyTo(this);
    this.pics.addSource(this);
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

[`schemastery-gen`](https://code.mycard.moe/3rdeye/schemastery-gen) 或 ['koishi-thirdeye'](https://code.mycard.moe/3rdeye/koishi-thirdeye) 用户可以使用 `PicSourceConfig` 类。插件的配置文件直接继承该类即可。

> `schemastery-gen` 包请**不要**使用 Webpack 打包。使用 Webpack 编写插件的用户请把该包列为 external 。

```ts
export class PicSourceConfig {
  @DefineSchema({ type: 'string', default: [], desc: '图源标签' })
  tags: string[];
  @DefineSchema({ default: 1, desc: '图源权重' })
  weight: number;
  @DefineSchema({ default: 1, desc: '图源名称', required: true })
  name: string;
  @DefineSchema({ desc: '图源描述' })
  description?: string;
  @DefineSchema({ desc: '是否为默认图源' })
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
