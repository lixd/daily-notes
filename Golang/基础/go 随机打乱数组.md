# 洗牌算法

把一个数组随机打乱实质就是“洗牌问题”，洗牌问题不仅追求速度，还要求洗的足够开。 

方法1.`ShuffleSlice` 选定随机数r 将下标r和下边i交换,就是和当前最后一位交换 
方法2.rand.Perm(数组长度) 将原数组下标按照随机出来的数据赋值给另一数组

```go
// 生成长度为len的有序数组并测试使用乱序算法打乱顺序
func CreateRandomStrArrays(len int) []int {
	randomStrArrays := rand.Perm(len)
	for i := 0; i < len; i++ {
		randomStrArrays[i] = i
	}
	err := ShuffleSlice(&randomStrArrays)
	if err != nil {
		logrus.Error(err.Error())
	}
	return randomStrArrays
}

// slice乱序算法 len=65536时 tiem=800ms
func ShuffleSlice(ints *[]int) error {
	if len(*ints) <= 0 {
		return errors.New("the length of the parameter strings should not be less than 0")
	}

	for i := len(*ints) - 1; i > 0; i-- {
		rand.Seed(time.Now().UnixNano())
		num := rand.Intn(i + 1)
		(*ints)[i], (*ints)[num] = (*ints)[num], (*ints)[i]
	}
	return nil
}

// 乱序算法2 len=65536时 tiem=3ms
// rand.Perm(len(*ints)) 返回一个[0,n)的伪随机排列数组
// 然后将这个数组一一对应 赋值给需要打乱的数组
func RandomSlice(ints *[]int) error {
	if len(*ints) <= 0 {
		return errors.New("the length of the parameter strings should not be less than 0")
	}
	in := rand.Perm(len(*ints))
	for i := range *ints {
		(*ints)[i] = in[i]
	}
	return nil
}

```

如果需要生成一个乱序数组的话可以直接使用

```go
arrs:=rand.Perm(len)

// Perm()方法 如下
func (r *Rand) Perm(n int) []int {
	m := make([]int, n)
	for i := 0; i < n; i++ {
		j := r.Intn(i + 1)
        //每次赋值的时候同时打乱一次位置
		m[i] = m[j]
		m[j] = i
	}
	return m
}
```

