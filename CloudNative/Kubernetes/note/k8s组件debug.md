# k8s 组件 debug

k8s 相关组件启动时指定 --v 参数指定的日志级别。

```BASH
--v=0 Generally useful for this to ALWAYS be visible to an operator. 
--v=1 A reasonable default log level if you don’t want verbosity.
--v=2 Useful steady state information about the service and important log messages that may correlate to significant changes in the system. This is the recommended default log level for most systems. 
--v=3 Extended information about changes. 
--v=4 Debug level verbosity. 
--v=6 Display requested resources. 
--v=7 Display HTTP request headers. 
--v=8 Display HTTP request contents 
```



比如 kubelet

先找到 kubelet 的 systemd service 配置文件：

```Bash
[root@kc1 deploy]# systemctl show kubelet|grep -E "FragmentPath|DropInPaths"

FragmentPath=/etc/systemd/system/kubelet.service

DropInPaths=/etc/systemd/system/kubelet.service.d/10-kubeadm.conf
```

其中 dropin 会覆盖掉默认的配置，所以我们需要修改 dropin 这个

修改其中的启动命令，设置显示 debug 日志。

```bash

vi /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
...
                                                                                     # Note: This dropin only works with kubeadm and kubelet v1.11+                                                                                                                 
[Service]                                                                                                                                                                                                          EnvironmentFile=-/etc/default/kubelet                                                                                                                                       ExecStart=                                                                                                                                                                     # 这里增加 --v=5  显示 debug 日志
ExecStart=/usr/bin/kubelet --v=5 $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS   

 ...                                                    
```



然后重启 kubelet

```Bash
systemctl daemon-reload

systemctl restart kubelet
```

然后就能看到 debug 日志了，(不过 debug 日志太多了，只能过滤了看)

```bash
journalctl -u kubelet
```

