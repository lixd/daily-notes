# Systemd

## 编写unit文件，并注册到systemd服务中

第一步：准备一个shell脚本

```sh
vim /root/name.sh
```

     #!/bin/bash
            echo `hostname`>/tmp/name.log
第二步：创建unit文件     

 ```sh
  # vim my.service
 ```

```sh
[Unit]
        Description=this is my first unit file

        [Service]
        Type=oneshot
        ExecStart=/bin/bash /root/name.sh

        [Install]
        WantedBy=multi-user.target
```

​     

```sh
 # mv my.service /usr/lib/systemd/system
```

第三步：将我的unit文件注册到systemd中

```sh
   # systemctl enable my.service
```

第四步：查看该服务的状态

```sh
    # systemctl status my.service
```

