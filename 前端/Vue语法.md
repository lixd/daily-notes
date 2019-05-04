# v-if,v-else

## 1. 条件判断语句

- `v-if`
- `v-else`

```html
<div id="vue">
    <h1 v-if="ok">YES</h1>
    <h1 v-else>NO</h1>
</div>
```

## JavaScript

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#vue',
        data: {
            ok: true
        }
    });
</script>
```



## 完整的 HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>语法篇 v-if</title>
    <script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
</head>
<body>

<div id="vue">
    <h1 v-if="ok">YES</h1>
    <h1 v-else>NO</h1>
</div>

<script type="text/javascript">
    var vm = new Vue({
        el: '#vue',
        data: {
            ok: true
        }
    });
</script>
</body>
</html>
```

## 2. 连续的条件判断语句

- `v-if`
- `v-else-if`
- `v-else`

## HTML

```html
<div id="vue">
    <h1 v-if="type === 'A'">A</h1>
    <h1 v-else-if="type === 'B'">B</h1>
    <h1 v-else-if="type === 'C'">C</h1>
    <h1 v-else>你看不见我</h1>
</div>
```

注：`===` 三个等号在 JS 中表示绝对等于（就是数据与类型都要相等）

## JavaScript

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#vue',
        data: {
            type: 'A'
        }
    });
</script>
```

## 完整的 HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>语法篇 v-else-if</title>
    <script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
</head>
<body>

<div id="vue">
    <h1 v-if="type === 'A'">A</h1>
    <h1 v-else-if="type === 'B'">B</h1>
    <h1 v-else-if="type === 'C'">C</h1>
    <h1 v-else>你看不见我</h1>
</div>

<script type="text/javascript">
    var vm = new Vue({
        el: '#vue',
        data: {
            type: 'A'
        }
    });
</script>
</body>
</html>
```

## 3. 循环遍历语句

- `v-for`

## HTML

```html
<div id="vue">
    <li v-for="item in items">
        {{ item.message }}
    </li>
</div>
```

注：`items` 是源数据数组并且 `item` 是数组元素迭代的别名。和 `Thymeleaf`很像

## JavaScript

```javascript
<script type="text/javascript">
    var vm = new Vue({
        el: '#vue',
        data: {
            items: [
                {message: 'Foo'},
                {message: 'Bar'}
            ]
        }
    });
</script>
```

## 完整的 HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>语法篇 v-for</title>
    <script src="https://cdn.jsdelivr.net/npm/vue@2.5.21/dist/vue.js"></script>
</head>
<body>

<div id="vue">
    <li v-for="item in items">
        {{ item.message }}
    </li>
</div>

<script type="text/javascript">
    var vm = new Vue({
        el: '#vue',
        data: {
            items: [
                {message: 'Foo'},
                {message: 'Bar'}
            ]
        }
    });
</script>
</body>
</html>
```