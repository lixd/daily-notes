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

