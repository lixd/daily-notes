 # Istio 调试工具



* istioctl 命令行
* controlZ 控制平面自检工具
* Envoy admin 接口
* Pilot debug 接口




## 1. istioctl

### 安装部署相关



```shell
# 安装验证
istioctl verify-install
# 使用 manifest 进行安装
istioctl mainfest [apply / diff / generate / migrate / versions]
# profile 相关
istioctl profile [list/ diff / dump]
# 手动注入
istioctl kube-inject
# bashboard
istioctl dashboard [controlz / envoy / grafana / jaeger / kiali / prometheuis / zipkin]
```



### 网络配置状态检查



配置同步检查

* istioctl ps（proxy-status缩写）
  * SYNCED（正常，配置已经同步） 
  * NOT SENT （异常，配置没有下放）
  * STALE（异常，配置已下放，但是pod没有响应）
* istioctl ps <pod-name>

配置详情

* istioctl pc（proxy-config缩写）
  * istioctl pc [cluster/route/...] <pod-name.namespace>





### 查看 Pod 相关网格配置信息

istioctl x（experimental缩写） describe pod <pod-name>

* 验证是否在网格内
* 验证 Virtual Service
* 验证 Destination Rule
* 验证路由
* ...



### 网格配置诊断

* istioctl analyze [-n <namespace> / --all-namespace] 
  * 可以指定检查哪个 namespace 下的配置
  * 可以指定具体 namespace 或者用 --all-namespace 参数指定全部
  * 不指定则默认检查 default namespace
* istioctl analyze a.yaml b.yaml my-app-config/
  * 检查 yaml 文件配置有没有问题
  * 可以指定具体文件或者指定目录使其检测整个目录下的所有yaml文件
* istioctl analyze --use-kube=false a.yaml
  * --use-kube=false 参数表示只检测文件，不和整个集群挂钩





## 2. controlZ 可视化自检工具

istioctl dashboard controlz <istiod-podname> -n istio-system

* 调整日志输出级别
* 查看内存使用情况
* 环境变量
* 进程信息







## 3. Envoy admin API 接口

* istioctl dashboard envoy <pod-name>.[namespace]
* kubectl  prot-foraward pod-name xxx:15000
  * kubectl 进行端口转发，便于外部能够访问
* 日志级别调整
* 性能数据分析
* 配置等信息
* 指标查看





## 4. Pilot debug 接口

* kubectl port-forward service/istio-pilot -n istio-system 8080:8080
  * kubectl 进行端口转发，便于外部能够访问
* http://localhost:8080/debug
* xDS 和配置信息
* 性能问题分析
* 配置同步情况

