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

由于 pics 仅仅是一个随机图片的插件框架，你必须添加至少一个图源插件才能使用。此处以 [koishi-plugin-picsource-lolicon](https://npmjs.com/package/koishi-plugin-picsource-lolicon) 和 [koishi-plugin-picsource-yande](https://npmjs.com/package/koishi-plugin-picsource-yande) 为例，你可以在插件市场搜索相应的名字或者使用 yarn 直接安装。

此外，在开始启动之前，你还需要添加一些配置，告诉 pics 插件有哪些图源插件可以使用，以及每个图源插件的配置。对于配置项的详细说明，请参考[配置](#配置)。

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
  picsource-yande: # Yande 图源插件
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

```text
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

```text
pic.sources
查询图源列表
图源标签可用于图片获取的图源筛选。
可用的选项有：
-s, --source <source> 要查询的图源标签，逗号分隔。
使用示例：
pic.sources 查询全部的图源。 pic -s pixiv 查询含有 pixiv 标签的图源。
```

## 配置

koishi-plugin-pics 的配置如下表所示：

|参数|类型|是否必选|描述|
|:-:|:-:|:-:|:-:|
|commandName|string|否|指令名称，默认为 pic。|

图源相关的配置由图源插件自定义，但 pics 插件会在其基础上添加以下几个字段：

|参数|类型|是否必选|描述|
|:-:|:-:|:-:|:-:|
|name|string|是|图源名称|
|tags|string[]|否|图源标签|
|weight|number|否|图源权重，越大优先级越高|
|description|string|否|图源的描述|
|isDefault|boolean|否|是否默认图源，若设置为 false 或不设置，则需要通过 `-s` 选项指定图源才能调用|

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

## 作为 koishi 服务提供接口

`pics` 导出 `PicsContainer` 类作为 koishi 的服务，因此你可以在其他插件中通过 `ctx.pics` 访问其接口。例如，当你需要随机图片时，可以调用 `ctx.pics.randomPic()` 方法获取。

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

## 贡献代码

如果你想要向本插件贡献代码，或开发新的图源插件，请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。
