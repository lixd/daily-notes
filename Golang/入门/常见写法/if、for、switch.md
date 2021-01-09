# if语句、for语句和switch语句

## 1. if





## 2. for

**使用携带`range`子句的`for`语句时需要注意哪些细节？**

```go
func forRange() {
	numbers2 := [...]int{1, 2, 3, 4, 5, 6}
	maxIndex2 := len(numbers2) - 1
	for i, e := range numbers2 {
		if i == maxIndex2 {
			numbers2[0] += e
		} else {
			numbers2[i+1] += e
		}
	}
	fmt.Println(numbers2)
}

// 输出
// [7 3 5 7 9 11]
```

在`for`语句中，对紧挨在当次迭代对应的元素后边的那个元素，进行重新赋值，新的值会是这两个元素的值之和。当迭代到最后一个元素时，把此`range`表达式结果值中的第一个元素值，替换为它的原值与最后一个元素值的和，最后打印出`numbers2`的值。

> 结果并不是 [233 6 10 15 21]

原因如下：

* 1）`range`表达式只会在`for`语句开始执行时**被求值一次**，无论后边会有多少次迭代；
* 2）`range`表达式的求值结果会被复制，也就是说，被迭代的对象是`range`表达式结果值的`副本`而不是原值。

## 3. switch

### 问题1

**`switch`语句中的`switch`表达式和`case`表达式之间有着怎样的联系？**

```go
func switchx() {
	value1 := [...]int8{0, 1, 2, 3, 4, 5, 6}
	switch 1 + 3 {
	case value1[0], value1[1]:
		fmt.Println("0 or 1")
	case value1[2], value1[3]:
		fmt.Println("2 or 3")
	case value1[4], value1[5], value1[6]:
		fmt.Println("4 or 5 or 6")
	}
}
```

如果`switch`表达式的结果值是无类型的常量，比如`1 + 3`的求值结果就是无类型的常量`4`，那么这个常量会被**自动地转换为此种常量的默认类型**的值，比如整数`4`的默认类型是`int`，又比如浮点数`3.14`的默认类型是`float64`。

因此，由于上述代码中的`switch`表达式的结果类型是`int`，而那些`case`表达式中子表达式的结果类型却是`int8`，它们的类型并不相同，所以这条`switch`语句是无法通过编译的。

```go
func switchB() {
	value1 := [...]int8{0, 1, 2, 3, 4, 5, 6}
	switch value1[4] {
	case value1[0], value1[1]:
		fmt.Println("0 or 1")
	case value1[2], value1[3]:
		fmt.Println("2 or 3")
	case value1[4], value1[5], value1[6]:
		fmt.Println("4 or 5 or 6")
	}
}
```

这样 最后转换出来 switch 和 case 都是 int8 类型，所以可以通过编译。



### 问题2

**`switch`语句对它的`case`表达式有哪些约束？**



**`switch`语句不允许`case`表达式中的子表达式结果值存在相等的情况**。不论这些结果值相等的子表达式，是否存在于不同的`case`表达式中，都会是这样的结果。

> 这个约束只能针对`结果值为常量的子表达式`。比如 数字 0 1 2 或者 子表达式 1+3 这种

```go
func switchC() {
	value3 := [...]int8{0, 1, 2, 3, 4, 5, 6}
	switch value3[4] {
	case 0, 1, 2:
		fmt.Println("0 or 1 or 2")
	case 2, 3, 4:
		fmt.Println("2 or 3 or 4")
	case 4, 5, 6:
		fmt.Println("4 or 5 or 6")
	}
}
```

上述代码很明显无法通过编译，因为 case 中存在了相同的结果。

```go
func switchD() {
	value5 := [...]int8{0, 1, 2, 3, 4, 5, 6}
	switch value5[4] {
	case value5[0], value5[1], value5[2]:
		fmt.Println("0 or 1 or 2")
	case value5[2], value5[3], value5[4]:
		fmt.Println("2 or 3 or 4")
	case value5[4], value5[5], value5[6]:
		fmt.Println("4 or 5 or26")
	}
```

这样就可绕过该约束，成功通过编译了。