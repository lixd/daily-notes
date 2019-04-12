# AOP

```java
1.定义注解 @IgnoreSign 是否参与签名
2、定义一个拦截器或者切面 ApiAspect。
3、在这个拦截器或者切面里，拿到请求的参数，也就是那个Params对象。
4、通过反射，获取到这个Params对象所对应的类，类的名字肯定就是Params了。
5、遍历Params里面的所有Field，检查每一个Field是否含有注解。
6、遍历Field上的所有注解。
7、假设找到一个注解@IgnoreSign，即不参与签名
8、否则进行进行签名
9、直到遍历完所有Field、所有注解
```

