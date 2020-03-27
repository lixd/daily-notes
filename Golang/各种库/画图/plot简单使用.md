# plot库简单使用

## 1. 概述

 plot 是绘制与可视化数据的存储库，它提供了一个 API，用于在 Go 中建立和绘制 plot。 

>  plot 包提供了用于布局图的简单界面，并提供了用于绘制图的基本元素； 
>
>  plotter 包提供了一组标准的绘图仪，这些绘图仪使用 plot 软件包提供的基本元素绘制直线图，散点图，箱形图，误差线等； 
>
>  plotutil 包包含一些例程，可以很容易地制作一些常见的绘图类型。这个包是很新的，因此它没有像其他包那样经过良好的测试，并且势必会发生变化； 
>
>  vg 包提供了通用矢量图形 API，该 API 位于其他矢量图形后端（例如自定义 EPS 后端，draw2d，SVGo，X-Window和 gopdf）的顶部； 



## 2. 使用

### 1. 安装

```sh
go get gonum.org/v1/plot/
```



### 2. 例子

```go
package main

import (
	"gonum.org/v1/plot"
	"gonum.org/v1/plot/plotter"
	"gonum.org/v1/plot/plotutil"
	"gonum.org/v1/plot/vg"
)

func main() {
	// linePoints()
	histogram()
}

func linePoints() {
	// new一个实例
	p, _ := plot.New()
	// 填充标题和XY轴图例
	p.Title.Text = "Hello Price"
	p.X.Label.Text = "Quantity Demand"
	p.Y.Label.Text = "Price"
	// 随便加一些mock数据
	points := plotter.XYs{
		{2.0, 60000.0},
		{4.0, 40000.0},
		{6.0, 30000.0},
		{8.0, 25000.0},
		{10.0, 23000.0},
	}
	// 添加到plot
	// 要画多个线分别添加即可
	_ = plotutil.AddLinePoints(p, points)
	// 然后设定图片大小和保存的位置 支持通过后缀调整文件格式
	_ = p.Save(4*vg.Inch, 4*vg.Inch, "price.png")
}
func histogram() {
	// new一个实例
	p, _ := plot.New()
	// 填充标题和XY轴图例
	p.Title.Text = "Hello Price"
	p.X.Label.Text = "Quantity Demand"
	p.Y.Label.Text = "Price"
	// 随便加一些mock数据
	points := plotter.XYs{
		{2.0, 60000.0},
		{4.0, 40000.0},
		{6.0, 30000.0},
		{8.0, 25000.0},
		{10.0, 23000.0},
	}
	// 竖状图
	h, err := plotter.NewHistogram(points, points.Len())
	if err != nil {
		panic(err)
	}
	p.Add(h)
	// 然后设定图片大小和保存的位置 支持通过后缀调整文件格式
	_ = p.Save(4*vg.Inch, 4*vg.Inch, "price.png")
}

```

