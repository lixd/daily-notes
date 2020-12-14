# CMD 和 ENTRYPOINT的区别

**推荐使用方式：**

- 使用 exec 格式的 ENTRYPOINT 指令 设置固定的默认命令和参数
- 使用 CMD 指令 设置可变的参数



当 `CMD` 和 `ENTRYPOINT` 的使用总结如下：

- 在 Dockerfile 中， 应该至少指定一个 `CMD` 和 `ENTRYPOINT`；
- 将 Docker 当作可执行程序时， 应该使用 `ENTRYPOINT` 进行配置；
- `CMD` 可以用作 `ENTRYPOINT` 默认参数， 或者用作 Docker 的默认命令；
- `CMD` 可以被 docker run 传入的参数覆盖；
- docker run 传入的参数会附加到 `ENTRYPOINT` 之后， 前提是使用了 `exec 格式` 。

对于 CMD 和 ENTRYPOINT 的设计而言，多数情况下它们应该是单独使用的。当然，有一个例外是 CMD 为 ENTRYPOINT 提供默认的可选参数。
我们大概可以总结出下面几条规律：

* 如果 ENTRYPOINT 使用了 shell 模式，CMD 指令会被忽略。
* 如果 ENTRYPOINT 使用了 exec 模式，CMD 指定的内容被追加为 ENTRYPOINT 指定命令的参数。
* 如果 ENTRYPOINT 使用了 exec 模式，CMD 也应该使用 exec 模式。



> [参考文章1](https://beginor.github.io/2017/10/21/dockerfile-cmd-and-entripoint.html)
>
> [参考文章2](https://www.cnblogs.com/sparkdev/p/8461576.html)



