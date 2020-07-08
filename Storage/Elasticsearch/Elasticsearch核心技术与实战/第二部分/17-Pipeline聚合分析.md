# Pipeline 聚合分析

## 1. 概述

* 管道的概念：支持对聚合分析的结果，再次进行聚合分析。
* Pipeline 的分析结果会输出到原结果中，根据位置的不同，分为两类
  * Sibling - 结果和现有分析结果同级
    * Max、Min、Avg & Sum Bucket
    * Stats、Extended Status Bucket
    * Percentile Bucket
  * Parent - 结果内嵌到现有的聚合分析结果中
    * Derivative（求导）
    * Cumulative Sum（累计求和）
    * Moving Function（滑动窗口）



## 例子

在员工最多的工种里，找出平均工资最低的工种。

**Sibling**

 ```shell
# 平均工资最低的工作类型
POST employees/_search
{
  "size": 0,
  "aggs": {
  	# 1. 按 job 分桶
    "jobs": {
      "terms": {
        "field": "job.keyword",
        "size": 10
      },
      # 2. 子聚合查询求出 平均工资
      "aggs": {
        "avg_salary": {
          "avg": {
            "field": "salary"
          }
        }
      }
    },
    # 3. 管道聚合 格式与普通聚合一致
    # 名字为  min_salary_by_job
    "min_salary_by_job":{
     # 类型为 min_bucket 即从前面的分桶里找出最小的
      "min_bucket": {
      	# 指定去哪个分桶里找
      	# jobs avg_salary 为前面聚合的名字
      	# > 大于符号表明了层级关系
        "buckets_path": "jobs>avg_salary"
      }
    }
  }
}
 ```

**`buckets_path`就是关键字**

