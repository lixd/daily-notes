# Vue事件篇

> 源码：[Github](https://github.com/illusorycloud/i-vue)

## 监听事件

- `v-on`

### HTML

```html
<div id="app">
    <button v-on:click="sayHi();">点我</button>
</div>
```

注：在这里我们使用了 `v-on` 绑定了 `click` 事件，并指定了名为 `sayHi` 的方法

### JavaScript

```javascript
<script type="text/javascript">
    var vm=new Vue({
        el:'#app',
        data:{
            message:"Hello Message"
        },
        methods:{
            sayHi:function(event){
                alert(this.message);
            }
        }
    });
</script>
```

方法必须定义在 Vue 实例的 `methods` 对象中

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
    <button v-on:click="sayHi();">点我</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
<script type="text/javascript">
    var vm=new Vue({
        el:'#app',
        data:{
            message:"Hello Message"
        },
        methods:{
            sayHi:function(event){
                alert(this.message);
            }
        }
    });
</script>
</body>
</html>
```

