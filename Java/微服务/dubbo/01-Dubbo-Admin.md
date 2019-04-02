# Dubbo-Admin

管理控制台为内部裁剪版本，开源部分主要包含：路由规则，动态配置，服务降级，访问控制，权重调整，负载均衡，等管理功能。

## 克隆项目

```bash
git clone git@github.com:apache/incubator-dubbo-admin.git
```

## 修改配置文件

在配置文件中配置好自己的Zookeeper地址，文件如下：

`D:\lillusory\Demo\dubbo\incubator-dubbo-admin\dubbo-admin-server\src\main\resources\application.properties`

## 打包运行

```text
# 打包
mvn clean package

# 运行
mvn --projects dubbo-admin-backend spring-boot:run
```

## 浏览

地址：`http://localhost:8080`

## 遇到的问题处理

### NodeJS

- 现象：使用 `mvn clean package` 构建 DubboAdmin 控制台时会出现 `npm install` 操作
- 解决：新版控制台已改为前后分离模式，前端采用 Vue.js 开发，故需要 NodeJS 支持，请自行安装（运行到此处时会自动下载安装）。官网地址：`http://nodejs.cn/`
- 其他：配置淘宝镜像加速。官网地址：`http://npm.taobao.org/`

```text
# 安装 cnpm 命令行工具
npm install -g cnpm --registry=https://registry.npm.taobao.org

# 安装模块
cnpm install [name]
```

