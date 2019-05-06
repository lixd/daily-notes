```
<div id="app">
    <div> 当前时间: {{getCurrentTime()}}</div>
    <div> 计算属性: {{getCurrentTime1}}</div>
</div>
```

# Vue布局篇

>  源码：[Github](https://github.com/illusorycloud/i-vue)

## 1. 表单输入

### 什么是双向数据绑定

Vue.js 是一个 MVVM 框架，即数据双向绑定，即当数据发生变化的时候，视图也就发生变化，当视图发生变化的时候，数据也会跟着同步变化。这也算是 Vue.js 的精髓之处了。值得注意的是，**我们所说的数据双向绑定，一定是对于 UI 控件来说的**，非 UI 控件不会涉及到数据双向绑定。单向数据绑定是使用状态管理工具的前提。如果我们使用 `vuex`，那么数据流也是单项的，这时就会和双向数据绑定有冲突。

### 为什么要实现数据的双向绑定

在 Vue.js 中，如果使用 `vuex`，实际上数据还是单向的，之所以说是数据双向绑定，这是用的 UI 控件来说，对于我们处理表单，Vue.js 的双向数据绑定用起来就特别舒服了。即两者并不互斥，在全局性数据流使用单项，方便跟踪；局部性数据流使用双向，简单易操作。

### 在表单中使用双向数据绑定

你可以用 `v-model` 指令在表单 `<input>`、`<textarea>` 及 `<select>` 元素上创建双向数据绑定。它会根据控件类型自动选取正确的方法来更新元素。尽管有些神奇，但 `v-model` 本质上不过是语法糖。它负责监听用户的输入事件以更新数据，并对一些极端场景进行一些特殊处理。

**注意：v-model 会忽略所有表单元素的 value、checked、selected 特性的初始值而总是将 Vue 实例的数据作为数据来源。你应该通过 JavaScript 在组件的 data 选项中声明初始值。**

### 单行文本

```html
<div id="app">
  单行文本<input type="text" v-model="message"/>&nbsp;&nbsp; Input 内容: {{message}}
</div>
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            message: "hello"
        }
    });
</script>
```

### 多行文本

```html
<div id="app">
多行文本 <textarea v-model="textareaMessage"></textarea>&nbsp;&nbsp; Textarea 内容: {{textareaMessage}}
</div>
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            textareaMessage: "textarea",
        }
    });
</script>
```

### 单复选框

```html
<div id="app">
    单复选框 <input type="checkbox" id="oneCheckbox" v-model="oneCheck"/><label for="oneCheckbox">{{oneCheck}}</label>
</div>
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            oneCheck: true,
        }
    });
</script>
```

### 多复选框

```html
<div id="app">
    单复选框 <input type="checkbox" id="oneCheckbox" v-model="oneCheck"/><label for="oneCheckbox">{{oneCheck}}</label>
    <hr/>

    <input type="checkbox" id="Java" value="Java" v-model="checkNames"/><label for="Java">Java</label>
    <input type="checkbox" id="JavaScript" value="JavaScript" v-model="checkNames"/><label
        for="JavaScript">JavaScript</label>
    <input type="checkbox" id="HTML" value="HTML" v-model="checkNames"/><label for="HTML">HTML</label>
    <span>选择的值: {{ checkNames }}</span>
</div>
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            checkNames: [],
        }
    });
</script>
```

### 单选按钮

```html
<div id="app">
      单选按钮
    <input type="radio" id="one" value="One" v-model="picked"><label for="one"></label>
    <input type="radio" id="two" value="Two" v-model="picked"><label for="two"></label>
    <input type="radio" id="three" value="Three" v-model="picked"><label for="three"></label>
    <span>选中的值: {{ picked }}</span>
 </div>   
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            picked: '',
        }
    });
</script>
```

### 下拉框

```html
<div id="app">
   下拉框
    <select v-model="selected">
        <option disabled value="">请选择</option>
        <option>A</option>
        <option>B</option>
        <option>C</option>
    </select>
    <span>选中的值:{{ selected }}</span>
</div>
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        data: {
            selected: ''
        }
    });
</script>
```

**注意：如果 v-model 表达式的初始值未能匹配任何选项，<select> 元素将被渲染为“未选中”状态。在 iOS 中，这会使用户无法选择第一个选项。因为这样的情况下，iOS 不会触发 change 事件。因此，更推荐像上面这样提供一个值为空的禁用选项。**

## 2. 组件基础

### 什么是组件

组件是可复用的 Vue 实例，说白了就是一组可以重复使用的模板，跟 `JSTL` 的自定义标签、`Thymeleaf`的 `th:fragment` 以及 `Sitemesh3` 框架有着异曲同工之妙。通常一个应用会以一棵嵌套的组件树的形式来组织：

例如，你可能会有页头、侧边栏、内容区等组件，每个组件又包含了其它的像导航链接、博文之类的组件。

### 第一个 Vue 组件

**注意：在实际开发中，我们并不会用以下方式开发组件，而是采用 vue-cli 创建 .vue 模板文件的方式开发，以下方法只是为了让大家理解什么是组件。**

```html
<div id="app">
    <ul>
        <my-component-li></my-component-li>
    </ul>
</div>
```

```javascript
<script type="text/javascript">
    <!--先注册组件-->
Vue.component("my-component-li",{
    template:"<li>Hello Vue Component</li>"
});
    <!--在实例化Vue-->
var vm=new Vue({
    el:'#app'
});
</script>
```

### 使用 `props` 属性传递参数

像上面那样用组件没有任何意义，所以我们是需要传递参数到组件的，此时就需要使用 `props` 属性了

**注意：默认规则下 props 属性里的值不能为大写；**

```html
<div id="app">
    <ul>
        <my-component-li v-for="item in items" v-bind:item="item"></my-component-li>
    </ul>
</div>
```

```javascript
<script type="text/javascript">
    <!--
    先注册组件-->
    Vue.component("my-component-li", {
        props: ['item'],
        template: "<li>{{item}}</li>"
    });
    <!--在实例化Vue-->
    var vm = new Vue({
        el: '#app',
        data: {
            items: ["张三", "李四", "王五"]
        }
    });
</script>
```

### 说明

- `v-for="item in items"`：遍历 Vue 实例中定义的名为 `items` 的数组，并创建同等数量的组件
- `v-bind:item="item"`：将遍历的 `item` 项绑定到组件中 `props` 定义的名为 `item` 属性上；`=` 号左边的 `item` 为 `props` 定义的属性名，右边的为 `item in items` 中遍历的 `item` 项的值

### 完整HTML

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
    <ul>
        <my-component-li v-for="item in items" v-bind:item="item"></my-component-li>
    </ul>
</div>
<script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
<script type="text/javascript">
    <!--
    先注册组件-->
    Vue.component("my-component-li", {
        props: ['item'],
        template: "<li>{{item}}</li>"
    });
    <!--在实例化Vue-->
    var vm = new Vue({
        el: '#app',
        data: {
            items: ["张三", "李四", "王五"]
        }
    });
</script>
</body>
</html>
```

## 3. 计算属性

### 什么是计算属性

计算属性的重点突出在 `属性` 两个字上（**属性是名词**），首先它是个 `属性` 其次这个属性有 `计算` 的能力（**计算是动词**），这里的 `计算` 就是个函数；简单点说，它就是一个能够将计算结果缓存起来的属性（**将行为转化成了静态的属性**），仅此而已；

> 第一次计算 1 + 1 = 2 ，然后把结果2保存起来，第二次遇到 1 + 1 时直接返回结果2 不用再次计算了

```html
<div id="app">
    <div> 当前时间: {{getCurrentTime()}}</div>
    <div> 计算属性: {{getCurrentTime1}}</div>
</div>
```

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        /**
         * 方法 获取当前时间
         */
        methods: {
            getCurrentTime: function () {
                return Date.now();
            }
        },
        /**
         * 看似是方法 其实是属性 计算一次后结果缓存起来
         */
        computed: {
            getCurrentTime1: function () {
                return Date.now();
            }
        }
    });
</script>
```

### 完整的 HTML

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
    <div> 当前时间: {{getCurrentTime()}}</div>
    <div> 计算属性: {{getCurrentTime1}}</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
<script type="text/javascript">
    var vm = new Vue({
        el: '#app',
        /**
         * 方法 获取当前时间
         */
        methods: {
            getCurrentTime: function () {
                return Date.now();
            }
        },
        /**
         * 看似是方法 其实是属性 计算一次后结果缓存起来
         */
        computed: {
            getCurrentTime1: function () {
                return Date.now();
            }
        }
    });
</script>
</body>
</html>
```

### 说明

- `methods`：定义方法，调用方法使用 `getCurrentTime()`，需要带括号
- `computed`：定义计算属性，调用属性使用 `getCurrentTime1`，不需要带括号；

**注意：methods 和 computed 里不能重名**

### 结论

调用方法时，每次都需要进行计算，既然有计算过程则必定产生系统开销，那如果这个结果是不经常变化的呢？此时就可以考虑将这个结果缓存起来，采用计算属性可以很方便的做到这一点；**计算属性的主要特性就是为了将不经常变化的计算结果进行缓存，以节约我们的系统开销**

## 4. 内容分发与自定义事件

### Vue 中的内容分发

在 Vue.js 中我们使用 `<slot>` 元素作为承载分发内容的出口，作者称其为 `插槽`，可以应用在组合组件的场景中



```html
<div id="app">
    <todo>
        <todo-title slot="todo-title"></todo-title>
        <todo-items slot="todo-items"></todo-items>
    </todo>
</div>
```

```javascript
<script type="text/javascript">
    /**
     * 大组件 todo列表 里面有两个slot 两个slot可以放两个小组件
     */
    Vue.component('todo', {
        template: '<div>\
                    <slot name="todo-title"></slot>\
                    <ul>\
                        <slot name="todo-items"></slot>\
                    </ul>\
               </div>'
    });
    /**
     * 小组件1  标题
     */
    Vue.component("todo-title", {
        template: "<div>标题</div>"
    });
    /**
     * 小组件2 内容
     */
    Vue.component("todo-items", {
        template: "<li>内容</li>"
    });
    /**
     * 实例化 Vue
     * @type {Vue}
     */
    var vm = new Vue({
        el: '#app'
    });
</script>
```

### props 绑定数据

```html
<div id="app">
    <todo>
        <todo-title slot="todo-title" v-bind:title="title"></todo-title>
        <todo-items slot="todo-items" v-for="item in items" v-bind:item="item"></todo-items>
    </todo>
</div>
```

```javascript
<script type="text/javascript">
    /**
     * 大组件 todo列表 里面有两个slot 两个slot可以放两个小组件
     */
    Vue.component('todo', {
        template: '<div>\
                    <slot name="todo-title"></slot>\
                    <ul>\
                        <slot name="todo-items"></slot>\
                    </ul>\
               </div>'
    });
    /**
     * 小组件1  标题
     */
    Vue.component("todo-title", {
        props:['title'],
        template: "<div>{{title}}</div>"
    });
    /**
     * 小组件2 内容
     */
    Vue.component("todo-items", {
        props:['item'],
        template: "<li>{{item}}</li>"
    });
    /**
     * 实例化 Vue
     * @type {Vue}
     */
    var vm = new Vue({
        el: '#app',
        data:{
            title:"Vue入门",
            items:["component","计算属性","slot"]
        }
    });
</script>
```

### 使用自定义事件删除待办事项

通过以上代码不难发现，数据项在 Vue 的实例中，但删除操作要在组件中完成，那么组件如何才能删除 Vue 实例中的数据呢？此时就涉及到参数传递与事件分发了，Vue 为我们提供了自定义事件的功能很好的帮助我们解决了这个问题；使用 `this.$emit('自定义事件名', 参数)`，操作过程如下

#### 修改创建 Vue 实例代码

```html
<script type="text/javascript">
	/**
     * 实例化 Vue
     * @type {Vue}
     */
    var vm = new Vue({
        el: '#app',
        data:{
            title:"Vue入门",
            items:["component","计算属性","slot"]
        },
        methods:{
            removeItems:function(index){
                /**
                 * splice 从数组中删除数据
                 * 第一个参数 index 开始索引
                 * 第二个参数  1    删除多少个
                 */
               this.items.splice(index,1);
            }
        }
    });
</script>
```

增加了 `methods` 对象并定义了一个名为 `removeTodoItems` 的方法

#### 修改 `todo-items` 待办内容组件的代码

```javascript
/**
 * 小组件2 内容
 */
Vue.component("todo-items", {
    props:['item','index'],
    template: "<li>{{item}} <button @click='remove();'>删除</button></li>",
    /**
     * 由于button是在组件中定义的 所以 button的click事件也只能定义在组件中
     * 但是数据却不是在组件中的 这里就出现问题了
     * 直接在Vue中定义事件 这里无法调用
     * 需要用this.$emit（） 绕一次
     * 这里的  this.$emit("remove"); 这个remove 是v-on:remove="removeItems"中的remove 可以自定义名字（但是不能驼峰命名）
     * 然后在Vue中定义removeItems 这个function 这样就可以调用了
     */
    methods:{
        remove:function(index){
            this.$emit("remove",index);
        }
    }
});
```

增加了 `<button @click="remove">删除</button>` 元素并绑定了组件中定义的 `remove` 事件

#### 修改 `todo-items` 待办内容组件的 HTML 代码

```html
<todo-items slot="todo-items" v-for="(item,index) in items" v-bind:item="item" v-bind:index="index" v-on:remove="removeItems(index)"></todo-items>
```

增加了 `v-on:remove="removeTodoItems(index)"` 自定义事件，该事件会调用 Vue 实例中定义的名为 `removeTodoItems` 的方法



#### 分析

组件如下

```javascript
    /**
     * 小组件2 内容
     */
    Vue.component("todo-items", {
        props:['item','index'],
        template: "<li>{{item}} <button @click='remove();'>删除</button></li>",
        /**
         * 由于button是在组件中定义的 所以 button的click事件也只能定义在组件中
         * 但是数据却不是在组件中的 这里就出现问题了
         * 直接在Vue中定义事件 这里无法调用
         * 需要用this.$emit（） 绕一次
         * 这里的  this.$emit("remove"); 这个remove 是v-on:remove="removeItems"中的remove 可以自定义名字（但是不能驼峰命名）
         * 然后在Vue中定义removeItems 这个function 这样就可以调用了
         */
        methods:{
            remove:function(index){
                this.$emit("remove",index);
            }
        }
    });
```



1.首先点击按钮 会调用

```html
<button @click='remove();'>删除</button>
```

button的remove();方法

