# Promise

## 1. 概述

Promise是异步编程的一种解决方案，可以替代传统的解决方案--回调函数和事件。ES6统一了用法，并原生提供了Promise对象。作为对象，Promise有一下两个特点：

- （1）对象的状态不受外界影响。
- （2）一旦状态改变了就不会在变，也就是说任何时候Promise都只有一种状态。

## 2. Promise的状态

Promise有三种状态，分别是：**Pending** （进行中）， **Resolved **(已完成)，**Rejected** (已失败)。

Promise从Pending状态开始，如果成功就转到成功态，并执行resolve回调函数；如果失败就转到失败状态并执行reject回调函数。

![](/images/promise-status-change.png)



## 3. 基本用法

可以通过Promise的构造函数创建Promise对象。

```javascript
var promise = new Promise(function(resolve,reject)
setTimeout(function(){                              
  console.log("hello world");},2000);
});    
```

Promise构造函数接收一个函数作为参数，该函数的两个参数是`resolve`，`reject`，它们由JavaScript引擎提供。

其中`resolve`函数的作用是当Promise对象转移到成功,调用resolve并将操作结果作为其参数传递出去；

`reject`函数的作用是单Promise对象的状态变为失败时，将操作报出的错误作为其参数传递出去。

如下面的代码：

```javascript
    function greet(){
    var promise = new Promise(function(resolve,reject){
        var greet = "hello  world";
        resolve(greet);
    });
    return promise;
    }
    greet().then(v=>{
    console.log(v);//*
    })
```

上面的*行的输出结果就是greet的值，也就是`resolve()`传递出来的参数。

> **注意**：创建一个Promise对象会立即执行里面的代码，所以为了更好的控制代码的运行时刻，可以将其包含在一个函数中，并将这个Promise作为函数的返回值。

### 1. Promise的then方法

Promise的then方法带有以下三个参数：成功回调，失败回调，前进回调，一般情况下只需要实现第一个，后面是可选的。

Promise中最为重要的是状态，通过then的状态传递可以实现回调函数链式操作的实现。

先执行以下代码：

```javascript
function greet() {
  var promise = new Promise(function (resolve, reject) {
    var greet = "hello  world";
    resolve(greet);
  });
  return promise;
}

var p = greet().then(v => {
  console.log(v);
});

console.log(p);
```

输出如下

```sh
Promise { <pending> }
hello  world
```

 从上述代码输出可以看出promise执行then后还是一个promise，并且Promise的执行是异步的，因为`hello world`在最后才打印出来，且Promise的状态为pending(进行中)。 

> 先执行console.log(p);后才回去执行的then中的console.log(v);

 因为Promise执行then后还是Promise，所以就可以根据这一特性，不断的链式调用回调函数。下面是一个 例子： 

```javascript
function greet() {
  return new Promise(function (resolve, reject) {
    let greet = "hello  world";
    resolve(greet);
  });

}

let p = greet();

p.then(v => {
  console.log(v + 1);
  return v;
})
  .then(v => {
    console.log(v + 2);
    return v;
  })
  .then(v => {
    console.log(v + 3);
  });

```

### 2. Promise的其他方法

####1. reject

reject的作用就是把Promise的状态从pending置为rejected，这样在then中就能捕捉到reject的回调函数。

```javascript
function greet() {
  return new Promise(function (resolve, reject) {
    let greet = "hello  world";
    if (greet === "") {
      resolve(greet);
    } else {
      reject(greet)
    }
  });

}

let p = greet();

p.then(v => {
    console.log(v + " resolve");
    return v;
  },
  v => {
    console.log(v + " reject");
    return v
  },
);

```

上述代码如果`greet`为空字符串则会走`reject(greet)`

同时可以观察到`.then()`有两个参数了。

`resolve`则会走第一个参数 打印`resolve`

`reject`则走第二个 打印`reject`

#### 2. catch

前面个例子也可以改成下面这种形式
```javascript
function greet() {
  return new Promise(function (resolve, reject) {
    let greet = "hello  world";
    if (greet === "") {
      resolve(greet);
    } else {
      reject(greet)
    }
  });

}

let p = greet();

p.then(v => {
    console.log(v + " resolve");
    return v;
  }
).catch(v => {
  console.log(v + " reject");
  return v
});

```

`.then()`只传一个参数，同时后面跟了一个`.catch()`

`resolve`则会执行then中传递的那个参数

`reject`则会走`catch()`中的方法。

>  不过需要特别注意的是如果前面then中设置了reject方法的回调函数(即上面个例子一样传两个参数)，则catch不会捕捉到状态变为`reject`的情况。 

 `catch`还有一点不同的是，如果在`resolve`或者`reject`发生错误的时候，会被`catch`捕捉到，这与java，c++的错误处理时一样的，这样就能避免程序卡死在回调函数中了。 

#### 3. all

Promise的all方法提供了并行执行异步操作的能力，在all中所有异步操作结束后才执行回调。 

```javascript
function greet1() {
  return new Promise(function (resolve, reject) {
    console.log("func1执行中...");
    resolve("func1执行完成");
  });
}

function greet2() {
  return new Promise(function (resolve, reject) {
    console.log("func2执行中1...");
    setTimeout(() => {
      console.log("func2执行中2...");
      resolve("func2执行完成");
    }, 2000);
  });
}

function greet3() {
  return new Promise(function (resolve, reject) {
    console.log("func3执行中...");
    resolve("func3执行完成");
  });
}

Promise.all([greet1(), greet2(), greet3()]).then(value => {
  console.log(value)
});

// func1执行中...
// func2执行中1...
// func3执行中...
// func2执行中2...
// [ 'func1执行完成', 'func2执行完成', 'func3执行完成' ]
```

这里可以看到p2的`resolve`放到一个`setTimeout`中，最后的`.then`也会等到所有Promise完成状态的改变后才执行。 

#### 4. race

在all中的回调函数中，等到所有的Promise都执行完，再来执行回调函数，race则不同它等到第一个Promise改变状态就开始执行回调函数。将上面的`all`改为`race`,得到 

```javascript
// func1执行中...
// func2执行中1...
// func3执行中...
// func1执行完成 // 注意这里
// func2执行中2...
```

 说明当执行`then()`方法时，只有第一个promise的状态改变了。 

### 3. 注意点

这里还需要注意一个问题，promise的执行时异步的，比如下面这样：

```javascript
let i

let promise = new Promise(function (resolve, reject) {
  resolve("hello");
});

promise.then(data => {
  i = 2;
});
console.log(i); // undefined
setTimeout(() => console.log(i), 1000); // 2

```

得到的结果是undefined,这不是因为promise不能改变外部的值，而是因为当执行`console.log(i)`时，`then()`方法还没执行完。如果你将console.log(i)延迟输出就可以得到正确的结果。

**所以不要在promise后面执行一些依赖promise改变的代码**

因为可能promise中的代码并未执行完，或者你可以将其延迟输出。

### 4. 执行顺序

```javascript
  接下来我们探究一下它的执行顺序，看以下代码：

let promise = new Promise(function(resolve, reject){
    console.log("AAA");
    resolve()
});
promise.then(() => console.log("BBB"));
console.log("CCC")


// AAA
// CCC
// BBB
```

执行后，我们发现输出顺序总是 AAA -> CCC -> BBB。表明，**在Promise新建后会立即执行**(所以一般都会把Promise放在一个函数里)，所以首先输出 AAA。然后，**then方法指定的回调函数将在当前脚本所有同步任务执行完后才会执行**，所以BBB 最后输出。

### 5. 与定时器混用

```jsx
let promise = new Promise(function(resolve, reject){
    console.log("1");
    resolve();
});
setTimeout(()=>console.log("2"), 0);
promise.then(() => console.log("3"));
console.log("4");

// 1
// 4
// 3
// 2
```

可以看到，结果输出顺序总是：`1 -> 4 -> 3 -> 2`。

1与4的顺序不必再说，而2与3先输出Promise的then，而后输出定时器任务。原因则是**Promise属于JavaScript引擎`内部任务`，而setTimeout则是`浏览器API`，而`引擎内部任务优先级高于浏览器API任务`**，所以有此结果。

## 4. async/await

### 1. async

  顾名思义，异步。async函数对 Generator 函数的改进，async 函数必定返回 Promise，我们把所有返回 Promise 的函数都可以认为是异步函数。特点体现在以下四点：

- 内置执行器
- 更好的语义
- 更广的适用性
- 返回值是 Promise

### 2. await

  顾名思义，等待。正常情况下，await命令后面是一个 Promise 对象，返回该对象的结果。如果不是 Promise 对象，就直接返回对应的值。另一种情况是，await命令后面是一个thenable对象（即定义then方法的对象），那么await会将其等同于 Promise 对象。

### 3.混合使用

```jsx
function sleep(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve,ms);
    })
}
async function handle(){
    console.log("AAA")
    await sleep(5000)
    console.log("BBB")
}

handle();

// AAA
// BBB (5000ms后)
```

  我们定义函数sleep，返回一个Promise。然后在handle函数前加上async关键词，这样就定义了一个async函数。在该函数中，利用await来等待一个Promise。

## 5. Promise优缺点

|   优点   |          缺点          |
| :------: | :--------------------: |
| 解决回调 |    无法监测进行状态    |
| 链式调用 | 新建立即执行且无法取消 |
| 减少嵌套 |    内部错误无法抛出    |

## 6. 参考

` https://www.cnblogs.com/Mrfanl/p/10563542.html `

