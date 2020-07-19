# elasticsearch 生产环境配置

## 1. 概述

虽然 elasticsearch 不怎么需要配置，使用默认配置就可以运行了，但是生产环境中，建议下面的都配置一下。

* 1）Path settings
* 2）Cluster name
* 3）Node name
* 4）Network host
* 5）Discovery settings
* 6）Heap size
* 7）Heap dump path
* 8）GC logging
* 9）Temp directory

Elasticsearch 默认是开发环境，就算存在异常也只是在日志中写入警告，节点照样可以启动。

如果配置了以上选择后 Elasticsearch 认为你要切换到生产环境了，同时上述警告会升级为异常，这些异常将阻止您的Elasticsearch节点启动。

* 禁止 Dynamic Mapping 和自动创建索引。

## 2. ES 配置

### 1. Path settings

如果是通过 `.zip` or `.tar.gz` 安装的，`logs`、`data`默认会存放在 `$ES_HOME`目录下，这个目录后续升级时可能会直接被删除掉，所以生产环境肯定需要修改的。

```yml
path:
  logs: /var/log/elasticsearch
  data: /var/data/elasticsearch
```

### 2. Cluster.name

节点加入集群时只能通过 `cluster.name`来识别，默认的集群名是`elasticsearch`。同时一定不要使用重复的集群名，否则节点可能加入到错误的集群中去。

```yml
cluster.name: logging-prod
```

### 3. Node.name

同上，节点名用于标识每个节点，默认为主机名。

可以在`elasticsearch.yml`中配置。

```yml
node.name: prod-data-2
```

### 4. network.host

默认是环回地址（ 127.0.0.1 、[::1]） 为了构建集群这里也需要修改绑定到非环回地址。

```shell
network.host: 192.168.1.10
```

### 5. Discovery settings

需要配置发现其他节点和选举 master 的配置。

* 1）discovery.seed_hosts - 节点列表
  * IP + Port （不指定端口号时默认使用 9300）
  * 域名
  * IPv6 也可以
* 2）cluster.initial_master_nodes - 具备 master 选举能力的节点 （master-eligible nodes）
  * node.name  通过节点名标识
  * 这也是为什么前面需要改节点名

```syml
discovery.seed_hosts:
   - 192.168.1.10:9300
   - 192.168.1.11 
   - seeds.mydomain.com 
   - [0:0:0:0:0:ffff:c0a8:10c]:9301 
cluster.initial_master_nodes: 
   - master-node-a
   - master-node-b
   - master-node-c
```

其中`discovery.seed_hosts`节点列表也可以通过文件方式提供，如下：

```shell
discovery.seed_providers: file
```

文件具体目录`$ES_PATH_CONF/unicast_hosts.txt`,内容如下

```shell
10.10.10.5
10.10.10.6:9305
10.10.10.5:10005
# an IPv6 address
[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:9301
```

对该文件的内容修改时实时生效的。

**如果两种都配置了，则都会生效。**

### 6. Heap size

默认 Heap 为 1GB，到生产环境需要调整一个合适且足够的大小。

具体大小规则如下：

* 1）1.具体取决于服务器内存大小
* 2）`Xms`、`Xmx`大小必须一致
* 3）不能超过物理内存的 50%
* 4）不能超过某个阈值 一般建议 26GB及以下。
  *  JVM 阈值为 32GB，超过后对象指针大小会翻倍，可用内存甚至会减少。但是大部分系统都达不到 32GB阈值就会出现翻倍的情况。
  *  详情`https://blog.csdn.net/bodouer7979/article/details/100958525`

可以通过修改`jvm.options`文件设置,需要注意的是**不是直接修改 root `jvm.options`文件**，而是在`jvm.options.d/`目录下创建自己的 `jvm.options`文件，会覆盖掉 root `jvm.options`文件中的配置。

> docker 启动则可以直接把这个文件夹映射到宿主机，方便修改。

```yml
- Xms2g 
- Xmx2g 
```

> When using the [Docker distribution of Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docker.html) you can bind mount custom JVM options files into `/usr/share/elasticsearch/config/jvm.options.d/`.
>
> You should never need to modify the root `jvm.options` file instead preferring to use custom JVM options files. The processing ordering of custom JVM options is lexicographic.

或者用环境变量的方法

```shell
# 单位可以用 g 或者 m
ES_JAVA_OPTS="-Xms2g -Xmx2g" ./bin/elasticsearch 
ES_JAVA_OPTS="-Xms4000m -Xmx4000m" ./bin/elasticsearch 
```

docker-compose 中这样设置

```yml
ES_JAVA_OPTS="-Xms2g -Xmx2g"
```



### 7. Heap dump path

通过`zip`、`tar`安装的默认位置在 elasticsearch 根目录下的data目录,默认配置如下

```shell
-XX:HeapDumpPath=data
```

`RAM`和`Debian`软件包发行版则在`/var/lib/elasticsearch`

可以在`jvm.options`文件中修改默认位置。

> 同样的需要在`jvm.options.d/`目录下创建新的`jvm.options`来覆盖，不要直接修改 root jvm.options 文件。

```shell
-XX:HeapDumpPath=...
```

可以指定目录（需要保证该目录存在且有足够的空间，es 不会自动创建），这样elasticsearch会自动根据pid 生成一个dump文件。

也可以指定到具体文件，这样就会按照文件名生成（生成的时候如果文件已存在则会导致生成失败）

### 8. GC logging

ES 中默认开启了，GC 日志，同时也提供了很多默认配置。

同样的在`jvm.options.d/`目录下创建一个`gc.options`来覆盖默认配置，而不是直接修改 root `jvm.options`

> 用另外的文件名或者后缀不知道会不会影响，先按默认的来吧。

docker 中也可以通过环境变量的方式修改

```shell
MY_OPTS="-Xlog:disable -Xlog:all=warning:stderr:utctime,level,tags -Xlog:gc=debug:stderr:utctime"
docker run -e ES_JAVA_OPTS="$MY_OPTS" # etc
```

### 9. Temp directory

ES 启动的时候会在系统临时目录下创建自己的私有临时目录。

有时候系统会自动清理长时间未访问的临时目录，可能就会把 ES 创建的临时目录清理掉了。

如果是通过`RAM`和`Debian`软件包发行版安装，并且通过 `systemd`启动的就没有这个问题（清理的时候会把相关临时目录排除在外）

如果是通过`tar.gz`安装并运行的就会有这个问题，需要指定一个不会被清理的目录，通过环境变量`$ES_TMPDIR`来设置（记得赋权限）。

看了下在root `jvm.options`中是这样用的

```shell
## JVM temporary directory
-Djava.io.tmpdir=${ES_TMPDIR}
```

修改话应该可以直接在`jvm.options.d/`目录创建自定义`jvm.options`并直接赋值

```shell
-Djava.io.tmpdir=/var/lib/tmpdir
```

> 没试过 不知道这样行不行



### 10. JVM fatal error logs

JVM 致命错误日志，默认是和其他日志放在一起的。

通过`zip`、`tar`安装的默认位置在 elasticsearch 根目录下的logs目录,默认配置如下

```shell
# specify an alternative path for JVM fatal error logs
-XX:ErrorFile=logs/hs_err_pid%p.log
```

`RAM`和`Debian`软件包发行版则在`/var/lib/elasticsearch`

可以在`jvm.options`文件中修改默认位置

```shell
-XX:ErrorFile=...
```

这个也可以手动指定到单独的一个目录，方便出异常后查看。



## 3. 系统配置

除了 Elasticsearch 本身的配置之外，Elasticsearch 投入生产环境还需要对系统进行一些设置。

具体在哪里配置，还是和安装方式有关。

通过`.zip`、`.tar.gz`安装的直接修改系统配置即可。

**最大文件描述符**

临时修改 - 只对当前会话有效

```shell
sudo ulimit -n 65535 
```

永久修改

修改`/etc/security/limits.conf` 配置文件。

> 这里也有一个 limits.conf.d/ 目录 相信你已经知道该怎么操作了

```shell
vi /etc/security/limits.conf
# 增加以下内容
# elasticsearch 表示只对这个用户修改限制
# - 代表同时修改 soft 和 hard 限制
# nofile max number of open file descriptors
elasticsearch  -  nofile  65535
```

elasticsearch 用户打开新会话就修改就会生效。

> Ubuntu ignores the `limits.conf` file for processes started by `init.d`. To enable the `limits.conf` file, edit `/etc/pam.d/su` and uncomment the following line:
>
> ```sh
> # session    required   pam_limits.so
> ```



如果是通过`RAM`和`Debian`软件包发行版安装，并且通过 `systemd`启动的，则需要修改 systemd service 文件。

一般是叫做`/usr/lib/systemd/system/elasticsearch.service`

可以直接修改这个文件，同样的也可以新建一个文件来覆盖里面的配置，例如`/etc/systemd/system/elasticsearch.service.d/override.conf`。具体修改如下

```shell
[Service]
LimitMEMLOCK=infinity
```

修改后重新加载服务

```shell
sudo systemctl daemon-reload
```



### 1.  Disable swapping

禁用交换空间。

有三种方法，首选项是第一种，否则根据具体情况选择 2或者3。

* 1）禁用所有交换文件

临时修改

```shell
sudo swapoff -a
```

永久关闭

修改`/etc/fstab`文件，注释掉所有包含`swap`单词的行。

* 2）配置 swappiness

将`vm.swappiness`值设置为1，减少内核交换趋势，正常情况下不进行交换，但是允许系统在紧急情况下进行交换。

```shell
vi /etc/sysctl.conf 

vm.swappiness = 1
```

* 3）启用 `bootstrap.memory_lock`

修改ES 配置文件`config/elasticsearch.yml`,增加如下参数

```shell
bootstrap.memory_lock: true
```

启动后使用如下请求查看成功没有

```shell
GET _nodes?filter_path=**.mlockall
```

如果是 false 则说明失败了，一般是因为没权限导致的。



### 2. File Descriptors

修改最大文件描述符。

* 1）临时修改 - 只对当前会话有效

```shell
sudo ulimit -n 65535 
```

* 2）永久修改

修改`/etc/security/limits.conf` 配置文件。

> 这里也有一个 limits.conf.d/ 目录 相信你已经知道该怎么操作了

```shell
vi /etc/security/limits.conf
# 增加以下内容
# elasticsearch 表示只对这个用户修改限制
# - 代表同时修改 soft 和 hard 限制
# nofile max number of open file descriptors
elasticsearch  -  nofile  65535
```

elasticsearch 用户打开新会话就修改就会生效。

修改后通过如下请求查看

```shell
GET _nodes/stats/process?filter_path=**.max_file_descriptors
```

### 3. Virtual memory

Elasticsearch 使用 mmapfs 目录存储索引，但是默认操作系统对 mmap 计数限制太低了（一般都不够用），会导致内存不足。

查看当前限制

```shell
[root@iZ2zeahgpvp1oasog26r2tZ vm]# sysctl vm.max_map_count
vm.max_map_count = 65530
```

临时修改 - 不需要重启

```shell
[root@iZ2zeahgpvp1oasog26r2tZ vm]# sysctl -w vm.max_map_count=262144
vm.max_map_count = 262144
```

永久修改 - 需要重启

```shell
vi /etc/sysctl.cof
# 增加 如下内容
vm.max_map_count = 262144
```

### 4. Number of threads

确保 elasticsearch 用户能至少创建 4096 个线程。

> 可能也需要对 root 账户进行增加。

* 临时修改 

```shell
ulimit -u 4096
```

* 永久修改

修改`/etc/security/limits.conf`

> 推荐把修改写到 /etc/security/limits.conf.d/limits.conf 中

```shell
vi /etc/security/limits.conf
# 增加如下内容
elasticsearch - nproc 4096
```

### 5. DNS cache settings

在配置文件`jvm.options`中修改

```shell
es.networkaddress.cache.ttl
es.networkaddress.cache.negative.ttl
```

### 6.  JNA temporary directory not mounted with `noexec`

只有 Linux 下需要做这个操作。

Elasticsearch 中 使用 Java Native Access (JNA) 来执行某些跨平台代码。在 Linux 下，默认情况相关代码会被复制到临时目录（如 /tmp），也可以通过配置（`jvm.options文件 -Djna.tmpdir=<path>`）来指定目录。

**问题：**在某些加固的 Linux 上会通过`noexec`方式来挂载 JNA，导致 JNA无法使用。JNA 启动时会报错`java.lang.UnsatisfiedLinkerError`。

此时需要重新以非`noexec`方式来挂载。

## 4. Bootstrap-checks

启动时的检查，这里只列举几个上面没讲到的项。

### 1. Max file size check

elasticsearch 有时候会写入很大的文件，但是受到系统限制，可能会写入失败，所以需要修改系统配置。

```shell
vi /etc/security/limits.conf
# 增加
elasticsearch - fsize unlimited
```

> 同样的 建议将修改添加在文件`/etc/security/limits.conf.d/limits.conf`中