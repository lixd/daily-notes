# API Design

> [GoogleCloudAPI设计](https://cloud.google.com/apis/design)



### 标准方法

本章定义了标准方法（即 `List`、`Get`、`Create`、`Update` 和 `Delete` 的概念。标准方法可降低复杂性并提高一致性。

下表描述了如何将标准方法映射到 HTTP 方法：

| 标准方法 | HTTP映射                    | HTTP请求正文 | HTTP 响应正文             |
| -------- | --------------------------- | ------------ | ------------------------- |
| List     | GET <collection URL>        | N/A          | Resource* list            |
| Get      | GET <resource URL>          | N/A          | Resource*                 |
| Create   | POST <collection URL>       | Resource     | Resource*                 |
| Update   | PUT or PATCH <resource URL> | Resource     | Resource*                 |
| Delete   | DELETE <resource URL>       | N/A          | `google.protobuf.Empty`** |

从不立即移除资源的 `Delete` 方法（例如更新标志或创建长时间运行的删除操作）返回的响应**应该**包含长时间运行的操作或修改后的资源。

### 常用自定义方法

以下是常用或有用的自定义方法名称的精选列表。API 设计者在引入自己的名称之前**应该**考虑使用这些名称，以提高 API 之间的一致性。

| 方法名称 | 自定义动词  | HTTP 动词 | 备注                                                         |
| :------- | :---------- | :-------- | :----------------------------------------------------------- |
| 取消     | `:cancel`   | `POST`    | 取消一个未完成的操作，例如 [`operations.cancel`](https://github.com/googleapis/googleapis/blob/master/google/longrunning/operations.proto#L100)。 |
| batchGet | `:batchGet` | `GET`     | 批量获取多个资源。如需了解详情，请参阅[列表描述](https://cloud.google.com/apis/design/standard_methods#list)。 |
| 移动     | `:move`     | `POST`    | 将资源从一个父级移动到另一个父级，例如 [`folders.move`](https://cloud.google.com/resource-manager/reference/rest/v2/folders/move)。 |
| 搜索     | `:search`   | `GET`     | List 的替代方法，用于获取不符合 List 语义的数据，例如 [`services.search`](https://cloud.google.com/service-infrastructure/docs/service-consumer-management/reference/rest/v1/services/search)。 |
| 恢复删除 | `:undelete` | `POST`    | 恢复之前删除的资源，例如 [`services.undelete`](https://cloud.google.com/service-infrastructure/docs/service-management/reference/rest/v1/services/undelete)。建议的保留期限为 30 天。 |