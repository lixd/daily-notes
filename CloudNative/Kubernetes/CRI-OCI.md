## CRI OCI



CRI：Container Runtime Interface

Kubernetes 为了支持或兼容多种容器运行时，同时将下层容器运行时的差异屏蔽掉，抽象除了 CRI 这一层。

OCI：Open Container Interface

不同容器的运行时也有所不同，为了保证统一，制定了 OCI 这样一个标准。