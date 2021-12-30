# SonarQube 安装使用教程



## 1. 概述

Sonarqube为静态代码检查工具，采用B/S架构，帮助检查代码缺陷，改善代码质量，提高开发速度，通过插件形式，可以支持Java、C、C++、JavaScripe等等二十几种编程语言的代码质量管理与检测。本文介绍如何快速安装、配置、使用Sonarqube及Sonarqube Scanner。



## 2. 搭建

官方文档

> https://docs.sonarqube.org/latest/setup/install-server/



同时官方也提供了 docker-compose 一键安装方式。

docker-compose.yml文件如下

> https://github.com/SonarSource/docker-sonarqube/blob/master/example-compose-files/sq-with-postgres/docker-compose.yml



安装Docker和docker -compose后即可一键启动。

> 使用的PostgreSQL，本来还想改成MySQL的，后来发现Sonar8之后就不支持MySQL了。



## 3. 新增项目

* 1）**登陆后台**

首先进入后台系统并登陆

> http://localhost:9000
>
> 账号密码默认都是admin

* 2）**创建项目**

然后点`+`加号创建一个项目

接着随便输入一个名字，生成token

> 后续检测的时候需要用到该token



## 4. 检测

### 1. Scanner 检测

* 1）配置Scanner

需要先下载Scanner,并配置环境变量即可。

> 下载地址如下 https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
>
> windows则下载windows-64bit 然后解压并将bin目录添加到环境变量Path中。

然后也可以修改Scanner的配置文件，在conf目录下,写入以下内容：

> windows 则大概是这样的目录 `sonar-scanner-4.5.0.2216-windows\conf\sonar-scanner.properties`

```properties
#Configure here general information about the environment, such as SonarQube server connection details for example
#No information about specific project should appear here

#----- Default SonarQube server
sonar.host.url=http://47.93.123.142:9000/

#----- Default source code encoding
sonar.sourceEncoding=UTF-8
#----- User Token
sonar.login=45c0b5e1800a5806310d7e93ee7c5bfbe1392834
```

主要就是配置`sonar.login`。

* 2）项目配置

最后在`项目根目录`创建一个配置文件`sonar-project.properties`

```properties
# must be unique in a given SonarQube instance
sonar.projectKey=my:project

# --- optional properties ---

# defaults to project key
sonar.projectName=My project
# defaults to 'not provided'
#sonar.projectVersion=1.0
 
# Path is relative to the sonar-project.properties file. Defaults to .
sonar.sources=.
 
# Encoding of the source code. Default is default system encoding
sonar.sourceEncoding=UTF-8
# 排除掉不需要检测的文件
sonar.exclusions=xxx
```

主要是`sonar.projectKey`和`sonar.projectName` 配置成和前面后台设置中设置的一样的就行了。

### 

最后在项目根目录下执行命令检测即可

```shell
sonar-scanner.bat
```

由于前面配置的两个配置文件，所以这里不需要任何参数，如果没改配置文件就需要带上对应的参数，大概是这样的：

```shell
sonar-scanner.bat -D"sonar.projectKey=Vaptcha" -D"sonar.sources=." -D"sonar.host.url=http://47.93.123.142:9000" -D"sonar.login=45c0b5e1800a5806310d7e93ee7c5bfbe1392834"
```



检测后会在根目录生成一个`.scannerwork`目录，需要添加到.gitignore文件，别提交到代码仓库去了。



### 2. IDE 插件

> https://lichangwei.github.io/2020/03/04/sonarqube/ 教程

通过 VS Code 插件，可以让我们在编写代码的时候就能发现问题，避免有问题的代码进入代码仓库。大家都知道，问题发现的越早，解决的越早，成本越低，因此这种做法非常有意义，让问题在刚刚出现时就被发现，被解决。

1. 在 VS Code 中按下`Command + Shift + X`组合键或在点击左侧的 Extensions 图标即可打开插件面板，搜索`SonarLint`即可看到同名的插件，按下其右下角的安装按钮，就安装成功了。

2. 在 VS Code 中按下`Command + ,`组合键或通过菜单`Code -> Preferences -> Settings`打开用户设置面板。

3. 在用户设置面板中搜索`SonarLint`发现若干条配置项，点击任意一个“Edit in settings.json”直接修改 JSON 格式的配置文件。
   ![img](https://lichangwei.github.io/images/sonarlint.setting.png)

4. 在新打开的`settings.json`文件中添加以下代码，

   ```
   {
     "sonarlint.connectedMode.connections.sonarqube": [
       {
         "serverUrl": "http://192.168.0.140:9000",
         "token": "df32aaf19ee1cdc5117aba235309492fd283e64f"
       }
     ]
   }
   ```

   其中`serverUrl`就是前面提到的 SonarQube 服务器地址，而`token`就是我们申请的令牌。

5. 打开项目根目录下的`.vscode/settings.json`文件，如果没有则新建一个文件。在文件中添加以下内容：

   ```
   {
     "sonarlint.connectedMode.project": {
       "projectKey": "project-key"
     }
   }
   ```

   这样在编写代码时就可以及时获取 SonarQube 的扫描结果了。
   ![img](https://lichangwei.github.io/images/sonarlint.tips.png)
   从`SonarLint`给出的信息看出类型 T 重复，原来是我忘记加上一对括号了。修改如下后就不再提示错误了。



Goland 中也有这个插件 SonarQube Community Intellij Plugin

> https://github.com/sonar-intellij-plugin/sonar-intellij-plugin 插件主页