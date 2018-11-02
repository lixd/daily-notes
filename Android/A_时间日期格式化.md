# 时间日期格式化

```java
Calendar calendar = Calendar.getInstance();
//方法1
long time = calendar.getTimeInMillis();
Date date = new Date(time);
SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss");
String timestring = format.format(date);
//方法2
String str = String.format("%tF %<tT", calendar.getTimeInMillis());
```

