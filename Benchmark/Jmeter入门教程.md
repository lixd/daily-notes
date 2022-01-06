# Jmeter性能测试

## 1.概述

Apache JMeter 是一款纯java编写负载功能测试和性能测试开源工具软件。相比Loadrunner而言，JMeter小巧轻便且免费，逐渐成为了主流的性能测试工具，是每个测试人员都必须要掌握的工具之一。

本文为JMeter性能测试完整入门篇，从Jmeter下载安装到编写一个完整性能测试脚本、最终执行性能测试并分析性能测试结果。

运行环境为 Windows 10 系统，JDK 版本为 1.8，JMeter 版本为5.1.1。

## 2. 环境准备

### 2.1 JDK下载

首先需要配置 JDK 环境。JMeter5 最低需要 JDK1.8。

JDK官网下载地址：`http://www.oracle.com/technetwork/java/javase/downloads/index.html`

下载配置环境变量即可。

### 2.2 JMeter下载

官网下载地址：`http://jmeter.apache.org/download_jmeter.cgi`

下载最新 JMeter 5.3 版本：apache-jmeter-5.3.zip 

下载完成后解压,双击 JMeter 解压路径（apache-jmeter-5.3/bin）下面的`jmeter.bat`即可 

## 3.  测试实例

我们选取最常见的百度搜索接口：

### 3.1 接口地址

`http://www.baidu.com/s?ie=utf-8&wd=指月小筑`

### 3.2 请求参数

* **ie**：编码方式，默认为utf-8 
* **wd**: 搜索词

## 3.3 返回结果

搜索结果，我们可以通过校验结果中是否含有搜索词`wd`来判断本次请求成功或失败。

# 4. JMeter脚本编写

看不习惯英文的可以切换到中文，点击菜单栏Options-->Choose language-->Chinese(simplified)

## 4.1 添加线程组

右键点击左边栏的“测试计划” -> “添加” -> “Threads(Users)” -> “线程组” 

这里可以配置线程组名称，线程数，准备时长（Ramp-Up Period(in seconds)）循环次数，调度器等参数： 

线程组参数详解： 
1. 线程数：虚拟用户数。一个虚拟用户占用一个进程或线程。设置多少虚拟用户数在这里也就是设置多少个线程数。 
2. Ramp-Up Period(in seconds)准备时长：设置的虚拟用户数需要多长时间全部启动。如果线程数为10，准备时长为2，那么需要2秒钟启动10个线程，也就是每秒钟启动5个线程。 
3. 循环次数：每个线程发送请求的次数。如果线程数为10，循环次数为100，那么每个线程发送100次请求。总请求数为10*100=1000 。如果勾选了“永远”，那么所有线程会一直发送请求，一到选择停止运行脚本。 
4. Delay Thread creation until needed：直到需要时延迟线程的创建。 
5. 调度器：设置线程组启动的开始时间和结束时间(配置调度器时，需要勾选循环次数为永远) 
    持续时间（秒）：测试持续时间，会覆盖结束时间 
    启动延迟（秒）：测试延迟启动时间，会覆盖启动时间 
    启动时间：测试启动时间，启动延迟会覆盖它。当启动时间已过，手动只需测试时当前时间也会覆盖它。 
    结束时间：测试结束时间，持续时间会覆盖它。

因为接口调试需要，我们暂时均使用默认设置，待后面真正执行性能测试时再回来配置。

## 4.2 添加HTTP请求

右键点击“线程组” -> “添加” -> “Sampler” -> “HTTP请求” 

对于我们的接口`http://www.baidu.com/s?ie=utf-8&wd=指月小筑`性能测试，可以参考如下填写： 

* web服务器
  * 协议：http 
  * 服务器域名或ip：www.baidu
* http请求
  * 方法：GET
  * 路径：/s
  * 内容编码：utf-8
* Params
  * ie：utf-8 不编码
  * wd：幻境云图 编码

Http请求主要参数详解：

Web服务器 
协议：向目标服务器发送HTTP请求协议，可以是HTTP或HTTPS，默认为HTTP 
服务器名称或IP ：HTTP请求发送的目标服务器名称或IP 
端口号：目标服务器的端口号，默认值为80 
2.Http请求 
方法：发送HTTP请求的方法，可用方法包括GET、POST、HEAD、PUT、OPTIONS、TRACE、DELETE等。 
路径：目标URL路径（URL中去掉服务器地址、端口及参数后剩余部分） 
Content encoding ：编码方式，默认为ISO-8859-1编码，这里配置为utf-8
同请求一起发送参数 
在请求中发送的URL参数，用户可以将URL中所有参数设置在本表中，表中每行为一个参数（对应URL中的 name=value），注意参数传入中文时需要勾选“编码”

## 4.3 添加察看结果树

右键点击“线程组” -> “添加” -> “监听器” -> “察看结果树” 

这时，我们运行Http请求，修改响应数据格式为“HTML Source Formatted”，可以看到本次搜索返回结果页面标题为”jmeter性能测试_百度搜索“。 

菜单栏的绿色箭头

## 4.4 添加用户自定义变量

我们可以添加用户自定义变量用以Http请求参数化，右键点击“线程组” -> “添加” -> “配置元件” -> “用户定义的变量”：

新增一个参数wd，存放搜索词： 

并在Http请求中使用该参数，格式为：${wd} 

将wd：幻境云图替换为wd：${wd}

## 4.5 添加断言

右键点击“HTTP请求” -> “添加”-> “断言” -> “响应断言” 

我们校验返回的文本中是否包含搜索词，添加参数${wd}到要测试的模式中： 

## 4.6 添加断言结果

右键点击“HTTP请求” -> “添加”-> “监听器” -> “断言结果” 

这时，我们再运行一次就可以看到断言结果成功或失败了 

## 4.7 添加聚合报告

右键点击“线程组” -> “添加” -> “监听器” -> “聚合报告”，用以存放性能测试报告 

这样，我们就完成了一个完整Http接口的JMeter性能测试脚本编写。

### 4.8 获取接口返回值

将上一个接口的返回值作为下一个接口的请求参数。

右键点击“HTTP请求” -> “添加” -> “后置处理器” -> “JSON提取器”。

```sh
参数名：后面接口引用的名字  name
json表达式：$.x.x 这个格式 $.user.name
```

例子

```sh
{
"status":200,
"data":[
{"id":12341,"name":"test1"},
{"id":12342,"name":"test2"}
]
}
```

获取第一个user的name

```sh
参数名 name
json表达式 $.data[0].name
缺省值表示参数没有取到的话，默认给它的值。一般不填。
```

下一个接口使用时直接引用name即可`${name}`

如果不是json格式返回结果则可以使用`正则表达式提取器`

右键点击“HTTP请求” -> “添加” -> “后置处理器” -> “正则表达式提取器”。

```sh
参数名： 同上 引用名称 name
正则表达式： .*"name":"(.+?)".*  小括号（）表示提取，也就是说对于你想要提取的内容要用它括起来
模板：$1$      模板是使用提取到的第几个值。因为可能有多个值匹配，所以要使用模板。从1开始匹配，依次类推。这里获取第一个，所以使用$1$即可。
匹配数字： 表示如何取值。0代表随机取值，1代表全部取值。这里只有一个，填1即可。
缺省值： 表示参数没有取到的话，默认给它的值。一般不填。
```

例子

```sh
{
"status":200,
"data":[
{"id":12341,"name":"test1"},
{"id":12342,"name":"test2"}
]
}
```

获取上面的第一个name

```sh
参数名： name
正则表达式： .*"name":"(.+?)".* 
模板：$1$      
匹配数字： 1
缺省值： "defaultname"
```



## 5. 命令行启动

使用GUI方式启动jmeter，运行线程较多的测试时，会造成内存和CPU的大量消耗，导致客户机卡死。

所以正确的打开方式是在GUI模式下调整测试脚本，再用命令行模式执行。

启动命令

```sh
jmeter -n -t <testplan filename> -l <listener filename>
# -n 设置命令模式
# -t 指定脚本文件路径 即测试计划文件的路径 xxx.JMX
# -l 指定结果文件路径
ex：jmeter -n -t E:\Work\Project\Test\apache-jmeter-5.1.1\vaptcha\testplan\apiTest.jmx -l E:\Work\Project\Test\apache-jmeter-5.1.1\vaptcha\result\result.jtl

/usr/local/jmeter/apache-jmeter-5.3/bin/jmeter -n -t /usr/local/jmeter/testplan/puugTest.jmx -l /usr/local/jmeter/result/puug/result128.jtl
```

执行命令前要检查当前目录是否是`%JMeter_Home%\bin`目录；如果 JMeter 脚本不在当前目录，需要指定完整的路径；如果要把执行的结果保存在其他地方也要指定完整的路径。命令中不指定测试计划与测试结果的路径时，默认都是在该目录下。

命令中不写位置的话中间文件默认生成在bin下，下次执行不能覆盖，需要先删除result.jtl；报告指定文件夹同理，需要保证文件夹为空

**将windows下的测试计划拿到linux下执行遇到的问题**

```sh
[root@iZ2ze8rcch16k4k7kdtwmpZ bin]# /usr/local/jmeter/apache-jmeter-5.1.1/bin/jmeter -n -t /usr/local/jmeter/testplan/apiTest.jmx -l /usr/local/jmeter/result/result/jtl
Error in NonGUIDriver java.lang.IllegalArgumentException: Problem loading XML from:'/usr/local/jmeter/testplan/apiTest.jmx'. 
Cause:
CannotResolveClassException: kg.apc.jmeter.perfmon.PerfMonCollector

 Detail:com.thoughtworks.xstream.converters.ConversionException: 
---- Debugging information ----
cause-exception     : com.thoughtworks.xstream.converters.ConversionException
cause-message       : 
first-jmeter-class  : org.apache.jmeter.save.converters.HashTreeConverter.unmarshal(HashTreeConverter.java:67)
class               : org.apache.jmeter.save.ScriptWrapper
required-type       : org.apache.jmeter.save.ScriptWrapper
converter-type      : org.apache.jmeter.save.ScriptWrapperConverter
path                : /jmeterTestPlan/hashTree/hashTree/hashTree/kg.apc.jmeter.perfmon.PerfMonCollector
line number         : 278
version             : 5.1.1 r1855137

```

原因

1、linux环境jmeter与win环境编写脚本的jmeter版本不一致，版本改为一致

2、脚本中存在中文，去除中文

3、脚本中存在类似于jp@gc - Active Threads Over Time 监听器，去除监听器（查看结果树和聚合报告可以保留）





## 6. 其他

### 随机数

> [Jmeter 随机数](https://blog.csdn.net/alice_tl/article/details/88725006)

Jmeter 内置有 Random 和 UUID 两个方法用来生成随机数。



Random使用方式：${__Random( param1,param2 ,param3 )}

- param1为随机数的下限
- param2为随机数的上限
- param3为存储随机数的变量名，是选填项。

具体使用：

加上随机数范围是 100~200，,再传递参数时，直接将参数指定为`${__Random( 100,200,xxx)}` 即可。

> 直接作为参数使用时，第三个参数可以不填



如果想作为公共变量，让多个请求都使用则可以使用 Sampler 来实现。

右键线程组，添加-->Sampler-->Debug Sampler，然后把名称直接改成 `${__Random( 100,200,id)}` 即可。

> 这里是创建了一个叫做 id 的变量。

如果是希望生成电话号码，尾号为这些随机数，则可以再新建一个Debug Sample，名字改成`123456789${id}` 这样套娃即可。

UUID使用方式：${__UUID}

示例：'businessNo':'${__UUID}

*那么Random和UUID两个函数有什么差别呢？*

Random生成随机数，是可能会重复的。UUID是一定不会出现重复的。

所以建议使用UUID函数。

