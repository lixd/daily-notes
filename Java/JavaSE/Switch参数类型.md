# Switch参数类型

最开始的Java的switch语句只能判断byte、short、int、char类型 。

switch后面的括号里面只能放int类型的值，**注意是只能放int类型**，**但是放byte，short，char类型的也可以，是因为byte，short，shar可以自动提升（自动类型转换）为int**，不是说就可以放它们，说白了，你放的byte，short，shar类型，然后他们会自动转换为int类型（宽化，自动转换并且安全），其实最后放的还是int类型！

原理：Java中8种基本数据类型，boolean类型不参与转换，任何类型不能转换为boolean型，boolean也不能转换为其他类型，所以剩下7种，按照他们的表数范围，（也就是能表示的最大的数的大小，比如char是0到65535，byte是-128到正127）从小到大，排序，依次为：byte、short、char、int、long、float、double。

所以只能放int和比int小的byte、short、char

## String

Java 7增强了switch语句的功能，允许switch语句的控制表达式是java.lang.String类型的变量或表达式，开始支持java.lang.String类型，但是不支持StringBuffer或StringBuilder这两种类型。 

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//
 
public class SwitchString {
    public SwitchString() {
    }
 
    public static void main(String[] var0) {
        String var1 = var0[0];
        byte var2 = -1;
        //这里 switch中的string被替换为str的hashcode了
        switch(var1.hashCode()) {
        case 65:
            if (var1.equals("A")) {
                var2 = 0;
            }
            break;
        case 66:
            if (var1.equals("B")) {
                var2 = 1;
            }
        }
 
        switch(var2) {
        case 0:
        case 1:
        default:
        }
    }
}
```



java中switch支持String，是利用String的hash值，本质上是switch-int结构。并且利用到了equals方法来防止hash冲突的问题。最后利用switch-byte结构，精确匹配。 