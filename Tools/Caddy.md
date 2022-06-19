# Caddy

Caddy 类似于 Apache、Nginx，是一个 Web 服务器。

> Go 语言编写，性能比 Nginx 差但是比较简单，配置也方便，个人项目就比较推荐。

因此使用 Caddy 来搭个人博客就很不错。



URL 跳转问题 https://caddy.community/t/how-to-use-redir-change-uri/16272

## 1. Caddy 配置

### FAQ

Caddy 启动后会自动申请 TLS 证书，但是需要占用 80 和 443 端口才可以，如果修改了默认的端口则会导致证书申请失败。

## 3. Github Action

配置 github action 过程和上面的 webhook 类似，git 推送时触发 github action，直接编译成最新的静态文件然后推送到服务器对应目录，完成更新。





新建仓库，lixueduan.com

用于存放博客源文件，通过 github action 进行部署。

可以同时推送到 github page 和服务器(借助 ssh)。

服务器上使用 caddy 作为 web server，可自动生成 TLS 证书，比较简单。

主题选择 LoveIt

添加子模块，便于维护。

```BASH
 git submodule add  https://github.com/dillonzq/LoveIt themes/LoveIt
```



Caddyfile 也放到 github 仓库

github action 推送时顺便推送最新的 caddy 二进制文件到服务器。



图片放哪里？？





技巧

当你运行 `hugo serve` 时, 当文件内容更改时, 页面会随着更改自动刷新.

注意

由于本主题使用了 Hugo 中的 `.Scratch` 来实现一些特性, 非常建议你为 `hugo server` 命令添加 `--disableFastRender` 参数来实时预览你正在编辑的文章页面.

```bash
# 每次更新时都进行全量渲染
hugo serve --disableFastRender
```

Hugo 的运行环境

`hugo serve` 的默认运行环境是 `development`, 而 `hugo` 的默认运行环境是 `production`.

由于本地 `development` 环境的限制, **评论系统**, **CDN** 和 **fingerprint** 不会在 `development` 环境下启用.

你可以使用 `hugo serve -e production` 命令来开启这些特性.

```BASH
hugo serve --disableFastRender -e production
```



强烈建议你把:

- apple-touch-icon.png (180x180)
- favicon-32x32.png (32x32)
- favicon-16x16.png (16x16)
- mstile-150x150.png (150x150)
- android-chrome-192x192.png (192x192)
- android-chrome-512x512.png (512x512)

放在 `/static` 目录. 利用 https://realfavicongenerator.net/ 可以很容易地生成这些文件.

可以自定义 `browserconfig.xml` 和 `site.webmanifest` 文件来设置 theme-color 和 background-color.



