# prometheus stack 部署

## 部署

> 本文使用 [ kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) 进行 prometheus stack 部署。

参考以下兼容性表，根据 k8s 版本选择对应 kube-prometheus 版本。

| kube-prometheus stack                                        | Kubernetes 1.20 | Kubernetes 1.21 | Kubernetes 1.22 | Kubernetes 1.23 | Kubernetes 1.24 |
| ------------------------------------------------------------ | --------------- | --------------- | --------------- | --------------- | --------------- |
| [release-0.8](https://github.com/prometheus-operator/kube-prometheus/tree/release-0.8) | ✔               | ✔               | ✗               | ✗               | ✗               |
| [release-0.9](https://github.com/prometheus-operator/kube-prometheus/tree/release-0.9) | ✗               | ✔               | ✔               | ✗               | ✗               |
| [release-0.10](https://github.com/prometheus-operator/kube-prometheus/tree/release-0.10) | ✗               | ✗               | ✔               | ✔               | ✗               |
| [release-0.11](https://github.com/prometheus-operator/kube-prometheus/tree/release-0.11) | ✗               | ✗               | ✗               | ✔               | ✔               |
| [main](https://github.com/prometheus-operator/kube-prometheus/tree/main) | ✗               | ✗               | ✗               | ✗               | ✔               |

> 0.8 之前的版本自行到 github repo 查看。



当前使用的是 k8s v1.23.6,因此选择 kube-prometheus 0.11，先克隆代码

```Bash
git clone -b release-0.11 git@github.com:prometheus-operator/kube-prometheus.git
```



(可选)设置部署的 namespace,默认为 monitoring

```Bash
sed -i 's/monitoring/<my namespace>/g' manifests/setup/namespace.yaml
```

部署 prometheus stack，包括以下组件：

- 1）prometheus

- 2）node-exporter

- 3）alertmanager

- 4）grafana



首先替换 yaml 中的镜像为国内镜像

```Bash
sed -i 's/k8s.gcr.io\/kube-state-metrics\/kube-state-metrics:v2.5.0/bitnami\/kube-state-metrics:2.5.0/' manifests/kubeStateMetrics-deployment.yaml


sed -i 's/k8s.gcr.io\/prometheus-adapter\/prometheus-adapter:v0.9.1/willdockerhub\/prometheus-adapter:v0.9.1/' manifests/prometheusAdapter-deployment.yaml
```



然后部署

```Bash
# Create the namespace and CRDs, and then wait for them to be available before creating the remaining resources
kubectl apply --server-side -f manifests/setup
until kubectl get servicemonitors --all-namespaces ; do date; sleep 1; echo ""; done
kubectl apply -f manifests/
```



查看部署情况

```Bash
[root@vpa kube-prometheus]# kubectl -n monitoring get po
NAME                                  READY   STATUS    RESTARTS   AGE
alertmanager-main-0                   2/2     Running   0          108m
alertmanager-main-1                   2/2     Running   0          108m
alertmanager-main-2                   2/2     Running   0          108m
blackbox-exporter-746c64fd88-hbmlh    3/3     Running   0          110m
grafana-5fc7f9f55d-bnrdf              1/1     Running   0          110m
kube-state-metrics-6d7746678c-kvqtr   3/3     Running   0          22m
node-exporter-nbk56                   2/2     Running   0          110m
prometheus-adapter-c76fb84d7-j4v4t    1/1     Running   0          22m
prometheus-adapter-c76fb84d7-vwrjj    1/1     Running   0          22m
prometheus-k8s-0                      2/2     Running   0          108m
prometheus-k8s-1                      2/2     Running   0          108m
prometheus-operator-f59c8b954-qd5r7   2/2     Running   0          110m
```



## AccessUIs

可以使用 port-forward 方式临时暴露端口访问，也可以将 service 改成 nodePort



### Prometheus

```Bash
kubectl --namespace monitoring port-forward svc/prometheus-k8s 9090

# or

kubectl -n monitoring  patch svc prometheus-k8s -p '{"spec":{"type":"NodePort"}}'
```

Then access via [http://localhost:9090](http://localhost:9090/)



### grafana 

```Bash
kubectl --namespace monitoring port-forward svc/grafana 3000

#or

kubectl -n monitoring  patch svc grafana  -p '{"spec":{"type":"NodePort"}}'
```

Then access via [http://localhost:3000](http://localhost:3000/) and use the default grafana user:password of `admin:admin`.



### alertmanager

```Bash
kubectl --namespace monitoring port-forward svc/alertmanager-main 9093

#or

kubectl -n monitoring  patch svc alertmanager-main-p '{"spec":{"type":"NodePort"}}'
```

Then access via [http://localhost:9093](http://localhost:9093/)