# 搭建Gitlab

## 1. 简介

GitLab 是利用 Ruby on Rails 一个开源的版本管理系统，实现一个自托管的 Git 项目仓库，可通过 Web 界面进行访问公开的或者私人项目。它拥有与 Github 类似的功能，能够浏览源代码，管理缺陷和注释。可以管理团队对仓库的访问，它非常易于浏览提交过的版本并提供一个文件历史库。团队成员可以利用内置的简单聊天程序 (Wall) 进行交流。它还提供一个代码片段收集功能可以轻松实现代码复用，便于日后有需要的时候进行查找。

## 2.. 环境准备

1.基于Docker搭建的Gitlab，所以需要安装好docker和docker compose。

2.Gitlab运行最少需要2G内存，且最好是固态硬盘。

## 3.. 安装

### 1. 下载

```bash
#中文社区版
$ docker pull twang2218/gitlab-ce-zh
#英文社区版
$ docker pull gitlab/gitlab-ce
```

### 2. 配置文件

创建`docker-compose.yml`配置文件

大致就是这样的，具体属性根据实际情况修改。

```yml
version: '3'
services:
    web:
      image: 'twang2218/gitlab-ce-zh'
      restart: always
      hostname: '192.168.1.113'
      environment:
        TZ: 'Asia/Shanghai'
        GITLAB_OMNIBUS_CONFIG: |
          external_url 'http://192.168.1.113:8080'
          gitlab_rails['gitlab_shell_ssh_port'] = 2222
          unicorn['port'] = 8888
          nginx['listen_port'] = 8080
      ports:
        - '8080:8080'
        - '8443:443'
        - '2222:22'
      volumes:
        - /usr/local/docker/gitlab/config:/etc/gitlab
        - /usr/local/docker/gitlab/data:/var/opt/gitlab
        - /usr/local/docker/gitlab/logs:/var/log/gitlab
```

### 3. 启动

```bash
$ docker-compose up
```

**注意：** 如果服务器配置较低，启动运行可能需要较长时间，请耐心等待

## 4. 使用

启动完成后就可以访问了。

- 访问地址：`http://ip:8080`
- 端口 8080 是因为我在配置中设置的外部访问地址为 8080，默认是 80

- 设置管理员初始密码，这里的密码最好是 字母 + 数字 组合，并且 大于等于 8 位
- 配置完成后登录，管理员账号是 root

## 5.使用SSH免密登录

这个和Github的差不多，生成SSHkey 然后配置到Gitlab账号。

同时后面的持续集成需要用到这个。

### 生成 SSH KEY

使用 ssh-keygen 工具生成，位置在 Git 安装目录下，我的是 `C:\Program Files\Git\usr\bin`

输入命令：

```text
ssh-keygen -t rsa -C "your_email@example.com"
```

执行成功后的效果：

```text
Microsoft Windows [版本 10.0.14393]
(c) 2016 Microsoft Corporation。保留所有权利。

C:\Program Files\Git\usr\bin>ssh-keygen -t rsa -C "topsale@vip.qq.com"
Generating public/private rsa key pair.
Enter file in which to save the key (/c/Users/Lusifer/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /c/Users/Lusifer/.ssh/id_rsa.
Your public key has been saved in /c/Users/Lusifer/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:cVesJKa5VnQNihQOTotXUAIyphsqjb7Z9lqOji2704E topsale@vip.qq.com
The key's randomart image is:
+---[RSA 2048]----+
|  + ..=o=.  .+.  |
| o o + B .+.o.o  |
|o   . + +=o+..   |
|.=   .  oo...    |
|= o     So       |
|oE .    o        |
| .. .. .         |
| o*o+            |
| *B*oo           |
+----[SHA256]-----+

C:\Program Files\Git\usr\bin>
```

### 复制 SSH-KEY 信息到 GitLab

秘钥位置在：`C:\Users\你的用户名\.ssh` 目录下，找到 `id_rsa.pub` 并使用编辑器打开。

登录 GitLab，点击“用户头像”-->“设置”-->“SSH 密钥”



