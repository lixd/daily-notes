# Switch参数类型

最开始的Java的switch语句只能判断byte、short、int、char类型 。

switch后面的括号里面只能放int类型的值，**注意是只能放int类型**，**但是放byte，short，char类型的也可以，是因为byte，short，shar可以自动提升（自动类型转换）为int**，不是说就可以放它们，说白了，你放的byte，short，shar类型，然后他们会自动转换为int类型（宽化，自动转换并且安全），其实最后放的还是int类型！

原理：Java中8种基本数据类型，boolean类型不参与转换，任何类型不能转换为boolean型，boolean也不能转换为其他类型，所以剩下7种，按照他们的表数范围，（也就是能表示的最大的数的大小，比如char是0到65535，byte是-128到正127）从小到大，排序，依次为：byte、short、char、int、long、float、double。

所以只能放int和比int小的byte、short、char

## 枚举

```java
public class test1 {
    public static void Switch(Week week) {

        switch (week) {
            case MONDAY:
                System.out.println("星期一");
                System.out.println(week.ordinal()); //1
                break;
            case FRIDAY:
                System.out.println("星期五");
                System.out.println(week.ordinal()); //5
                break;
        }
    }

    public static void main(String[] args) {
        Switch(Week.MONDAY);
    }

    public enum Week {
        MONDAY("星期一"), TWESDAY("星期二"), WEDNESDAY("星期三"), TUESDAY("星期四"), FRIDAY("星期五"), STAESDAY("星期六"), SUNDAY("星期日");
        private String desc;

        Week(String desc) {
            this.desc = desc;
        }

        public String getDesc() {
            return desc;
        }

        public void setDesc(String desc) {
            this.desc = desc;
        }

        @Override
        public String toString() {
            return "Week{" +
                    "desc='" + desc + '\'' +
                    '}';
        }
    }
}
```



switch判断的是枚举类的**ordinal**方法，即枚举值的序列值 。

Enum抽象类常见方法
Enum是所有 Java 语言枚举类型的公共基本类（注意Enum是抽象类），以下是它的常见方法：

返回类型	方法名称	方法说明
int	compareTo(E o)	比较此枚举与指定对象的顺序
boolean	equals(Object other)	当指定对象等于此枚举常量时，返回 true。
Class<?>	getDeclaringClass()	返回与此枚举常量的枚举类型相对应的 Class 对象
String	name()	返回此枚举常量的名称，在其枚举声明中对其进行声明
int	ordinal()	返回枚举常量的序数（它在枚举声明中的位置，其中初始常量序数为零）
String	toString()	返回枚举常量的名称，它包含在声明中
static<T extends Enum<T>> T	static valueOf(Class<T> enumType, String name)	返回带指定名称的指定枚举类型的枚举常量。



这里主要说明一下ordinal()方法，该方法获取的是枚举变量在枚举类中声明的顺序，下标从0开始，如日期中的MONDAY在第一个位置，那么MONDAY的ordinal值就是0，如果MONDAY的声明位置发生变化，那么ordinal方法获取到的值也随之变化，注意在大多数情况下我们都不应该首先使用该方法，毕竟它总是变幻莫测的。



## String

Java 7增强了switch语句的功能，允许switch语句的控制表达式是java.lang.String类型的变量或表达式，开始支持java.lang.String类型，但是不支持StringBuffer或StringBuilder这两种类型。 

```java
public class test1 {
    public static void Switch(String s) {

//        switch (week) {
//            case MONDAY:
//                System.out.println("星期一");
//                break;
//            case FRIDAY:
//                System.out.println("星期五");
//                break;
//        }
        switch (s) {
            case "a":
                System.out.println("a");
                System.out.println("a".hashCode()); //97
                break;
            case "b":
                System.out.println("b");
                System.out.println("b".hashCode()); //98
                break;
        }
    }

    public static void main(String[] args) {
        Switch("a");
    }

    public enum Week {
        MONDAY("星期一"), TWESDAY("星期二"), WEDNESDAY("星期三"), TUESDAY("星期四"), FRIDAY("星期五"), STAESDAY("星期六"), SUNDAY("星期日");
        private String desc;

        Week(String desc) {
            this.desc = desc;
        }

        public String getDesc() {
            return desc;
        }

        public void setDesc(String desc) {
            this.desc = desc;
        }

        @Override
        public String toString() {
            return "Week{" +
                    "desc='" + desc + '\'' +
                    '}';
        }
    }
}
```

反编译命令：`javap -c xxx.class`

java中switch支持String，是利用String的hash值，本质上是switch-int结构。并且利用到了equals方法来防止hash冲突的问题。最后利用switch-byte结构，精确匹配。 



## 参考

https://blog.csdn.net/kangkanglou/article/details/79526569