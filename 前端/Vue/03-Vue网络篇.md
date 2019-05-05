# 使用 Axios 实现异步通信

>  源码：[Github](https://github.com/illusorycloud/i-vue)

## 概述

Axios 是一个开源的可以用在浏览器端和 NodeJS 的异步通信框架，她的主要作用就是实现 AJAX 异步通信，其功能特点如下：

- 从浏览器中创建 `XMLHttpRequests`
- 从 `node.js` 创建 `http` 请求
- 支持 `Promise API`
- 拦截请求和响应
- 转换请求数据和响应数据
- 取消请求
- 自动转换 `JSON` 数据
- 客户端支持防御 `XSRF`（跨站请求伪造）

GitHub：`https://github.com/axios/axios`

## 为什么要使用 Axios

由于 Vue.js 是一个 **视图层框架** 并且作者（尤雨溪）严格准守 `SoC` （关注度分离原则），所以 Vue.js 并不包含 AJAX 的通信功能，为了解决通信问题，作者单独开发了一个名为 `vue-resource` 的插件，不过在进入 2.0 版本以后停止了对该插件的维护并推荐了 Axios 框架

## 例子

### 模拟数据

创建一个 json 文件，添加以下内容，模拟从服务端获取到的数据

```json
{
  "name": "illusory",
  "url": "http://www.lixueduan.com",
  "page": 12,
  "isNonProfit": true,
  "address": {
    "street": "江北区.",
    "city": "重庆",
    "country": "中国"
  },
  "links": [
    {
      "name": "Google",
      "url": "http://www.google.com"
    },
    {
      "name": "Baidu",
      "url": "http://www.baidu.com"
    },
    {
      "name": "SoSo",
      "url": "http://www.SoSo.com"
    }
  ]
}
```



###  HTML

```html
<div id="app">
    <div>名称：{{info.name}}</div>
    <div>URL：{{info.url}}</div>
    <ul>
        <li v-for="link in info.links">
            <div>名称：{{link.name}}</div>
            <div>链接：<a v-bind:href="link.url" target="_blank">{{link.url}}</a></div>
        </li>
    </ul>
</div>
```

注：在这里使用了 `v-bind` 将 `a:href` 的属性值与 Vue 实例中的数据进行绑定

### JavaScript

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data() {
            return {
                info: {
                    name: '',
                    url: '',
                    links: []
                }
            }
        },
        mounted() {
            axios
                .get('data.json')
                .then(response => this.info = response.data);
        }
    });
</script>
```

使用 `axios` 框架的 `get` 方法请求 AJAX 并自动将数据封装进了 Vue 实例的数据对象中

### 完整的HTML

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
<div id="app">
    <div>名称：{{info.name}}</div>
    <div>URL：{{info.url}}</div>
    <ul>
        <li v-for="link in info.links">
            <div>名称：{{link.name}}</div>
            <div>链接：<a v-bind:href="link.url" target="_blank">{{link.url}}</a></div>
        </li>
    </ul>
</div>
<script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data() {
            return {
                info: {
                    name: '',
                    url: '',
                    links: []
                }
            }
        },
        mounted() {
            axios
                .get('data.json')
                .then(response => this.info = response.data);
        }
    });
</script>
</body>
</html>
```

