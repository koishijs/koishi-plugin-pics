# 贡献代码

如果你对本插件有任何的意见建议，欢迎开启 issue 进行说明，或者你也可以直接贡献代码。

由于 pics 设计为可插拔式的框架，当前仓库仅实现了发送图片的功能，而获取图源的能力则完全由其他插件所实现（下称图源插件）。因此你可以选择向 pics（即本仓库）贡献代码，也可以开发新的图源插件，或向现有的图源插件贡献代码。

## 向当前仓库贡献代码

本仓库采用了 [koishi-thirdeye](https://koishi.js.org/about/decorator) 进行开发，思路与理念与传统的 koishi 插件并不相同，在贡献代码之前请先了解双方的异同。

## 图源插件

图源是一类 `koishi-plugin-pics` 的附属插件，由其他 Koishi 插件提供。这些插件需要实现 `PicSource` 类，并使用 `ctx.pics.addSource(picSource, ctx)` 进行注入。

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

对于单图源的插件，我们提供了 `PicSourcePlugin` 基类工厂函数，只需要继承该类即可快速开发单图源插件。

```ts
import { Context } from "koishi";
import { DefinePlugin, RegisterSchema, SchemaProperty, LifecycleEvents } from "koishi-thirdeye";
import { PicSourcePlugin, PicsContainer } from "koishi-plugin-pics";

@RegisterSchema()
export class Config {
  @SchemaProperty({ default: 'my-source' }) // 推荐覆盖该属性以提供默认值
  name: string;
  
  @SchemaProperty({ default: 10000 })
  code: number;
}


@DefinePlugin()
export default class MyPicSource extends PicSourcePlugin(Config) {
  async randomPic(tags: string[]) {
    return { url: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${this.config.code}.jpg`, description: `${this.config.code}` };
  }
}

// 加载图源插件
ctx.plugin(MyPicSource, { 
  code: 10000, 
  name: 'my-picsource', 
  description: 'my-picsource' 
});
```

#### 多图源

使用 koishi-thirdeye 提供的 `MultiInstancePlugin` 方法创建多图源插件。该插件的配置具有 `instances` 数组属性，每一项都是一个图源的配置。

```ts
import { Context } from "koishi";
import { DefinePlugin, RegisterSchema, SchemaProperty, LifecycleEvents } from "koishi-thirdeye";
import { PicSourcePlugin, PicsContainer } from "koishi-plugin-pics";

@RegisterSchema()
export class Config {
  @SchemaProperty({ default: 'my-source' }) // 推荐覆盖该属性以提供默认值
  name: string;
  
  @SchemaProperty({ default: 10000 })
  code: number;
}

// 不 default
@DefinePlugin()
export class MyPicSource extends PicSourcePlugin(Config) {
  async randomPic(tags: string[]) {
    return { url: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${this.config.code}.jpg`, description: `${this.config.code}` };
  }
}

// 在这里 default 加载插件
export default class MyMultiPicSource extends MultiInstancePlugin(MyPicSource) {}

// 加载图源插件
ctx.plugin(MyMultiPicSource, { 
  instances: [
    {
      code: 10000, 
      name: 'my-picsource1', 
      description: 'my-picsource1',
    },
    {
      code: 10001, 
      name: 'my-picsource2', 
      description: 'my-picsource2',
    },
  ].
});
```

### Schema 定义

图源配置会自动注入到图源插件的配置类中。

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

## 图像中间件

和图源类似，图像中间件是 `koishi-plugin-pics` 的另一类附属插件，可以对图源获取的随机 URL 在发送给用户之前进行一定的变换。

### 图像中间件系统

图像中间件系统使用洋葱模型的方式进行处理。每一层处理的过程中，可以使用 `next(url?: string)` 函数进行后续的操作，并得到后续结果的返回值，再进行进一步的处理。

`next` 函数中的 `url` 参数可以对进行后续操作的初始 URL 值进行控制。若不填写，则与本中间件的传入 URL 值相同。

### 开发图像中间件插件

图像中间件插件需要使用 [koishi-thirdeye](https://koishi.js.org/about/decorator) 进行开发。请在开发之前阅读相关相关文档。推荐在 `package.json` 的 `keywords` 内写上 `required:pics` 以保证正确被 Koishi 插件市场搜索。

#### 插件基类

图源中间件插件需要继承 `PicMiddlewareBase<Config>` 类，覆盖 `use` 方法，并使用 `@DefinePlugin()` 进行修饰。

该基类具有这些预定义属性，可以直接使用。

* `pics`: `koishi-plugin-pics` 服务本身，并已标记为 `using` 依赖。

* `logger`: 日志记录器。

#### 配置基类

配置基类定义如下。定义插件时该类的属性会自动注入到配置类内。

```ts
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
```

### 插件示例

下例图像中间件插件会将所有 URL 进行预先下载，并使用 `download` 方法转换为 `base64://` 形式的 URL，即为 `koishi-plugin-pics` 中 `useBase64` 选项的功能。事实上，`koishi-plugin-pics` 中的 `useAssets` 和 `useBase64` 这两个选项的功能，都是由内置图像中间件实现的。

```ts
export class Config {
  @SchemaProperty({ type: Schema.object() })
  axiosConfig: AxiosRequestConfig;
}

@DefinePlugin()
export default class PicDownloaderMiddleware extends PicMiddlewarePlugin(Config) {
  override async use(url: string, next: PicNext) {
    const downloadedUrl = await this.pics.download(url, config.axiosConfig);
    return next(downloadedUrl);
  }
}
```
