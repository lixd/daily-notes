# kubeadm 解析

[K8S 源码探秘 之 kubeadm init 执行流程分析](https://blog.csdn.net/shida_csdn/article/details/83176735)

[K8S 源码探秘 之 kubeadm join 执行流程分析](https://blog.csdn.net/shida_csdn/article/details/83269238)



## 1. Init

* 配置初始化
* 安装预检
* 镜像检测和拉取
* 配置本地 kubelet 服务
* 检测生成相关证书
* 检测生成 audit 策略文件（如果有启用 audit 特性）
* 生成 manifest 文件
  * static pod
* 等待 Control Plane 启动完成
* 执行完成前的配置



## 2. Join

