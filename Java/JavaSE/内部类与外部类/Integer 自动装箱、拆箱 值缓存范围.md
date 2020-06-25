# Integer 自动装箱、拆箱 值缓存范围

## 自动装箱、拆箱

基本类型变为包装类的过程称为装箱，将包装类变为基本数据类型的过程称为拆箱。

当我们直接给一个Integer对象赋一个int值的时候，会调用Integer类中的静态方法valueOf(int i)。

```java
public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
}
```

反之，当我们把一个Integer对象赋值给一个int类型时，会自动调用Integer类中的intValue()方法。

```java
/**
 * Returns the value of this {@code Integer} as an
 * {@code int}.
 */
public int intValue() {
    return value;
}
```

## Integer的值缓存范围

讲Integer类，就不得不提一个比较让人困惑的问题，先看下面的代码：

```java
public static void main(String[] args) {
		Integer i1 = 127;
		Integer i2 = 127;
		Integer i3 = 128;
		Integer i4 = 128;
		System.out.println(i1 == i2); 	//true
		System.out.println(i3 == i4); 	//false
        }
```

127时为true，为何128时就为false了，这就得知道Integer的值缓存范围了。

```java
private static class IntegerCache {
        static final int low = -128;
        static final int high;
        static final Integer cache[];
 
        static {
            int h = 127;
            String integerCacheHighPropValue =
                sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
            if (integerCacheHighPropValue != null) {
                try {
                    int i = parseInt(integerCacheHighPropValue);
                    i = Math.max(i, 127);                   
                    h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
                } catch( NumberFormatException nfe) {
                    // If the property cannot be parsed into an int, ignore it.
                }
            }
            high = h;
 
            cache = new Integer[(high - low) + 1];
            int j = low;
            for(int k = 0; k < cache.length; k++)
                cache[k] = new Integer(j++);
 
            // range [-128, 127] must be interned (JLS7 5.1.7)
            assert IntegerCache.high >= 127;
        }
 
        private IntegerCache() {}
    }
```

上面源码得知，字面量值范围在-128到127之间。前面提到当我们给Integer对象赋int值时会调用静态方法valueOf()。如果字面量的值在-128到127之间，那么不会new一个新的Integer对象，而是直接引用常量池里面的Integer对象，所以上面的i1 == i2返回结果为true。而i3和i4超出缓存范围，要分别new一个新的Integer对象，所以i3 == i4返回false。

## 例子

```java
Integer i1 = 40;
  Integer i2 = 40;
  Integer i3 = 0;
  Integer i4 = new Integer(40);
  Integer i5 = new Integer(40);
  Integer i6 = new Integer(0);

  System.out.println("i1=i2   " + (i1 == i2));
  System.out.println("i1=i2+i3   " + (i1 == i2 + i3));
  System.out.println("i1=i4   " + (i1 == i4));
  System.out.println("i4=i5   " + (i4 == i5));
  System.out.println("i4=i5+i6   " + (i4 == i5 + i6));   
  System.out.println("40=i5+i6   " + (40 == i5 + i6));     
```

结果：

```
i1=i2   true
i1=i2+i3   true
i1=i4   false
i4=i5   false
i4=i5+i6   true
40=i5+i6   true
```

解释：

语句 i4 == i5 + i6，因为+这个操作符不适用于 Integer 对象，首先 i5 和 i6 进行自动拆箱操作，进行数值相加，即 i4 == 40。然后 Integer 对象无法与数值进行直接比较，所以 i4 自动拆箱转为 int 值 40，最终这条语句转为 40 == 40 进行数值比较。

## 参考

`深入理解Java虚拟机`

`https://snailclimb.top/JavaGuide`

`https://www.jianshu.com/p/547b36f04239`

