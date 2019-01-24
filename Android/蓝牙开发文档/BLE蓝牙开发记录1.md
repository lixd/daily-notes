# BLE蓝牙开发记录1

### 1.添加权限

```xml
    <!--前两个是蓝牙必须权限 后两个是6.0以后需要的-->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

```java
        //Android6.0需要动态申请权限
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            //请求权限
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_COARSE_LOCATION,
                            Manifest.permission.ACCESS_FINE_LOCATION}, 1);
            if (ActivityCompat.shouldShowRequestPermissionRationale(this,
                    Manifest.permission.ACCESS_COARSE_LOCATION)) {
                //判断是否跟用户做一个说明
            }
        }
```

### 2.开启蓝牙

通过BluetoothManager获取 BluetoothAdapter,若蓝牙未开启则去开启蓝牙。

```java
  //系统蓝牙适配器管理类
    private BluetoothAdapter mBluetoothAdapter;

    //初始化 
    private void initBlueTooth() {
        BluetoothManager mBluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        if (mBluetoothManager != null) {
            mBluetoothAdapter = mBluetoothManager.getAdapter();
            if (mBluetoothAdapter != null) {
                //蓝牙没有打开
                if (!mBluetoothAdapter.isEnabled()) {
                    openBle();
                } 
            }
        }
    }

    private static final int BLE_ENABLE = 1;

    private void openBle() {
        Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
        startActivityForResult(enableBtIntent, BLE_ENABLE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1) {
            if (resultCode == RESULT_OK) {
                Toast.makeText(this, "蓝牙已经开启", Toast.LENGTH_SHORT).show();
            } else if (resultCode == RESULT_CANCELED) {
                Toast.makeText(this, "蓝牙未开启", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }
```

### 3.扫描设备

前面获取到mBluetoothAdapter后就可以开始扫描蓝牙了。

` mBluetoothAdapter.startLeScan(LeScanCallback);` 参数为一个蓝牙扫描的回调接口`LeScanCallback`

```java
  ThreadPoolExecutor poolExecutor =
            new ThreadPoolExecutor(
                    5,
                    10,
                    60,
                    TimeUnit.SECONDS,
                    new LinkedBlockingQueue<Runnable>(),
                    new ThreadPoolExecutor.AbortPolicy());

    private boolean isScanning = true;

    private void scanLeDevice() {
        if (isScanning) {
            isScanning = false;
            //子线程中开启扫描
            poolExecutor.execute(new Runnable() {
                @Override
                public void run() {
                    // 定义一个回调接口供扫描结束处理
                    mBluetoothAdapter.startLeScan(leScanCallback);
                    Log.v(TAG, "开启蓝牙扫描");
                }
            });
        } else {
            isScanning = true;
            mBluetoothAdapter.stopLeScan(leScanCallback);
            Log.v(TAG, "关闭蓝牙扫描");
        }
    }
 private List<BluetoothDevice> deviceList = new ArrayList<>();
    /**
     * 蓝牙扫描回调接口
     */
    private BluetoothAdapter.LeScanCallback leScanCallback = new BluetoothAdapter.LeScanCallback() {
        /**
         * 扫描到设备时回调
         * @param device 扫描到的设备BluetoothDevice
         * @param rssi 信号强度 是负数，数值越大代表信号强度越大
         * @param scanRecord 设备广播的相关数据
         */
        @Override
        public void onLeScan(BluetoothDevice device, int rssi, byte[] scanRecord) {
            //扫描到的蓝牙设备名称
            String name = device.getName();
            //扫描到的蓝牙设备地址
            //String address = device.getAddress();
            if (name != null && !deviceList.contains(name)) {
                //将设备放入list集合
                deviceList.add(device);
                 //这里用listView来显示扫描到的蓝牙设备
                myAdapter.notifyDataSetChanged();
            }
        }
    };
```

### 4.连接设备

查找到设备后就可以开始连接了。

```java
/**
     *  BLE蓝牙连接管理类，主要负责与设备进行通信。
     */
    private BluetoothGatt mBluetoothGatt;

    /**
     * 连接蓝牙
     *
     * @param bluetoothDevice 准备连接的蓝牙设备
     */
    public void connectBle(BluetoothDevice bluetoothDevice) {
        mBluetoothDevice = bluetoothDevice;
        if (bluetoothDevice != null) {
            try {
                //连接之前先停止扫描 为了确定停止了，需要等一段时间
                mBluetoothAdapter.stopLeScan(leScanCallback);
                Thread.sleep(500);
                //第二个参数 是否重连
                mBluetoothGatt = bluetoothDevice.connectGatt(MainActivity.this, false, bluetoothGattCallback);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private BluetoothGattCharacteristic characteristic;
    /**
     * 蓝牙连接回调接口
     */
    private BluetoothGattCallback bluetoothGattCallback = new BluetoothGattCallback() {

        /**
         * 连接状态改变后回调
         * @param gatt Generic Attribute Profile 它定义两个BLE设备通过叫做Service和Characteristic的东西进行通信
         * @param status 旧的状态
         * @param newState 改变后的新状态
         */
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            super.onConnectionStateChange(gatt, status, newState);
            //连接成功
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.v(TAG, "onConnectionStateChange 蓝牙连接");
                displayGattServices(mBluetoothGatt.getServices());
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        connBleName.setText(mBluetoothDevice.getName());
                        connBleMac.setText(mBluetoothDevice.getAddress());
                        Toast.makeText(MainActivity.this, "蓝牙设备" + mBluetoothDevice.getName() + "连接成功", Toast.LENGTH_SHORT).show();
                    }
                });
                //这里要执行以下方法，会在onServicesDiscovered这个方法中回调，如果在
                // onServicesDiscovered方法中回调成功，设备才真正连接起来，正常通信
                gatt.discoverServices();
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.v(TAG, "onConnectionStateChange 蓝牙断连");
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        connBleName.setText("未连接");
                        connBleMac.setText("未连接");
                        Toast.makeText(MainActivity.this, "蓝牙设备" + mBluetoothDevice.getName() + "断开连接", Toast.LENGTH_SHORT).show();
                    }
                });
                if (mBluetoothDevice != null) {
                    //关闭当前新的连接
                    gatt.close();
                    characteristic = null;
                }
            }
        }

        /**
         * 发现服务回调方法
         * @param gatt 同上
         * @param status 状态
         */
        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            super.onServicesDiscovered(gatt, status);
            //找到服务了
            if (status == BluetoothGatt.GATT_SUCCESS) {
                //在这里可以对服务进行解析，寻找到你需要的服务
                services = gatt.getServices();
            }
            System.out.println(services.toString());
        }

        /**
         * 写入数据时的回调，可以和你写入的数据做对比
         * @param gatt 同上
         * @param characteristic 特征值
         * @param status 写入状态
         */
        @Override
        public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
            super.onCharacteristicWrite(gatt, characteristic, status);
            Log.i(TAG, "蓝牙指令 发送完成");
            if (status == BluetoothGatt.GATT_SUCCESS) {
                Log.i(TAG, "数据包发送成功！");
                //写入成功
                Toast.makeText(MainActivity.this, "发送成功", Toast.LENGTH_SHORT).show();
            } else {
                //写入失败
                Toast.makeText(MainActivity.this, "写入失败", Toast.LENGTH_SHORT).show();
            }
        }

        /**
         * 设备发出通知时会调用到该接口，蓝牙设备给手机发送数据，在这个方法接收
         * @param gatt 同上
         * @param characteristic 特征值
         */
        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
            super.onCharacteristicChanged(gatt, characteristic);
            //byte[]转为16进制字符串
            Log.v(TAG, "接收：" + Arrays.toString(characteristic.getValue()));
            Toast.makeText(MainActivity.this, "onReceive", Toast.LENGTH_SHORT).show();
        }
    };
```

连接后会获取到一个``mBluetoothGatt`，

BLE蓝牙协议下数据的通信方式采用BluetoothGattService、BluetoothGattCharacteristic和BluetoothGattDescriptor三个主要的类实现通信。
 BluetoothGattService 简称服务，是构成BLE设备协议栈的组成单位，一个蓝牙设备协议栈一般由一个或者多个BluetoothGattService组成。
 BluetoothGattCharacteristic 简称特征，一个服务包含一个或者多个特征，特征作为数据的基本单元。
 一个BluetoothGattCharacteristic特征包含一个数据值和附加的关于特征的描述BluetoothGattDescriptor。
 BluetoothGattDescriptor：用于描述特征的类，其同样包含一个value值。



### 5.读写数据

##### 1.获取负责通信的BluetoothGattCharacteristic

BLE蓝牙开发主要有负责通信的BluetoothGattService完成的。当且称为通信服务。通信服务通过硬件工程师提供的UUID获取。获取方式如下：

```
BluetoothGattService service = mBluetoothGatt.getService(UUID.fromString("蓝牙模块提供的负责通信UUID字符串"));
```

通信服务中包含负责读写的BluetoothGattCharacteristic，且分别称为notifyCharacteristic和writeCharacteristic。其中notifyCharacteristic负责开启监听，也就是启动收数据的通道，writeCharacteristic负责写入数据。
 具体操作方式如下：

```
  BluetoothGattService service = mBluetoothGatt.getService(UUID.fromString("蓝牙模块提供的负责通信服务UUID字符串"));
   // 例如形式如：49535343-fe7d-4ae5-8fa9-9fafd205e455
  notifyCharacteristic = service.getCharacteristic(UUID.fromString("notify uuid"));
  writeCharacteristic =  service.getCharacteristic(UUID.fromString("write uuid"));
```

##### 2.开启监听

开启监听，即建立与设备的通信的首发数据通道，BLE开发中只有当上位机成功开启监听后才能与下位机收发数据。开启监听的方式如下：

```
mBluetoothGatt.setCharacteristicNotification(notifyCharacteristic, true)
BluetoothGattDescriptor descriptor = characteristic
                            .getDescriptor(UUID
                                    .fromString
("00002902-0000-1000-8000-00805f9b34fb"));
descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
```

若开启监听成功则会回调BluetoothGattCallback中的`onDescriptorWrite()`方法，处理方式如下:

```
@Override
public void onDescriptorWrite(BluetoothGatt gatt,
                BluetoothGattDescriptor descriptor, int status) {
        if (status == BluetoothGatt.GATT_SUCCESS) {
                
            //开启监听成功，可以像设备写入命令了
            Log.e(TAG, "开启监听成功");
        }
            
};
```

##### 3.写入数据

监听成功后通过向 writeCharacteristic写入数据实现与下位机的通信。写入方式如下：

```java
//value为上位机向下位机发送的指令
writeCharacteristic.setValue(value);
mBluetoothGatt.writeCharacteristic(writeCharacteristic)
```

其中：value一般为Hex格式指令，其内容由设备通信的蓝牙通信协议规定。

##### 4.接收数据

若写入指令成功则回调BluetoothGattCallback中的`onCharacteristicWrite()`方法，说明将数据已经发送给下位机。

```java
@Override
public void onCharacteristicWrite(BluetoothGatt gatt,
            BluetoothGattCharacteristic characteristic, int status) {
            
            if (status == BluetoothGatt.GATT_SUCCESS) {
                Log.e(TAG, "发送成功");
            }   
            super.onCharacteristicWrite(gatt, characteristic, status);
}
```

若发送的数据符合通信协议，则下位机会向上位机回复相应的数据。发送的数据通过回调`onCharacteristicChanged()`方法获取，其处理方式如下：

```java
@Override
public void onCharacteristicChanged(BluetoothGatt gatt,
                BluetoothGattCharacteristic characteristic) {

            // value为设备发送的数据，根据数据协议进行解析
            byte[] value = characteristic.getValue();

}
```

通过向下位机发送指令获取下位机的回复数据，即可完成与设备的通信过程。

### 6.断开连接

当与设备完成通信之后之后一定要断开与设备的连接。 

```java
    private void releaseResource() {
        Log.e(TAG, "断开蓝牙连接，释放资源");
        if (mBluetoothGatt != null) {
            mBluetoothGatt.disconnect();
            mBluetoothGatt.close();
        }
    }
```



