读取Assets资源文件

```
总结:Android Studio读取Assets目录下的问题，就是2个问题而已
1.是assets目录的位置问题
2.是读取方法的问题，要用context.getClass().getClassLoader().getResourceAsStream("assets/"+资源名);

```

