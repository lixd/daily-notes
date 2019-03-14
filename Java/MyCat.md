# MyCat

## 1. 简介

* 一个彻底开源的，面向企业应用开发的大数据库集群

* 支持事务、ACID、可以替代MySQL的加强版数据库

* 一个可以视为MySQL集群的企业级数据库，用来替代昂贵的Oracle集群

* 一个融合内存缓存技术、NoSQL技术、HDFS大数据的新型SQL Server

* 结合传统数据库和新型分布式数据仓库的新一代企业级数据库产品

* 一个新颖的数据库中间件产品





## 2. 安装

### 2.1 下载

官网: `http://dl.mycat.io/`这里下载的是`Mycat-server-1.6.7.1-release-20190213150257-linux.tar.gz`

### 2.2 解压

上传压缩包到服务器上，然后解压。这里是放在`/usr/software`目录下的，解压到`/usr/local`目录下

```powershell
[root@localhost software]# tar -zxvf Mycat-server-1.6.7.1-release-20190213150257-linux.tar.gz -C /usr/local/
```

### 2.3 配置MySQL账号

解压玩就算安装好了，使用之前需要先配置一个mysql账号，后面就要通过mycat来访问MySQL了。

```mysql
#@ 前面的那个是 用户名 后面的是主机地址 %表示所有 最后的root是密码
mysql> grant all privileges on *.* to 'mycat'@'198.168.1.111' identified by 'root' with grant option;
```

## 3. Mycat配置

### 3.1 简介

mycat有很多配置文件，在`/usr/local/mycat/conf`目录下

```java
[root@localhost conf]# ls
autopartition-long.txt      ehcache.xml                  partition-hash-int.txt    sequence_db_conf.properties           wrapper.conf
auto-sharding-long.txt      index_to_charset.properties  partition-range-mod.txt   sequence_distributed_conf.properties  zkconf
auto-sharding-rang-mod.txt  log4j2.xml                   rule.xml                  sequence_time_conf.properties         zkdownload
cacheservice.properties     migrateTables.properties     schema.xml                server.xml
dbseq.sql                   myid.properties              sequence_conf.properties  sharding-by-enum.txt

```

其中比较重要的有：

* **server.xml** 	Mycat的配置文件，设置账号、参数等
* **schema.xml**	Mycat对应的物理数据库和数据库表的配置
* **rule.xml**  Mycat分片（分库分表）规则

### 3.2 wrapper.conf

mycat是用Java写的，所以运行需要在`wrapper.conf`中配置jdk

```xml
wrapper.java.command=/usr/local/java8/bin/java.exe
```

### 3.3 server.xml

#### 1. user标签 

```xml
<user name="root">
    <property name="password"></property>
    <property name="schemas">TESTDB</property>
    <property name="readOnly">true</property>
</user>
<!--
    user	用户配置节点
    --name	登录的用户名，也就是连接Mycat的用户名
    --password	登录的密码，也就是连接Mycat的密码
    --schemas	数据库名，这里会和schema.xml中的配置关联，多个用逗号分开，例如需要这个用户需要管理两个#数据库db1,db2，则配置db1,dbs	
    --readOnly 是否只读
-->
```

#### 2. privileges标签

```xml

<!--对用户的 schema以及表进行精细化的DML权限控制-->
<privileges check="false">

<!--check	表示是否开启DML权限检查。默认是关闭。server.dtd文件中-->
<!--ELEMENT privileges (schema)*> 说明可以有多个schema的配置。-->
<!--dml	顺序说明：insert,update,select,delete
    <schema name="db1" dml="0110" >
        <table name="tb01" dml="0000"></table>
        <table name="tb02" dml="1111"></table>
    </schema>
</privileges>
<!--
db1的权限是update,select。 
tb01的权限是啥都不能干。 
tb02的权限是insert,update,select,delete。 
其他表默认是udpate,select。
-->
```

#### 3. system标签

下面举例的属性仅仅是一部分，可以配置的变量很多，具体可以查看SystemConfig这个类的属性内容。 
System标签下的属性，一般是上线后，需要根据实际运行的情况，分析后调优的时候进行修改。

```xml
        <system>
        <property name="nonePasswordLogin">0</property> <!-- 0为需要密码登陆、1为不需要密码登陆 ,默认为0，设置为1则需要指定默认账户-->
        <property name="useHandshakeV10">1</property>
        <property name="useSqlStat">0</property>  <!-- 1为开启实时统计、0为关闭 -->
        <property name="useGlobleTableCheck">0</property>  <!-- 1为开启全加班一致性检测、0为关闭 -->
        <property name="sequnceHandlerType">2</property>
        <property name="subqueryRelationshipCheck">false</property> <!-- 子查询中存在关联查询的情况下,检查关联字段中是否有分片字段 .默认 false -->
      <!--  <property name="useCompression">1</property>--> <!--1为开启mysql压缩协议-->
        <!--  <property name="fakeMySQLVersion">5.6.20</property>--> <!--设置模拟的MySQL版本号-->
        <!-- <property name="processorBufferChunk">40960</property> -->
        <!-- 
        <property name="processors">1</property> 
        <property name="processorExecutor">32</property> 
         -->
        <!--默认为type 0: DirectByteBufferPool | type 1 ByteBufferArena | type 2 NettyBufferPool -->
                <property name="processorBufferPoolType">0</property>
                <!--默认是65535 64K 用于sql解析时最大文本长度 -->
                <!--<property name="maxStringLiteralLength">65535</property>-->
                <!--<property name="sequnceHandlerType">0</property>-->
                <!--<property name="backSocketNoDelay">1</property>-->
                <!--<property name="frontSocketNoDelay">1</property>-->
                <!--<property name="processorExecutor">16</property>-->
                <!--
                        <property name="serverPort">8066</property> <property name="managerPort">9066</property> 
                        <property name="idleTimeout">300000</property> <property name="bindIp">0.0.0.0</property> 
                        <property name="frontWriteQueueSize">4096</property> <property name="processors">32</property> -->
                <property name="handleDistributedTransactions">0</property>
<!--off heap for merge/order/group/limit      1开启   0关闭-->
                <property name="useOffHeapForMerge">1</property>

                <!--单位为m-->
        <property name="memoryPageSize">64k</property>

                <!-- 单位为k -->
                <property name="spillsFileBufferSize">1k</property>

                <property name="useStreamOutput">0</property>

                <!--单位为m-->
                <property name="systemReserveMemorySize">384m</property>
                
                <!--是否采用zookeeper协调切换  -->
                <property name="useZKSwitch">false</property>

                <!-- XA Recovery Log日志路径 -->
                <!--<property name="XARecoveryLogBaseDir">./</property>-->

                <!-- XA Recovery Log日志名称 -->
                <!--<property name="XARecoveryLogBaseName">tmlog</property>-->
       <!--如果为 true的话 严格遵守隔离级别,不会在仅仅只有select语句的时候在事务中切换连接-->
                <property name="strictTxIsolation">false</property>
                <property name="useZKSwitch">true</property>
        </system>
```

#### 4. Firewall标签

```xml
  <!-- 全局SQL防火墙设置 -->
        <!--白名单可以使用通配符%或着*-->
        <!--例如<host host="127.0.0.*" user="root"/>-->
        <!--例如<host host="127.0.*" user="root"/>-->
        <!--例如<host host="127.*" user="root"/>-->
        <!--例如<host host="1*7.*" user="root"/>-->
        <!--这些配置情况下对于127.0.0.1都能以root账户登录-->
        <!--
        <firewall>
           <whitehost>
              <host host="1*7.0.0.*" user="root"/>
           </whitehost>
       <blacklist check="false">
       </blacklist>
        </firewall>
        -->

```

### 3.4 schema.xml

--schema	数据库设置，此数据库为逻辑数据库，name与server.xml中schema对应
--dataNode	分片信息，也就是分库相关配置
--dataHost	物理数据库，真正存储数据的数据库

#### 1. schema 标签

schema标签用来定义mycat实例中的逻辑库，mycat可以有多个逻辑库，每个逻辑库都有自己的相关配置。可以使用schema标签来划分这些不同的逻辑库。
如果不配置schema标签，所有表的配置会属于同一个默认的逻辑库。逻辑库的概念和MySql的database的概念一样，我们在查询两个不同逻辑库中的表的时候，需要切换到该逻辑库下进行查询。

```xml
<schema name="TESTDB" checkSQLschema="false" sqlMaxLimit="100">
.....
</schema>

<!--name逻辑数据库名，与server.xml中的schema对应-->
<!--checkSQLschema	数据库前缀相关设置，当该值为true时，例如我们执行语句select * from TESTDB.company 。mycat会把语句修改为 select * from company 去掉TESTDB。-->
<!--sqlMaxLimit	当该值设置为某个数值时，每条执行的sql语句，如果没有加上limit语句，Mycat会自动加上对应的值。不写的话，默认返回所有的值。-->
<!--需要注意的是，如果运行的schema为非拆分库的，那么该属性不会生效。需要自己sql语句加limit。-->
```

#### 2. table 标签

```xml
<table name="travelrecord" dataNode="dn1,dn2,dn3" rule="auto-sharding-long" />
<table name="company" primaryKey="ID" type="global" dataNode="dn1,dn2,dn3" />
<!--name	表名，物理数据库中表名-->
<!--dataNode	表存储到哪些节点，多个节点用逗号分隔。节点为下文dataNode设置的name-->
<!--primaryKey	主键字段名，自动生成主键时需要设置-->
<!--autoIncrement	是否自增-->
<!--rule	分片规则名，具体规则下文rule详细介绍-->
<!--type 该属性定义了逻辑表的类型，目前逻辑表只有全局表和普通表。全局表： global 普通表：无 
#注：全局表查询任意节点，普通表查询所有节点效率低-->

<!--autoIncrement mysql对非自增长主键，使用last_insert_id() 是不会返回结果的，只会返回0.所以，只有定义了自增长主键的表，才可以用last_insert_id()返回主键值。-->
<!--mycat提供了自增长主键功能，但是对应的mysql节点上数据表，没有auto_increment,那么在mycat层调用--> 
    <!--last_insert_id()也是不会返回结果的。-->
<!--needAddLimit 指定表是否需要自动的在每个语句后面加上limit限制，由于使用了分库分表，数据量有时候会特别庞大，这时候执行查询语句，-->
<!--忘记加上limt就会等好久，所以mycat自动为我们加上了limit 100，这个属性默认为true，可以自己设置为false禁用。如果使用这个功能，最好配合使用数据库模式的全局序列。
<!----subTables	分表，分表目前不支持Join。-->
```

**childTable标签**

childTable 标签用于定义 E-R 分片的子表。通过标签上的属性与父表进行关联。

```xml
<table name="customer" primaryKey="ID" dataNode="dn1,dn2" rule="sharding-by-intfile"> 
	<childTable name="c_a" primaryKey="ID" joinKey="customer_id" parentKey="id" />
</table> 

<!--name	子表的名称-->
<!--joinKey	子表中字段的名称-->
<!--parentKey	父表中字段名称-->
<!--primaryKey	同Table-->
<!--needAddLimit	同Table-->
```

#### 3. dataNode标签

datanode标签定义了mycat中的数据节点，也就是我们所说的数据分片。一个datanode标签就是一个独立的数据分片。

```shell
<dataNode name="dn1" dataHost="localhost1" database="db1" />

#例子中的表述的意思为，使用名字为localhost1数据库实例上的db1物理数据库，这就组成一个数据分片，最后我们用dn1来标示这个分片。

#--name	定义数据节点的名字，这个名字需要唯一。我们在table标签上用这个名字来建立表与分片对应的关系
#--dataHost	用于定义该分片属于哪个数据库实例，属性与datahost标签上定义的name对应
#--database	用于定义该分片属于数据库实例上 的具体库。
```

#### 4. dataHost标签

这个标签直接定义了具体数据库实例，读写分离配置和心跳语句。

```xml
<dataHost name="localhost1" maxCon="1000" minCon="10" balance="0" writeType="0" dbType="mysql" dbDriver="native" switchType="1" slaveThreshold="100">
    <heartbeat>select user()</heartbeat>
    <writeHost host="hostM1" url="192.168.1.100:3306" user="root" password="123456">
    <readHost host="hostS1" url="192.168.1.101:3306" user="root" password="123456" />
    </writeHost>
</dataHost>
<!--name	唯一标示dataHost标签，供上层使用-->
<!--maxCon	指定每个读写实例连接池的最大连接。-->
<!--minCon	指定每个读写实例连接池的最小连接，初始化连接池的大小-->
<!--balance	负载均称类型-->

<!--balance="0"：不开启读写分离机制，所有读操作都发送到当前可用的writeHost上
balance="1"：全部的readHost与stand by writeHost参与select语句的负载均衡，简单的说，当双主双从模式（M1-S1，M2-S2 并且M1 M2互为主备），正常情况下，M2,S1,S2都参与select语句的负载均衡。
balance="2"：所有读操作都随机的在writeHost、readHost上分发
balance="3"：所有读请求随机的分发到writeHst对应的readHost执行，writeHost不负担读写压力。（1.4之后版本有）-->

<!--writeType	负载均衡类型。-->

<!--writeType="0", 所有写操作发送到配置的第一个 writeHost，第一个挂了切到还生存的第二个writeHost，重新启动后已切换后的为准，切换记录在配置文件中:dnindex.properties .
writeType="1"，所有写操作都随机的发送到配置的 writeHost。1.5以后版本废弃不推荐。-->

<!--switchType	-1不自动切换-->
<!--1 默认值 自动切换
2 基于MySql主从同步的状态决定是否切换心跳语句为 show slave status
3 基于mysql galary cluster 的切换机制（适合集群）1.4.1 心跳语句为 show status like 'wsrep%'-->

<!--dbType	指定后端链接的数据库类型目前支持二进制的mysql协议，还有其他使用jdbc链接的数据库，例如：mongodb，oracle，spark等-->
<!--dbDriver	指定连接后段数据库使用的driver，目前可选的值有native和JDBC。使用native的话，因为这个值执行的是二进制的mysql协议，所以可以使用mysql和maridb，其他类型的则需要使用JDBC驱动来支持。
如果使用JDBC的话需要符合JDBC4标准的驱动jar 放到mycat\lib目录下，并检查驱动jar包中包括如下目录结构文件 META-INF\services\java.sql.Driver。 在这个文件写上具体的driver类名，例如com.mysql.jdbc.Driver
writeHost readHost指定后端数据库的相关配置给mycat，用于实例化后端连接池。-->
<!--tempReadHostAvailable	-->

<!--如果配置了这个属性 writeHost 下面的 readHost 仍旧可用，默认 0 可配置（0、1）。-->
```

##### 1. heartbeat标签 

这个标签内指明用于和后端数据库进行心跳检查的语句。例如：MYSQL 可以使用 select user()，Oracle 可以使用 select 1 from dual 等。

```xml
 <heartbeat>select user()</heartbeat>
```

##### 2. writeHost /readHost 标签 

```xml
<writeHost host="hostM1" url="192.168.1.100:3306" user="root" password="123456">
    <readHost host="hostS1" url="192.168.1.101:3306" user="root" password="123456" />
 </writeHost>
```

这两个标签都指定后端数据库的相关配置，用于实例化后端连接池。唯一不同的是，writeHost 指定写实例、readHost 指定读实例。 
在一个 dataHost 内可以定义多个 writeHost 和 readHost。但是，如果 writeHost 指定的后端数据库宕机，那么这个 writeHost 绑定的所有 readHost 都将不可用。
另一方面，由于这个 writeHost 宕机，系统会自动的检测到，并切换到备用的 writeHost 上去。这两个标签的属性相同，这里就一起介绍。

```shell
#--host	用于标识不同实例，一般 writeHost 我们使用*M1，readHost 我们用*S1。
#--url	后端实例连接地址。Native：地址：端口 JDBC：jdbc的url
#--password	后端存储实例需要的密码
#--user	后端存储实例需要的用户名字
#--weight	权重 配置在 readhost 中作为读节点的权重
#--usingDecrypt	是否对密码加密，默认0。具体加密方法看官方文档。
```

### 3.5 rule.xml

rule.xml 里面就定义了我们对表进行拆分所涉及到的规则定义。我们可以灵活的对表使用不同的分片算法，或者对表使用相同的算法但具体的参数不同。 包含的标签 tableRule 和 function。

#### 1. tableRule标签

这个标签定义表规则。 定义的表规则在 schema.xml中。

```xml
        <tableRule name="rule1">
                <rule>
                        <columns>id</columns>
                        <algorithm>func1</algorithm>
                </rule>
        </tableRule>
<!--name 属性指定唯一的名字，用于标识不同的表规则。 内嵌的 rule 标签则指定对物理表中的哪一列进行拆分和使用什么路由算法。-->
<!--columns 内指定要拆分的列名字。--> 
<!--algorithm 使用 function 标签中的 name 属性。连接表规则和具体路由算法。当然，多个表规则可以连接到 同一个路由算法上。table 标签内使用。让逻辑表使用这个规则进行分片。-->
```

#### 2. function 标签

```xml
   <function name="murmur"
                class="io.mycat.route.function.PartitionByMurmurHash">
                <property name="seed">0</property><!-- 默认是0 -->
       <!-- 要分片的数据库节点数量，必须指定，否则没法分片 -->
                <property name="count">2</property>
                <property name="virtualBucketTimes">160</property><!-- 一个实际的数据库节点被映射为这么多虚拟节点，默认是160倍，也就是虚拟节点数是物理节点数的160>倍 -->
                <!-- <property name="weightMapFile">weightMapFile</property> 节点的权重，没有指定权重的节点默认是1。以properties文件的格式填写，以从0开始到count-1的整数值也就是节点索引为key，以节点权重值为值。所有权重值必须是正整数，否则以1代替 -->
                <!-- <property name="bucketMapPath">/etc/mycat/bucketMapPath</property> 
                        用于测试时观察各物理节点与虚拟节点的分布情况，如果指定了这个属性，会把虚拟节点的murmur hash值与物理节点的映射按行输出到这个文件，没有默认>值，如果不指定，就不会输出任何东西 -->
        </function>
<!--
    --name 指定算法的名字。 
    --class 制定路由算法具体的类名字。 
    --property 为具体算法需要用到的一些属性。
-->
```

## 4. Mycat基本使用

### 4.1 启动

在`/mycat/bin/` 目录下有一个启动脚本`mycat`

```shell
[root@localhost mycat]# bin/mycat start
Starting Mycat-server...
```

### 4.2 查看状态

```shell
#正常情况
[root@localhost mycat]# bin/mycat status
Mycat-server is running (28458).
#错误情况
[root@localhost mycat]# bin/mycat status
Mycat-server is not running.
```

### 4.3 查看日志

```shell
[root@localhost mycat]# bin/mycat console
Running Mycat-server...
wrapper  | ERROR: Could not write pid file /usr/local/mycat/logs/mycat.pid: No such file or directory
```

### 4.4 登录MySQL

Mycat 提供了类似数据库的管理监控方式，可以通过 MySQL 命令行登陆管理端口 9066 执行相应的 SQL 语句进行管理，可以可以通过 JDBC 的方式进行远程连接管理，使用 MySQL 命令行登陆示例如下

```shell
#格式 mysql -h192.168.1.111 -umycat -P9066 -proot 

-h：参数后面是主机IP
-u：是mycat配置的逻辑库的用户
-p：是mycat配置的逻辑库的用户密码
-P：是端口号
-d：是逻辑库名称

可以使用 show @@help 查询所有命令
```



### 问题

服务启动失败

```shell
[root@localhost mycat]# bin/mycat status
Mycat-server is not running.
```

查看日志

```shell
[root@localhost mycat]# bin/mycat console
Running Mycat-server...
wrapper  | ERROR: Could not write pid file /usr/local/mycat/logs/mycat.pid: No such file or directory
```

logs目录不存在导致的，创建目录后再次启动就好了。