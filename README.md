# koishi-plugin-pics

Koishi 的随机图片插件

## 安装

你可以选择通过 koishi 的插件市场安装本插件，也可以使用 npm 或 yarn 等包管理器安装。

### 通过插件市场

如果你通过 koishi 的[模板项目](https://koishi.js.org/guide/introduction/template.html)创建了你的机器人项目，你可以直接从插件市场安装本插件。详情请参考[安装和配置插件](https://koishi.js.org/guide/introduction/template.html#%E5%AE%89%E8%A3%85%E5%92%8C%E9%85%8D%E7%BD%AE%E6%8F%92%E4%BB%B6)

### 通过包管理器

由于 koishi 现在的默认包管理器是 yarn，因此推荐使用 yarn 安装插件，当然，你也可以使用 npm 安装。

```bash
# 如果你使用 yarn
yarn add koishi-plugin-pics
# 如果你使用 npm
npm install koishi-plugin-pics
```

## 开始使用

由于 pics 仅仅是一个随机图片的插件框架，并不包含任何图源的实现，因此你必须添加至少一个图源插件才能开始使用。

### 图源插件

* [`koishi-plugin-picsource-localfs`](https://npmjs.com/package/koishi-plugin-picsource-localfs) 本地文件图源。

* [`koishi-plugin-picsource-lolicon`](https://npmjs.com/package/koishi-plugin-picsource-lolicon) [Lolicon](https://api.lolicon.app/ ) 图源。

* [`koishi-plugin-picsource-heisi`](https://npmjs.com/package/koishi-plugin-picsource-heisi) heisi 图源，基于 [nonebot_plugin_heisi](https://github.com/yzyyz1387/nonebot_plugin_heisi)。

* [`koishi-plugin-picsource-yande`](https://npmjs.com/package/koishi-plugin-picsource-yande) [Yandere](https://yande.re/) 及 [Konachan](https://konachan.com) 图源。

### 图源配置

在开始启动之前，你还需要添加一些配置，告诉 pics 插件有哪些图源插件可以使用，以及每个图源插件的配置。对于配置项的详细说明，请参考[配置](#配置)。

下面以 [`koishi-plugin-picsource-lolicon`](https://npmjs.com/package/koishi-plugin-picsource-lolicon) 和
[`koishi-plugin-picsource-yande`](https://npmjs.com/package/koishi-plugin-picsource-yande) 为例进行说明。

```yaml
# koishi.yml
plugins:
  pics:
    commandName: pic
  picsource-lolicon: # Lolicon 图源
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

成功启动 koishi 后，就可以使用指令 `pic` 获取一张随机图片，更多的选项可以参考下方[指令](#指令)章节。

## 指令

### 获取随机图片

```text
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

```text
pic.sources [...tags]
查询图源列表
图源标签可用于图片获取的图源筛选。

使用示例：
pic.sources 查询全部的图源。
pic.sources pixiv 查询含有 pixiv 标签的图源。
```

## 配置

### pics 配置

koishi-plugin-pics 的配置如下表所示：

|参数|类型|是否必选|描述|
|:-:|:-:|:-:|:-:|
|commandName|string|否|指令名称，默认为 pic。|
|useAssets|boolean|默认 `true`|Assets 服务可用时，使用 Assets 缓存图片。|
|useBase64|boolean|默认 `false`|使用 Base64 发送图片结果。|

### 图源插件通用配置

图源相关的配置由图源插件自定义，但 pics 插件会在其基础上添加以下几个字段：

|参数|类型|是否必选|描述|
|:-:|:-:|:-:|:-:|
|name|string|是|图源名称|
|tags|string[]|否|图源标签|
|weight|number|否|图源权重，越大优先级越高|
|description|string|否|图源的描述|
|isDefault|boolean|否|是否默认图源，若设置为 false 或不设置，则需要通过 `-s` 选项指定图源才能调用|

### 多图源的配置

有些图源插件可以配置不止一个图源，如 yande 支持 yande 和 konachan，这种情况下，你需要在 `instances` 数组里分别配置这些图源。

```yaml
# koishi.yml
plugins:
  picsource-yande:
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

## 作为 koishi 服务提供接口

`pics` 插件还导出了 `PicsContainer` 类作为 koishi 的服务，因此你可以在其他插件中通过 `ctx.pics` 访问其接口。例如，当你需要随机图片时，可以调用 `ctx.pics.randomPic()` 方法获取。

当你想要添加自己实现的图源时，也同样通过 `ctx.pics` 添加，详细信息请查看[贡献指南](./CONTRIBUTING.md)。

### API

#### 获取图片

* `randomPic(picTags: string[] = [], sourceTags: string[] = []): Promise<{ url: string, description?: string }>` 获取随机图片。

* `getSegment(url: string, bot?: Bot): Promise<string>` 从图片 URL 获取消息段。 **由于 OneBot 的一些对接原因，OneBot 机器人所使用的格式与其他机器人不同，因此需要传入机器人判别。**

#### 图源管理

* `addSource(source: PicSource)` 进行图源注册。会自动处理插件卸载相关逻辑。

#### 中间件管理

* `middleware(mid: PicMiddleware)` 注册图像处理中间件。

#### 辅助方法

* `urlToBuffer(url: string, extraConfig: AxiosRequestConfig = {}): Promise<Buffer>` 从图片 URL 下载为 Buffer 数据。

* `bufferToUrl(buffer: Buffer): string` 从 Buffer 转换为 `base64://` 形式的 URL。

* `download(url: string, extraConfig: AxiosRequestConfig = {})` 从图片 URL 转换为 `base64://` 形式的 URL。

### 示例

```ts
import type {} from 'koishi-plugin-pics'; // 你需要导入 pics 插件的类型定义

await ctx.pics.randomPic(['komeiji koishi'], ['lolicon']) //-> { url: string, description?: string }
```

## 贡献代码

如果你想要向本插件贡献代码，或开发新的图源插件，请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

本项目源码以 [MIT 协议](./LICENSE) 授权。
