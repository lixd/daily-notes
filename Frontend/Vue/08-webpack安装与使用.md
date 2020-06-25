# 安装 WebPack

## 概述

WebPack 是一款模块加载器兼打包工具，它能把各种资源，如 JS、JSX、ES6、SASS、LESS、图片等都作为模块来处理和使用。

## 安装

```bash
npm install webpack -g
npm install webpack-cli -g
```

## 配置

创建 `webpack.config.js` 配置文件

- entry：入口文件，指定 WebPack 用哪个文件作为项目的入口
- output：输出，指定 WebPack 把处理完成的文件放置到指定路径
- module：模块，用于处理各种类型的文件
- plugins：插件，如：热更新、代码重用等
- resolve：设置路径指向
- watch：监听，用于设置文件改动后直接打包

```javascript
module.exports = {
    entry: "",
    output: {
        path: "",
        filename: ""
    },
    module: {
        loaders: [
            {test: /\.js$/, loader: ""}
        ]
    },
    plugins: {},
    resolve: {},
    watch: true
}
```

## 执行

直接运行 `webpack` 命令打包

# 使用 WebPack

## 概述

使用 WebPack 打包项目非常简单，主要步骤如下：

- 创建项目
- 创建一个名为 `modules` 的目录，用于放置 JS 模块等资源文件
- 创建模块文件，如 `hello.js`，用于编写 JS 模块相关代码
- 创建一个名为 `main.js` 的入口文件，用于打包时设置 `entry` 属性
- 创建 `webpack.config.js` 配置文件，使用 `webpack` 命令打包
- 创建 HTML 页面，如 `index.html`，导入 WebPack 打包后的 JS 文件
- 运行 HTML 看效果

## 模块代码

创建一个名为 `hello.js` 的 JavaScript 模块文件，代码如下：

```javascript
exports.sayHi = function () {
  document.write("<div>Hello WebPack</div>");
};
```

## 入口代码

创建一个名为 `main.js` 的 JavaScript 入口模块，代码如下：

```javascript
var hello = require("./hello");
hello.sayHi();
```

## 配置文件

创建名为 `webpack.config.js` 的配置文件，代码如下：

```javascript
module.exports = {
    entry: "./modules/main.js",
    output: {
        filename: "./js/bundle.js"
    }
};
```

## HTML

创建一个名为 `index.html`，代码如下：

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
<script src="dist/js/bundle.js"></script>
</body>
</html
```

## 打包

```bash
# 用于监听变化
webpack --watch
```

## 运行

运行 HTML 文件，你会在浏览器看到：

```html
Hello WebPack
```