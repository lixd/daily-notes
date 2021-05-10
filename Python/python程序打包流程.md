# Python 生成服务打包流程

## 1. 概述

打包成镜像，运行在 K8s集群中方便管理。



## 2. 打包流程

### 1. 依赖列表

因为 Python 需要手动安装环境，所以首先需要生成程序的依赖列表。

这里主要用到 pipreqs 工具。

```sh
# 安装该工具
$ pip install pipreqs
# 在项目根目录执行
$ pipreqs . --encoding=utf-8 --force
```

会在当前目录生成一个 requirements.txt 文件，大致内容像这样：

```sh
imutils==0.5.4
tensorflow==1.3.0
numpy==1.14.3
.....
```

注意：该工具生成的依赖列表不一定百分百正确，需要手动检测一下。



### 2. Dockerfile

标准 Dockerfile 如下

```dockerfile
FROM python:3.6
ADD . root/
WORKDIR root/
RUN pip install --upgrade pip -i https://mirrors.cloud.tencent.com/pypi/simple \
&& pip install --default-timeout=10000 -i https://mirrors.cloud.tencent.com/pypi/simple -r requirements.txt
EXPOSE 50051
CMD ["python3","grpc_server.py"]
```

为了减少镜像大小可以根据需求选择更精简的基础镜像，比如`python:3.6-alpine`或者`python:3.6-slim`。

镜像大小对比：

* python:3.6 800M
* python:3.6-alpine 90M
* python:3.6-slim 200M



注意点有两个：

* 1）使用`pip install  -r requirements.txt`安装依赖
* 2）启动命令`CMD ["python3","grpc_server.py"]` 



## 3. 数据卷

模型数据太大了，通过数据卷方式挂载到Pod中。

在 Kubernetes 集群中分别创建OSS类型的名叫model 的PV和PVC，启动Pod时挂载到`generate\Model`目录。