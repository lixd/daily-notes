# ENV 和 ARG 的区别

### ENV

设置环境变量。

格式有两种：

```dockerfile
ENV <key> <value>
ENV <key1>=<value1> <key2>=<value2>...
```

这个指令很简单，就是设置环境变量而已，无论是后面的其它指令，如 RUN，还是运行时的应用，都可以直接使用这里定义的环境变量。

```dockerfile
ENV VERSION=1.0 DEBUG=on \
    NAME="Happy Feet"
```

这个例子中演示了如何换行，以及对含有空格的值用双引号括起来的办法，这和 Shell 下的行为是一致的。



### ARG

ARG用于指定传递给构建运行时的变量：

```dockerfile
ARG <name>[=<default value>]
```

如，通过ARG指定两个变量：

```dockerfile
ARG site
ARG build_user=illusory
```

以上我们指定了 site 和 build_user 两个变量，其中 build_user 指定了默认值。在使用 docker build 构建镜像时，可以通过 `--build-arg <varname>=<value>` 参数来指定或重设置这些变量的值。

```sh
docker build --build-arg site=vaptcha.com -t illusory/test .
```

这样我们构建了 itbilu/test 镜像，其中site会被设置为 vaptcha.com，由于没有指定 build_user，其值将是默认值illusory。





### 区别

ENV(环境变量) 和 ARG(构建参数) 比较类似，但是实际上 ENV 会真正被填充到镜像的ENV中，而 ARG 只是在构建镜像时被替换，并不会真正写入到镜像中。

不过ARG的好处是可以通过 --build-arg  命令来更新，而不是去修改 Dockerfile。

> 可以理解为 ENV 是指定的镜像中的ENV，而 ARG 指定的是 Dockerfile 中的 ARG。

