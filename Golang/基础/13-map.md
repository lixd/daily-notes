# map

## 概述

map是一种key，value数据结构。

## map声明

### map声明1 先声明再make

var mapName `map`[keyType]valueType

其中`map`为关键字

**通常情况key下是int或string，value是数字、string、map、struct**

声明map是不会分配内存的，初始化需要make，分配内存后才能赋值和使用。

```go
package main

import "fmt"

func main() {
	//map声明
	var names map[int]string
	//使用前make 为map分配内存空间
	names = make(map[int]string)

	names[0] = "Go"
	names[1] = "C"
	names[1] = "C++" //覆盖前面的
	names[2] = "Python"
	names[3] = "Java"
	//map[0:Go 1:C++ 2:Python 3:Java]
	fmt.Println(names)
}
```

* 1.map 在使用前一定要 make
* 2.map 的 key 是不能重复的，如果重复了，则后面的 value 会覆盖前面的
* 3.map 的 value 是可以重复的
* 4.map 的 key-value 是无序的
* 5.make 内置函数

```go
func make
func make(Type, size IntegerType) Type
内建函数make分配并初始化一个类型为切片、映射、或通道的对象。其第一个实参为类型，而非值。make的返回类型与其参数相同，而非指向它的指针。其具体结果取决于具体的类型：

切片：size指定了其长度。该切片的容量等于其长度。切片支持第二个整数实参可用来指定不同的容量；
     它必须不小于其长度，因此 make([]int, 0, 10) 会分配一个长度为0，容量为10的切片。
映射：初始分配的创建取决于size，但产生的映射长度为0。size可以省略，这种情况下就会分配一个
     小的起始大小。
通道：通道的缓存根据指定的缓存容量初始化。若 size为零或被省略，该信道即为无缓存的。
```

### map声明2 直接make

```go
//map声明2 直接make
	var names2 = make(map[int]string)
	names2[0] = "Go"
	names2[1] = "C"
	names2[2] = "Python"
	names2[3] = "Java"
	fmt.Println(names2)
```

### map声明3 直接赋值

```go
	//map声明3 直接赋值
	var names3 map[int]string = map[int]string{
		0: "Go",
		1: "C",
		2: "Python",
		3: "Java"}
	fmt.Println(names3)
```

## 增删改查

### 删除

```go
func delete
func delete(m map[Type]Type1, key Type)
内建函数delete按照指定的键将元素从映射中删除。若m为nil或无此元素，delete不进行操作,也不会报错
```

* 1.删除所有的key，没有专门的方法（类似map.clear()），可以遍历一下key，逐个删除
* 2.或者map=make(...) ,make一个新的 让原来的成为垃圾被gc回收

### 查找

```go
	s,isFind := names2[12]
	if isFind {
		fmt.Println(s)
	}else {
		fmt.Println("没有这个key")
	}
```

如果`names2`这个map中存在`12`这个key则`isFind`返回`true` 否则为`false`

## map遍历

map遍历只能使用for-range的结构遍历



## map切片

切片的数据类型是map则称为map切片，这样使用则map个数可以动态变化了。

```go
	//map切片
	var userMap []map[string]string
	//切片需要make
	userMap=make([]map[string]string,2)
	//map也需要make
	userMap[0]=make(map[string]string,2)
	userMap[0]["name"]="illusory"
	userMap[0]["age"]="22"
	userMap[1] = make(map[string]string, 2)
	userMap[1]["name"] = "Azz"
	userMap[1]["age"] = "22"
	//越界了 切片动态扩容 使用append
	//userMap[2] = make(map[string]string, 2)
	//userMap[2]["name"] = "webpack"
	//userMap[2]["age"] = "22"

	newUser:=map[string]string{
		"name":"newUser",
		"age":"30"}

	userMap = append(userMap, newUser)
	fmt.Println(userMap)

```

## map排序

按照map的key的顺序排序输出

* 1.先将map的key放入切片
* 2.对切片排序
* 3.遍历切片 按照key输出map的值

	
```go
	//按照map的key的顺序排序输出
	//1.先将map的key放入切片
	//2.对切片排序
	//3.遍历切片 按照key输出map的值
	var keys []int
	for i,_:=range sortMap{
		keys = append(keys, i)
	}
	//排序sort.Ints()
	sort.Ints(keys)
	fmt.Println(keys)
	//遍历切片 输出value
	for _,key:=range keys{
		fmt.Printf("key %d value %d \t",key,sortMap[key])
	}
```

## map使用细节

* 1.map 是引用类型，遵循引用类型值传递机制，在一个函数接收map，修改后会直接修改原来的map
* 2.map的容量达到后，再想增加元素，会自动扩容，并不会发生panic，也就是说 **map 能动态的增加键值对**
* 3.map 的 value 也经常使用 struct 类型，更适合管理复杂的数据

## make、new操作

make用于内建类型（map、slice 和channel）的内存分配。

new用于各种类型的内存分配 

内建函数new本质上说跟其它语言中的同名函数功能一样：**new(T)分配了零值填充的T类型的内存空间，并且返回其地址，即一个*T类型的值**。用Go的术语说，它返回了一个指针，指向新分配的类型T的零值。

**有一点非常重要： new返回指针**

内建函数make(T, args)与new(T)有着不同的功能，**make只能创建slice、map和channel，并且返回一个有初 始值(非零)的T类型，而不是*T**。本质来讲，导致这三个类型有所不同的原因是指向数据结构的引用在使用前必须被初始化。例如，一个slice，是一个包含指向数据（内部array）的指针、长度和容量的三项描述符；在这些项目被初始化之前，slice为nil。对于slice、map和channel来说，make初始化了内部的数据结构，填充适当的值。

make返回初始化后的（非零）值。