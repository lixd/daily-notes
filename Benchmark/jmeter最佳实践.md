# Jmeter 最佳实践

> [Best Practices[¶](https://jmeter.apache.org/usermanual/best-practices.html#best_practices)

调整Heap大小。

测试时发现，线程数上来后，会因为内存不够而报错。

Jmeter 中调整JAVA Heap 也比较简单。

Windows 则修改 jmeter.bat 文件

```shell
# jmeter.bat 151 行
set HEAP=-Xms1g -Xmx1g -XX:MaxMetaspaceSize=256m
```



Linux  可以直接修改 jmeter 文件。

```shell
# vim jmeter
# 更改下面这一句
: "${HEAP:="-Xms48g -Xmx48g -XX:MaxMetaspaceSize=32g"}"
```

