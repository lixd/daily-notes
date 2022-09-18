# CICD 小结

* 如果团队有熟悉 Jenkins 的人，那么依旧推荐 Jenkins，后续问题便于排查
* 否则建议使用 Tekton + argocd 组合。
  * Tekton 是亲儿子，后续应该是主流
  * 由于当前 Tekton 还不够成熟，因此可以和 argocd 一起用，Tekton 做流水线，argocd 做 devops
  * 当然只用 Tekton 也不是不行