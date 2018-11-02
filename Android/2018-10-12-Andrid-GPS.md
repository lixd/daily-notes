## GPS

## 1.定位相关的一些API

------

### **1）LocationManager**

官方API文档：[LocationManager](http://androiddoc.qiniudn.com/reference/android/location/LocationManager.html)

这玩意是系统服务来的，不能直接new，需要：

```
LocationManager lm = (LocationManager)getSystemService(Context.LOCATION_SERVICE);
```

另外用GPS定位别忘了加权限：

```
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

好的，获得了LocationManager对象后，我们可以调用下面这些常用的方法：

- **addGpsStatusListener**(GpsStatus.Listener listener)：添加一个GPS状态监听器

  ```
  四种状态
  GpsStatus.GPS_EVENT_STARTED:         //定位启动
  GpsStatus.GPS_EVENT_STOPPED://定位结束
  GpsStatus.GPS_EVENT_FIRST_FIX://第一次定位
  GpsStatus.GPS_EVENT_SATELLITE_STATUS: //卫星状态改变
  ```

- **addProximityAlert**(double latitude, double longitude, float radius, long expiration, PendingIntent intent)： 添加一个临界警告

- **getAllProviders**()：获取所有的LocationProvider列表

- **getBestProvider**(Criteria criteria, boolean enabledOnly)：根据指定条件返回最优LocationProvider

- **getGpsStatus**(GpsStatus status)：获取GPS状态

- **getLastKnownLocation**(String provider)：根据LocationProvider获得最近一次已知的Location

- **getProvider**(String name)：根据名称来获得LocationProvider

- **getProviders**(boolean enabledOnly)：获取所有可用的LocationProvider

- **getProviders**(Criteria criteria, boolean enabledOnly)：根据指定条件获取满足条件的所有LocationProvider

- **isProviderEnabled**(String provider)：判断指定名称的LocationProvider是否可用

- **removeGpsStatusListener**(GpsStatus.Listener listener)：删除GPS状态监听器

- **removeProximityAlert**(PendingIntent intent)：删除一个临近警告

- **requestLocationUpdates**(long minTime, float minDistance, Criteria criteria, PendingIntent intent)： 通过制定的LocationProvider周期性地获取定位信息，并通过Intent启动相应的组件

- **requestLocationUpdates**(String provider, long minTime, float minDistance, LocationListener listener)： 通过制定的LocationProvider周期性地获取定位信息，并触发listener所对应的触发器

### **2）LocationProvider(定位提供者)**

官方API文档：[LocationProvider](http://androiddoc.qiniudn.com/reference/android/location/LocationProvider.html)

这比是GPS定位组件的抽象表示，调用下述方法可以获取该定位组件的相关信息！

常用的方法如下：

- **getAccuracy**()：返回LocationProvider精度
- **getName**()：返回LocationProvider名称
- **getPowerRequirement**()：获取LocationProvider的电源需求
- **hasMonetaryCost**()：返回该LocationProvider是收费还是免费的
- **meetsCriteria**(Criteria criteria)：判断LocationProvider是否满足Criteria条件
- **requiresCell**()：判断LocationProvider是否需要访问网络基站
- **requiresNetwork**()：判断LocationProvider是否需要访问网络数据
- **requiresSatellite**()：判断LocationProvider是否需要访问基于卫星的定位系统
- **supportsAltitude**()：判断LocationProvider是否支持高度信息
- **supportsBearing**()：判断LocationProvider是否支持方向信息
- **supportsSpeed**()：判断是LocationProvider否支持速度信息

------

### **3）Location(位置信息)**

官方API文档：[Location](http://androiddoc.qiniudn.com/reference/android/location/Location.html)

位置信息的抽象类，我们可以调用下述方法获取相关的定位信息！

常用方法如下：

- float **getAccuracy**()：获得定位信息的精度
- double **getAltitude**()：获得定位信息的高度
- float **getBearing**()：获得定位信息的方向
- double **getLatitude**()：获得定位信息的纬度
- double **getLongitude**()：获得定位信息的精度
- String **getProvider**()：获得提供该定位信息的LocationProvider
- float **getSpeed**()：获得定位信息的速度
- boolean **hasAccuracy**()：判断该定位信息是否含有精度信息

------

### **4）Criteria(过滤条件)**

官方API文档：[Criteria](http://androiddoc.qiniudn.com/reference/android/location/Criteria.html)

获取LocationProvider时，可以设置过滤条件，就是通过这个类来设置相关条件的~

常用方法如下：

- **setAccuracy**(int accuracy)：设置对的精度要求
- **setAltitudeRequired**(boolean altitudeRequired)：设置是否要求LocationProvider能提供高度的信息
- **setBearingRequired**(boolean bearingRequired)：设置是否要LocationProvider求能提供方向信息
- **setCostAllowed**(boolean costAllowed)：设置是否要求LocationProvider能提供方向信息
- **setPowerRequirement**(int level)：设置要求LocationProvider的耗电量
- **setSpeedRequired**(boolean speedRequired)：设置是否要求LocationProvider能提供速度信息

## 5.临近警告(地理围栏)

嗯，就是固定一个点，当手机与该点的距离少于指定范围时，可以触发对应的处理！ 有点像地理围栏...我们可以调用LocationManager的addProximityAlert方法添加临近警告！ 完整方法如下：

**addProximityAlert**(double latitude,double longitude,float radius,long expiration,PendingIntent intent)

属性说明：

- **latitude**：指定固定点的经度
- **longitude**：指定固定点的纬度
- **radius**：指定半径长度
- **expiration**：指定经过多少毫秒后该临近警告就会过期失效，-1表示永不过期
- **intent**：该参数指定临近该固定点时触发该intent对应的组件