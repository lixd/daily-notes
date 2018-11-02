# 一.NumberPicker

## 1.1布局

```xml
<?xml version="1.0" encoding="utf-8"?>
<android.support.constraint.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:id="@+id/low_price_text"
        android:layout_width="wrap_content"
        android:layout_height="15dp"
        android:layout_marginBottom="8dp"
        android:text="请选择低价："
        app:layout_constraintBottom_toTopOf="@+id/low_number_picker"
        app:layout_constraintEnd_toEndOf="@+id/low_number_picker"
        app:layout_constraintStart_toStartOf="@+id/low_number_picker" />

    <NumberPicker
        android:id="@+id/low_number_picker"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginBottom="8dp"
        android:layout_marginStart="8dp"
        android:layout_marginTop="8dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        tools:ignore="MissingConstraints" />

    <TextView
        android:id="@+id/high_price_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_below="@id/low_number_picker"
        android:layout_marginBottom="8dp"
        android:layout_marginEnd="8dp"
        android:text="请选择高价："
        app:layout_constraintBottom_toTopOf="@+id/high_number_picker"
        app:layout_constraintEnd_toEndOf="@+id/high_number_picker"
        app:layout_constraintStart_toStartOf="@+id/high_number_picker" />

    <NumberPicker
        android:id="@+id/high_number_picker"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginBottom="8dp"
        android:layout_marginEnd="8dp"
        android:layout_marginStart="8dp"
        android:layout_marginTop="8dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toEndOf="@+id/low_number_picker"
        app:layout_constraintTop_toTopOf="parent"
        tools:ignore="MissingConstraints" />

</android.support.constraint.ConstraintLayout>
```

## 1.2Activity代码

1.设置最大最小默认值 必须设置最大最小值 ，不然只会显示一个值，无法滑动选择

setMaxValue

setMinValue

setValue

2.设置监听

setOnValueChangedListener

```java
package com.example.administrator.numberpicker;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.NumberPicker;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {

    private NumberPicker mLowNumPicker;
    private NumberPicker mHighNumPicker;
    private int minPrice=25,maxPrice=50;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mLowNumPicker = findViewById(R.id.low_number_picker);
        mHighNumPicker = findViewById(R.id.high_number_picker);
//       设置lowNumPicker的最大最小和默认值
        mLowNumPicker.setMaxValue(50);
        mLowNumPicker.setMinValue(10);
        mLowNumPicker.setValue(25);
//        设置监听
        mLowNumPicker.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker numberPicker, int i, int i1) {
//                将LowNumPicker修改后的当前值作为最小值
                minPrice=i1;
                Toast.makeText(MainActivity.this,"当前最低价为："+minPrice+",当前最高价为："+maxPrice,Toast.LENGTH_SHORT).show();
            }
        });
//        设置HighNumPicker的最大最小和默认值
        mHighNumPicker.setValue(50);
        mHighNumPicker.setMinValue(50);
        mHighNumPicker.setMaxValue(75);
//        设置监听
        mHighNumPicker.setOnValueChangedListener(new NumberPicker.OnValueChangeListener() {
            @Override
            public void onValueChange(NumberPicker numberPicker, int i, int i1) {
                //                将HighNumPicker修改后的当前值作为最大值
                maxPrice=i1;
                Toast.makeText(MainActivity.this,"当前最低价为："+minPrice+",当前最高价为："+maxPrice,Toast.LENGTH_SHORT).show();
            }
        });


    }
}
```

![](D:\lillusory\Android\Daily notes\Image\2018-08-16-NumberPicker_1.png)

## 1.3修改显示内容

```java
private String[] mCities  = {"北京","上海","广州","深圳","杭州","青岛","西安"};
//        设置显示的数组
        mCityNumPicker.setDisplayedValues(mCities);
```

![](D:\lillusory\Android\Daily notes\Image\2018-08-16-NumberPicker_2.png)

## 1.4格式化显示

```java
 //这个方法是根据index 格式化文字,需要先 implements NumberPicker.Formatter
@Override
    public String format(int i) {
//        格式化 做一些特定修改 如小于10的数 前面补0
     /*   String Str = String.valueOf(value);
        if (value < 10) {
            Str = "0" + Str;
        }
        return Str;*/
        return mCities[i];
    }
```

## 1.5修改分割线颜色

```java
/**
 * 通过反射改变分割线颜色,
 */
private void setPickerDividerColor() {
    Field[] pickerFields = NumberPicker.class.getDeclaredFields();
    for (Field pf : pickerFields) {
        //遍历找到我们需要获取值的那个属性
        if (pf.getName().equals("mSelectionDivider")) {
            pf.setAccessible(true);
            try{
                pf.set(mCityNumPicker,new ColorDrawable(Color.BLUE));
            }catch (IllegalAccessException e) {
                e.printStackTrace();
            }catch (Resources.NotFoundException e) {
                e.printStackTrace();
            }catch (IllegalArgumentException e) {
                e.printStackTrace();
            }
        }
    }
}
```

## 1.6修改字体颜色

```java
/**
 * 过反射改变文字的颜色
 * @param numberPicker
 * @param color
 * @return
 */
public static boolean setNumberPickerTextColor(NumberPicker numberPicker, int color) {
    final int count = numberPicker.getChildCount();
    for(int i = 0; i < count; i++){
        View child = numberPicker.getChildAt(i);
        if(child instanceof EditText){
            try{
                //遍历找到我们需要获取值的那个属性
                Field selectorWheelPaintField = numberPicker.getClass()
                        .getDeclaredField("mSelectorWheelPaint");
                selectorWheelPaintField.setAccessible(true);
                ((Paint)selectorWheelPaintField.get(numberPicker)).setColor(color);
                ((EditText)child).setTextColor(color);
                numberPicker.invalidate();
                return true;
            }
            catch(NoSuchFieldException e){
                Log.w("setTextColor", e);
            }
            catch(IllegalAccessException e){
                Log.w("setTextColor", e);
            }
            catch(IllegalArgumentException e){
                Log.w("setTextColor", e);
            }
        }
    }
    return false;
}
```

![](D:\lillusory\Android\Daily notes\Image\2018-08-16-NumberPicker_3.png)

# 二.DatePicker

## 2.1属性介绍

### xml属性

| 嵌套类      |                                                              |
| ----------- | ------------------------------------------------------------ |
| `interface` | `DatePicker.OnDateChangedListener`The callback used to indicate the user changed the date.   用于监听用户改变日期的回调。 |

| XML属性                                                      |                                              |
| ------------------------------------------------------------ | -------------------------------------------- |
| [`android:calendarTextColor`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:calendarTextColor) | 日历列表的文本颜色。                         |
| [`android:calendarViewShown`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:calendarViewShown) | 是否显示 "日历" 视图。                       |
| [`android:datePickerMode`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:datePickerMode) | 设定widget的外观。                           |
| [`android:dayOfWeekBackground`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:dayOfWeekBackground) | 头部标题上显示的一周的背景颜色。             |
| [`android:dayOfWeekTextAppearance`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:dayOfWeekTextAppearance) | 头部标题上显示的一周的文本颜色。             |
| [`android:endYear`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:endYear) | 最后一年 (包含), 例如 "2010"。               |
| [`android:firstDayOfWeek`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:firstDayOfWeek) | 设置`Calendar`的一周的第一天。               |
| [`android:headerBackground`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:headerBackground) | 已选择日期的页眉的背景。                     |
| [`android:headerDayOfMonthTextAppearance`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:headerDayOfMonthTextAppearance) | 选定日期页眉中月份日的文本外观。(例如：28）  |
| [`android:headerMonthTextAppearance`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:headerMonthTextAppearance) | 选定日期页眉中月份的文本外观。（例如：五月） |
| [`android:headerYearTextAppearance`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:headerYearTextAppearance) | 选定日期页眉中年份的文本外观。(如：2014）。  |
| [`android:maxDate`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:maxDate) | 此日历视图显示的最大日期（mm/dd/yyyy格式）。 |
| [`android:minDate`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:minDate) | 此日历视图显示的最小日期（mm/dd/yyyy格式）。 |
| [`android:spinnersShown`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:spinnersShown) | 是否显示spinner。                            |
| [`android:startYear`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:startYear) | 第一年 (包含), 例如 "1940"。                 |
| [`android:yearListItemTextAppearance`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:yearListItemTextAppearance) | 显示年的列表中的文本外观。                   |
| [`android:yearListSelectorColor`](http://www.zhdoc.net/android/reference/android/widget/DatePicker.html#attr_android:yearListSelectorColor) | 显示年的列表中已被选择的项的外框的颜色。     |

**CalendarView 属性**

```
android:firstDayOfWeek：设置一个星期的第一天
android:maxDate ：最大的日期显示在这个日历视图mm / dd / yyyy格式
android:minDate：最小的日期显示在这个日历视图mm / dd / yyyy格式
android:weekDayTextAppearance：工作日的文本出现在日历标题缩写
```

###  get set方法

```java
		Calendar c = Calendar.getInstance();
		// 获取月
		int year = c.get(Calendar.YEAR);
		// 获取月
		int month = c.get(Calendar.MONTH);
		// 获取日
		int date = c.get(Calendar.DATE);
		System.out.println(year + "年" + (month + 1) + "月" + date + "日");
		c.set(2011, 11, 11);
		// 获取月
		year = c.get(Calendar.YEAR);
		// 获取月
		month = c.get(Calendar.MONTH);
		// 获取日
		date = c.get(Calendar.DATE);
		System.out.println(year + "年" + (month + 1) + "月" + date + "日");
```

## 2.2布局

```xml
<DatePicker
    android:id="@+id/dp_1"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_marginEnd="8dp"
    android:layout_marginStart="8dp"
    android:layout_marginTop="8dp"
    app:layout_constraintEnd_toEndOf="parent"
    app:layout_constraintStart_toStartOf="parent"
    app:layout_constraintTop_toTopOf="parent">
</DatePicker>
```

## 2.3Activity代码

```java
    private int mYear;
    private int mMonth;
    private int mDate;
   public void initdate() {
        Calendar c = Calendar.getInstance();
        //获取年月日
        mYear = c.get(Calendar.YEAR);
        mMonth = c.get(Calendar.MONTH);
        mDate = c.get(Calendar.DAY_OF_MONTH);
        //将年月日设置到textview
        mDateTv = findViewById(R.id.tv_date);
        mDateTv.setText(mYear + "-" + (mMonth-1) + "-" + mDate);
        //c.set(2011, 1, 1); 直接设置日期 其中月份为0-11 默认需要减1;
    }


```

## 2.4设置监听

```java
mDatePicker = findViewById(R.id.dp_1);
mDateTv2 = findViewById(R.id.tv_date_2);
initdate();//初始化日期数据
mDatePicker.init(mYear, mMonth, mDate, new DatePicker.OnDateChangedListener() {
    @Override
    public void onDateChanged(DatePicker datePicker, int year, int month, int date) {
        mYear=year;
        mMonth=month;
        mDate=date;

        StringBuffer s=new StringBuffer();
        s.append(mYear);
        s.append("-");
        s.append(mMonth-1);
        s.append("-");
        s.append(mDate);
        mDateTv2.setText(s);
        mDateTv.setText(mYear+"-"+(mMonth-1)+"-"+mDate);
        Toast.makeText(MainActivity.this, "您选择的日期是：" + year + "年" + (month + 1) + "月" + date + "日!", Toast.LENGTH_SHORT).show();
    }
});
```

![](D:\lillusory\Android\Daily notes\Image\2018-08-16-DatePicker_1.png)

## 2.5 日期选择对话框

```java
new DatePickerDialog(this, new DatePickerDialog.OnDateSetListener() {
    @Override
    public void onDateSet(DatePicker datePicker, int year, int monthOfYear, int dayOfMonth) {
        setTitle(year + "-" + (monthOfYear+1) + "-" + dayOfMonth);
    }
}, mYear, mMonth,mDate).show();
```

# 三.TimerPicker

## 3.1属性

```
为一个时间选择控件来说，TimePicker需要与时间相关的getter、setter方法之外，还需要有时间被修改够，回调的响应事件。

　　TimePicker常用方法有如下几个：

- is24HourView()：判断是否为24小时制。
- setIs24HourView()：设置是否为24小时制显示。
- getCurrentXxx()：获取当前时间。
- setCurrentXxx()：设置当前时间。
- setOnTimeChangedListener()：设置时间被修改的回调方法。

　　TimePicker控件被修改的回调方法，通过setOnTimeChangedListener()方法设置，其传递一个TimePicker.OnTimeChangedListener接口，需要实现其中的onTimeChanged()方

```

```xml
android:timePickerMode="spinner"
```

![](D:\lillusory\Android\Daily notes\Image\2018-08-16-TimerPicker_1.png)

```
android:timePickerMode="clock"
```

![](D:\lillusory\Android\Daily notes\Image\2018-08-16-TimerPicker_2.png)

## 3.2布局

```xml
<TimePicker
    android:id="@+id/tp_1"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_marginBottom="8dp"
    android:layout_marginEnd="8dp"
    android:layout_marginStart="8dp"
    android:layout_marginTop="8dp"
    app:layout_constraintBottom_toBottomOf="parent"
    app:layout_constraintEnd_toEndOf="parent"
    app:layout_constraintStart_toStartOf="parent"
    app:layout_constraintTop_toBottomOf="@+id/high_number_picker" />
```

## 3.3Activity

```java
//获取到控件
mTimePicker = findViewById(R.id.tp_1);
//初始化
public void initdate() {
    Calendar c = Calendar.getInstance();
    hour = c.get(Calendar.HOUR);
    min = c.get(Calendar.MINUTE);
}
//设置监听
mTimePicker.setOnTimeChangedListener(new TimePicker.OnTimeChangedListener() {
    @Override
    public void onTimeChanged(TimePicker timePicker, int hour, int min) {
        setTitle(hour+" "+min);
    }
});
```

## 3.4时间选择对话框

```java
// 时间对话框
new TimePickerDialog(this, new TimePickerDialog.OnTimeSetListener() {
    @Override
    public void onTimeSet(TimePicker view, int hourOfDay, int minute) {
        setTitle(hourOfDay + ":" + minute);
    }
}, hour, min, true).show();
```

# 四.TextSwitcher

## 4.1介绍

```
TextSwitcher集成了ViewSwitcher,因此它具有与ViewSwitcher相同的特性:可以在切换View组件时使用动画效果。与ImageSwitcher相似的是,使用TextSwitcher也需要设置一个ViewFactory。与ImageSwitcher不同的是,TextSwitcher所需要的ViewFactory的makeView()方法必须返回一个TextView组件。<TextSwitcher与TextView的功能有点类似,它们都可用于显示 
```

## 4.2布局

```xml
<TextSwitcher
    android:id="@+id/ts"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

## 4.3Activity代码

```java
//1.获取控件
mTextSwitcher = findViewById(R.id.ts);
//2.setFactory
    mTextSwitcher.setFactory(new ViewSwitcher.ViewFactory() {
        @Override
        public View makeView() {
            //创建TextView 设置字体颜色距离等等属性
            TextView tv = new TextView(MainActivity.this);
            tv.setTextSize(16);
            tv.setPadding(15,15,15,15);
            return tv;
        }
    });
//3.（可选）设置入场和退场动画
    mTextSwitcher.setInAnimation(this,R.anim.silde_top_in);
    mTextSwitcher.setOutAnimation(this,R.anim.slide_out_buttom);
//4.设置滚动显示内容
    final String[] titles = {"苹果3 199", "苹果4 299", "苹果4s 399", "苹果5 499", "苹果5s 599", "苹果6 699"};
    final Handler handler = new Handler();
    handler.postDelayed(new Runnable() {
        @Override
        public void run() {
            mTextSwitcher.setText(String.format("京东快报:%s", titles[new Random().nextInt(titles.length)]));
            handler.postDelayed(this, 1000);
        }
    }, 1000);
}
```

入场动画

```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
    android:fillAfter="true"
    android:shareInterpolator="false"
    android:zAdjustment="top">

    <translate
        android:duration="1000"
        android:fromYDelta="100%p"
        android:toYDelta="0"/>
</set>
```

退场动画

```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
    android:fillAfter="true"
    android:shareInterpolator="false"    android:zAdjustment="top"
    >
    <translate
        android:duration="1000"
        android:fromYDelta="0"
        android:toYDelta="-100%p" />
</set>
```