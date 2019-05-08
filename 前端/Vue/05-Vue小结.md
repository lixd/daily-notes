# Vue小结

## 概述

Vue.js是一个 MVVM 模式的实现者，MVVM 核心是 ViewModel ，ViewModel 就是一个观察者

## 总结

两大核心：数据驱动，组件化

两个优点： 借鉴了 AngulaJS 的模块化开发和 React 虚拟DOM，虚拟 DOM 就是把 DOM 操作放到内存执行。

## 常用的自定义属性

### 普通自定义属性

v-if

v-else-if

v-else

v-for

v-on

v-model 数据双向绑定

v-bind 为组件绑定参数

### 组件化

组合组件 slot 插槽

组件内部绑定事件需要用到 this.$emit(''事件名“，参数);



遵循 SoC 关注度分离原则，Vue 是纯粹的视图框架，它并不包含比如 AJAX 之类的通信功能，为了解决通信问题，我们需要使用 Axios 框架做异步通信

Vue自己的特色，计算属性 computed 里面写的还是函数，将计算结果相同的方法做静态存储

## NodeJS

Vue 都是要基于 NodeJS

vue-router 路由

vuex 状态管理

## Vue UI

ElementUI 饿了么出品

iview 

ice    飞冰 阿里巴巴出品



 