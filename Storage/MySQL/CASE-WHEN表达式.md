# CASE WHEN表达式

CASE WHEN表达式用于对数据进行归类。

```mysql
CASE WHEN condition1 THEN result1
     [WHEN condition2 THEN result2]
     [ELSE result3]
END
```



* condition：条件表达式。
* result：  返回结果。



**示例**

示例1：从**http_user_agent**字段值中提取浏览器信息，归为Chrome、Safari和unknown三种类型并计算三种类型对应的访问PV。

```mysql
SELECT
  CASE
    WHEN http_user_agent like '%Chrome%' then 'Chrome'
    WHEN http_user_agent like '%Safari%' then 'Safari'
    ELSE 'unknown'
  END AS http_user_agent,
  count(*) AS pv
GROUP BY
  http_user_agent
FROM access_log;
```

结果如下

| http_user_agent | pv   |
| --------------- | ---- |
| Chrome          | 123  |
| Safari          | 456  |
| unknown         | 789  |

