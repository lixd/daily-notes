# Linux tc 工具使用

[Linux环境下模拟延时和丢包（TC）](https://blog.csdn.net/weixin_51084345/article/details/127256923)



延时

```bash
# 给 eth0 网卡发送的数据包加上 200ms 的延迟
tc qdisc add dev eth0 root netem delay 200ms
# 测试 执行 ping 查看延时是否生效
ping baidu.com
# 删除延迟规则
tc qdisc del dev eth0 root netem delay 200ms
```



丢包

```bash
# 指定 10% 丢包
tc qdisc add dev eth0 root netem loss 10%
# 测试 执行 ping 查看丢包是否生效
ping baidu.com
# 删除 10% 丢包规则
tc qdisc del dev eth0 root netem loss 10%
```

> **注意**：不要设置 100% 的丢包率，否则 ssh 都连不上去了。。。

