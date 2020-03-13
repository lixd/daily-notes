# Async/Await



## 1. 概述

什么是Async/Await?

- async/await是写异步代码的新方式，以前的方法有**回调函数**和**Promise**。
- async/await是基于Promise实现的，它不能用于普通的回调函数。
- async/await与Promise一样，是非阻塞的。
- async/await使得异步代码看起来像同步代码，这正是它的魔力所在。

## 2. 基本使用

Async/Await语法

示例中，getJSON函数返回一个promise，这个promise成功resolve时会返回一个[JSON](http://caibaojian.com/t/json)对象。我们只是调用这个函数，打印返回的JSON对象，然后返回”done”。

使用Promise是这样的:

```javascript
const makeRequest = () =>
  getJSON()
    .then(data => {
      console.log(data)
      return "done"
    })

makeRequest()
```

使用Async/Await是这样的:

```javascript
const makeRequest = async () => {
  console.log(await getJSON())
  return "done"
}

makeRequest()
// await getJSON()表示console.log会等到getJSON的promise成功resolve之后再执行。
```

它们有一些细微不同:

- 函数前面多了一个**aync关键字。await关键字只能用在aync定义的函数内。async函数会隐式地返回一个promise，该promise的resolve值就是函数return的值**。(示例中resolve值就是字符串”done”)
- 第1点暗示我们不能在最外层代码中使用await，因为不在async函数内。

## 3. 结论

 Async/Await是近年来[JavaScript](http://caibaojian.com/t/javascript)添加的最革命性的的特性之一。它会让你发现Promise的语法有多糟糕，而且提供了一个直观的替代方法。 

## 4. 参考

` https://blog.csdn.net/weixin_42470791/article/details/82560734 `