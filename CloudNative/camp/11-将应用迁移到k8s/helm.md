# helm

## 什么是Helm

* Helm chart 是创建一个应用实例的必要的配置组， 也就是一堆 Spec。
* 配置信息被归类为模版 (Template) 和值(Value) ，这些信息经过渲染生成最终的对象。
* 所有配置可以被打包进一个可以发布的对象中。
* 一个 release 就是一个有特定配置的 chart 的实例。



## Helm的组件

Helm client

* 本地 chart 开发
* 管理repository
* 管理 release
* 与 helm library 交互
  * 发送需要安装的 chart
  * 请求升级或着卸载存在的 release



Helm library

* 负责与APIserver交互，并提供以下功能
  * 基于 chart 和 configuration 创建一个release
  * 把 chart 安装进 kubernetes,并提供相应的 release 对象
  * 升级和卸载
  * Helm 采用 Kubernetes 存储所有配置信息，无需自己的数据库



## Kubernetes Helm架构.

Helm的目标：

* 从头创建 chart 
* 把 chart 打包成压缩文件(tgz)
* 与 chart 的存储仓库交互(chart repositry)
* Kubernetes 集群中的 chart 安装与卸载
* 管理用 Helm 安装的 release 的生命周期



## Helm 的安装

下载

* 参考链接: https://github.com/helm/helm/releases

安装

* 解压
* mv <your_ downloaded_ binary> /usr/local/bin/helm 





## Helm chart的基本使用


创建一个chart

* helm create myapp

会生成一个目录：

```bash
myapp/
Chart.yaml #包含了chart信息的YAML文件
values.yaml# chart默认的配置值
charts/ #包含chart依赖的其他chart
templates/ #模板目录，当和values结合时，可生成有效的Kubernetes manifest文件
```







## 复用已存在的成熟Helmrelease



针对Helm release repo的操作

* helm repo add grafana https://grafana.github.io/helm-charts
* helm repo update
* helm repo list
* helm search repo grafana

从remote repo安装Helm chart

* helm upgrade --install loki grafana/ loki-stack

下载并从本地安装helm chart

* helm pull grafana/loki-stack
* helm upgrade --install loki ./lock-stack
  





