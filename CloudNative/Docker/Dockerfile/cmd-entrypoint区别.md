# CMD 和 ENTRYPOINT的区别

CMD 和 ENTRYPOINT 的区别：

* CMD：参数可以被 docker run 时指定的参数覆盖掉，如果容器比较灵活，希望用户自定义参数则推荐使用 CMD
* ENTRYPOINT：不会被覆盖，如果功能比较单一，只是运行唯一的一个程序，那么推荐使用 ENTRYPOINT

一般使用 ENTRYPOINT 指定具体命令，然后使用 CMD 指定默认参数，用户也可以在 docker run 时自定义参数以覆盖默认参数。



## 0. shell模式和exec模式

CMD 和 ENTRYPOINT 都有 shell 和 exec 两种写法。

* shell 写法：使用 bin/sh -c 来解释命令，因此容器中的 1 号进程是 sh
  * 比如：CMD executable  param1 param2
* exec 写法：直接执行命令，1 号进程就是我们的程序
  * 比如：CMD ["/bin/ping","localhost"] 

下表列出了如果把Shell表示法和Exec表示法混合, 最终得到的命令行, 可以看到如果有Shell表示法存在, 很难得到正确的效果:

| Dockerfile                                              | Command                                          |
| ------------------------------------------------------- | ------------------------------------------------ |
| ENTRYPOINT /bin/ping -c 3<br/>CMD localhost             | /bin/sh -c '/bin/ping -c 3' /bin/sh -c localhost |
| ENTRYPOINT ["/bin/ping","-c","3"]<br/>CMD localhost     | /bin/ping -c 3 /bin/sh -c localhost              |
| ENTRYPOINT /bin/ping -c 3<br/>CMD ["localhost"]"        | /bin/sh -c '/bin/ping -c 3' localhost            |
| ENTRYPOINT ["/bin/ping","-c","3"]<br/>CMD ["localhost"] | /bin/ping -c 3 localhost                         |

从上面看出, 只有ENTRYPOINT和CMD都用Exec表示法, 才能得到预期的效果





## 1. 概述

**CMD 和 ENTRYPOINT完整命令格式为：[ ENTRYPOINT CMD ]**，CMD 为ENTRYPOINT 的参数。 

> Docker 为我们提供了默认的 ENTRYPOINT ，即 `/bin/sh -c`。

所以如果Dockerfile中指定的是

```dockerfile
CMD ["python", "app.py"]
```

那么实际运行命令为 `/bin/sh -c python app.py`

如果是

```dockerfile
ENTRYPOINT  ["./app"]
```

那么会替换掉默认的ENTRYPOINT `/bin/sh -c`，因此实际运行命令就是 `./app`



**推荐使用方式：**

- 使用 exec 格式的 ENTRYPOINT 指令 设置固定的默认命令和参数
- 使用 CMD 指令 设置可变的参数



## 2. demo

### CMD

```dockerfile
FROM ubuntu:21.04
CMD ["echo", "hello docker"]
```

该 Dockerfile 为 CMD，可以在 docker run 时覆盖掉，具体如下：

```sh
docker run echo "hello world"
此时会 echo "hello world" 会覆盖掉 CMD 中指定的内容，所以最终会打印出 helo world
```



### ENTRYPOINT

```dockerfile
FROM ubuntu:21.04
ENTRYPOINT ["echo", "hello docker"]
```

该 Dockerfile 为 ENTRYPOINT，则不会被 docker run 指定的命苦覆盖掉，具体如下：

```sh
docker run echo "hello world"
由于不会被覆盖掉，所以实际上指定的命令 echo "hello world" 被当成了参数，最终会打印出 hello docker echo hello world
```





## 3. 小结

当 `CMD` 和 `ENTRYPOINT` 的使用总结如下：

- 在 Dockerfile 中， 应该至少指定一个 `CMD` 或者 `ENTRYPOINT`；
- 将 Docker 当作可执行程序时， 应该使用 `ENTRYPOINT` 进行配置；
- `CMD` 可以用作 `ENTRYPOINT` 默认参数， 或者用作 Docker 的默认命令；
- `CMD` 可以被 docker run 传入的参数覆盖；
- docker run 传入的参数会附加到 `ENTRYPOINT` 之后， 前提是使用了 `exec 格式` 。

对于 CMD 和 ENTRYPOINT 的设计而言，多数情况下它们应该是单独使用的。当然，有一个例外是 CMD 为 ENTRYPOINT 提供默认的可选参数。
我们大概可以总结出下面几条规律：

* 如果 ENTRYPOINT 使用了 shell 模式，CMD 指令会被忽略。
* 如果 ENTRYPOINT 使用了 exec 模式，CMD 指定的内容被追加为 ENTRYPOINT 指定命令的参数。
* 如果 ENTRYPOINT 使用了 exec 模式，CMD 也应该使用 exec 模式。

> 推荐使用 exec 模式，只有执行 shell 脚本的时候才使用 shell 模式。



> [参考文章1](https://beginor.github.io/2017/10/21/dockerfile-cmd-and-entripoint.html)
>
> [参考文章2](https://www.cnblogs.com/sparkdev/p/8461576.html)



[最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

[官方文档](https://docs.docker.com/engine/reference/builder/)