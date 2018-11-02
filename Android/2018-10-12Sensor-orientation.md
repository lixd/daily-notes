# 方向传感器

##### 1. 获取 SensorManager 实例。

```java
sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
```

##### 2. 通过 getDefaultSensor() 得到加速度传感器和地磁传感器的实例。

```java
Sensor accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
Sensor magneticSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
```

##### 3. 借助 SensorEventListener 对传感器输出的信号进行监听。

```java
//实现SensorEventListener接口 重写这两个方法
   @Override
    public void onSensorChanged(SensorEvent event) {
        //通过event.sensor.getType判断当前的传感器类型。
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            accelerometerValues = event.values.clone();
        } else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            magneticValues = event.values.clone();
        }
        
        float[] R = new float[9];
        float[] values = new float[3];
        SensorManager.getRotationMatrix(R, null, accelerometerValues, magneticValues);
        SensorManager.getOrientation(R, values);
        //弧度转化为角度
        degree = (float) Math.toDegrees(values[0]);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }
```

##### 4. 调用 SensorManager 的 registerListener() 方法来注册SensorEventListener 使其生效。

```java
sensorManager.registerListener(this, accelerometerSensor, SensorManager.SENSOR_DELAY_UI);
        sensorManager.registerListener(this, magneticSensor, SensorManager.SENSOR_DELAY_UI);
```

##### 5. 在 onSensorChanged() 方法中可以获取到 SensorEvent 的 values 数组，分别记录着加速度传感器和地磁传感器输出的值。然后将这两个值传入到 SensorManager 的 getRotationMatrix() 方法中就可以得到一个包含旋转矩阵的 R 数组。

```java
SensorManager.getRotationMatrix(R, null, accelerometerValues, magneticValues);
```

- 第一个参数：R 是一个长度为 9 的 float 数组，getRotationMatrix() 方法计算出的旋转数据就会赋值到这个数组当中。
- 第二个参数：用于将地磁向量转换成重力坐标的旋转矩阵，通常指定为 **null** 即可。
- 第三个参数：**加速度传感器输出的 values 值**。
- 第四个参数：**地磁传感器输出的 values 值**。

 6. 调用 SensorManager 的 getOrientation() 方法来计算手机的旋转数据。

```java
SensorManager.getOrientation(R, values);
```

-  **values** 是一个长度为 3 的 float 数组，手机在各个方向上的旋转数据都会被存放到这个数组当中。
-  **values[0]** 记录着手机围绕** Z 轴**的旋转弧度。
-  **values[1]** 记录着手机围绕** X 轴**的旋转弧度。
-  **values[2]** 记录着手机围绕 **Y 轴**的旋转弧度。

 7. 将弧度转换为角度。

```java
degree = (float) Math.toDegrees(values[0]);
```

##### 8. 最后调用 unregisterListener() 方法将使用的资源释放掉。

```java
sensorManager.unregisterListener(listener);
```

 

 

 

 