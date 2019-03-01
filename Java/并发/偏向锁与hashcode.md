# 偏向锁与hashcode

当Java处在偏向锁、重量级锁状态时，hashcode值存储在哪？

这是一个针对HotSpot VM的锁实现的问题。 简单答案是： 

- 当一个对象已经计算过identity hash code，它就无法进入偏向锁状态；
- 当一个对象当前正处于偏向锁状态，并且需要计算其identity hash code的话，则它的偏向锁会被撤销，并且锁会膨胀为重量锁；
- 重量锁的实现中，ObjectMonitor类里有字段可以记录非加锁状态下的mark word，其中可以存储identity hash code的值。或者简单说就是重量锁可以存下identity hash code。

 请一定要注意，这里讨论的`hash code`都只针对`identity hash code`。用户自定义的hashCode()方法所返回的值跟这里讨论的不是一回事。
`Identity hash code`是未被覆写的` java.lang.Object.hashCode()` 或者 `java.lang.System.identityHashCode(Object)` 所返回的值。

 

 因为mark word里没地方同时放bias信息和identity hash code。 HotSpot VM是假定“实际上只有很少对象会计算identity hash code”来做优化的；换句话说如果实际上有很多对象都计算了identity hash code的话，HotSpot VM会被迫使用比较不优化的模式。 

 

 

 

 

 

 

 

 

 