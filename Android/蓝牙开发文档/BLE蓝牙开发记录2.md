# BLE蓝牙开发记录2

## 1. 工作原理

### 1.1 蓝牙基础概念

蓝牙技术分为两种：`Basic Rate(简称BR)`和`Low Energy(简称LE) `,但它们是不能互通的。 

蓝牙协议规定了两个层次的协议，分别为`蓝牙核心协议(Bluetooth Core)`和`蓝牙应用层协议(Bluetooth Application)`。 

`蓝牙核心协议`关注对`蓝牙核心技术的描述和规范`，它只提供基础的机制，并不关心如何使用这些机制。`蓝牙应用层协议`，是在蓝牙核心协议的基础上，`根据具体的应用需求定义出各种各样的策略`。 

`Bluetooth Core`由两部分组成: `Host`和`Controller`。 

`Controller`负责定义RF,Baseband等`偏硬件的规范`，并在这之上`抽象`出用于通信的`逻辑链路(Logical Link)`; 

`Host`负责在逻辑链路的基础上，进行`封装`，以`屏蔽`掉蓝牙技术的`细节`，让`Bluetooth Application` 更为方便的使用。 

在一个蓝牙系统中，Host只有一个，但Controller可以一个，也可以有多个。 

### 1.2 协议架构

蓝牙协议分为四个层次：

*  1.**物理层(Physical Layer)** :负责提供数据传输的物理通道(通常称为信道)。通常情况下，一个通信系统中存在几种不同类型的信道
* 2.**逻辑层(Logical Layer)**：在物理层的基础上，提供两个或多个设备之间，和物理无关的逻辑传输通道
* 3.**L2CAP Layer**：L2CAP是逻辑链路控制和适配协议的缩写，负责管理逻辑层提供的逻辑链路。基于该协议，不同Application可共享同一个逻辑链路
* 4.**应用层(APP Layer)**：基于L2CAP提供的channel,实现各种各样的应用功能。Profile是蓝牙协议的特有概念，为了实现不同平台下的不同设备的互联互通，蓝牙协议不止规定了核心规范，也为各种不同的应用场景，定义了各种Application规范，这些应用层规范称作蓝牙profile.

### 1.3 主从关系

蓝牙通信之间的关系——**主从关系**。 必须一个为主角色，另一为从角色，才能进行通信。

通信时，必须由**主端**进行查找，发起配对(**BLE4.0之后已经不需要配对了**)，建链成功后，双方即可收发数据。理论上，一个蓝牙主端设备，可同时与**7个**蓝牙从端设备进行通讯。 

Android设备与BLE设备交互有两组角色：就是中心设备与周边设备了 

![主从](https://github.com/illusorycloud/dailynote/raw/master/Android/%E8%93%9D%E7%89%99%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/BLE%E5%8E%9F%E7%90%861.png)

外围设备：手环、手表这样的

中心设备：手机这种



### 1.4 大概流程

- 1.打开蓝牙
- 2.扫描设备
- 3.建立连接(获取GATT)
- 4.开始通信

![流程](https://github.com/illusorycloud/dailynote/raw/master/Android/%E8%93%9D%E7%89%99%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/ble%E5%BC%80%E5%8F%91%E6%B5%81%E7%A8%8B%E5%9B%BE1.png)

### 1.5 GATT

#### 1. 简介

GATT的全名是*Generic Attribute Profile*（暂且翻译成：普通属性协议）。**GATT 是一个在蓝牙连接之上的发送和接收很短的数据段的通用规范**，这些很短的数据段被称为属性（Attribute）。

它定义两个 BLE 设备通过叫做 **Service** 和 **Characteristic** 的东西进行通信。GATT 就是使用了 ATT（Attribute Protocol）协议，ATT 协议把 Service, Characteristic和相关数据保存在一个查找表中，此查找表使用 16 bit ID 作为每一项的索引。

GATT 连接需要特别注意的是：**GATT连接是独占的**。也就是一个 BLE 外设同时只能被一个中心设备连接。一旦外设被连接，它就会马上停止广播，这样它就对其他设备不可见了。当设备断开，它又开始广播。中心设备和外设需要双向通信的话，唯一的方式就是建立GATT连接。 

![gatt](https://github.com/illusorycloud/dailynote/raw/master/Android/%E8%93%9D%E7%89%99%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/BLE-gatt.png)

 `BluetoothGattService `简称服务，是构成BLE设备协议栈的组成单位，一个蓝牙设备协议栈一般由一个或者多个BluetoothGattService组成。
 `BluetoothGattCharacteristic `简称特征，一个服务包含一个或者多个特征，特征作为数据的基本单元。
 一个BluetoothGattCharacteristic特征包含一个数据值和附加的关于特征的描述BluetoothGattDescriptor。
 `BluetoothGattDescriptor`：用于描述特征的类，其同样包含一个value值。

#### 2. 属性

Attribute是属性的意思,在各蓝牙单芯片平台中，属性是指一条带有标签的、可以被寻址的数据。在蓝牙实际的规范中，寻址即用handle句柄来表示。**每个属性都对应一个唯一的handle**。 

**属性由`属性句柄`、`属性类型`、`属性值`组成**。 

```java
 --------- ----------- -----------
 |   2字节  |  2~6字节  | 0~512字节|
 ---------- ---------- -----------
 | 属性句柄 |  属性类型  |  属性值  |
 ---------- ---------- -----------
```

`属性句柄`在实际的运用中可以认为是属性在属性数组中的下标，可以认为是一个无形的东西 。

` 属性类型`是真实存在的 由蓝牙标准组织所规范，其一般通过128位的UUID来表征一个具体的属性。 由于BLE的`GATT`可以认为是蓝牙标准规范的`精简版`，所以BLE被允许只传输`前面2字节`（16位）的UUID，所有的BLE的UUID的基数都是一样的，只有前面两字节不同。 利用2字节（16位）也可以定义65536种属性了。 

```java
 private static final String COMMON_NOTIFY_UUID = "00002902-0000-1000-8000-00805f9b34fb";
```

`属性值`的长度可以最长到512字节，`但对于某些属性，其长度是固定的`。对于蓝牙标准里面规定的UUID所对应的属性（包括服务、特性定义、特性值、特性描述等等），`服务、特性定义`的长度是`确定`的，而`特性值`则是`不固定长度`的。所以，对于不同的属性，其属性值是不一样的。也即对于以上五类（通用服务、单位、属性类型、特性描述和区分特性类型）等属性，其属性值的规范是不一样，具体到不同的特性类型，其属性值也是不同的。 

#### 3. **特性** 

把特性理解为一个程序中的一个变量是最好理解的。变量有变量类型和值，变量类型有int整型、字节型等等（其实就是变量的存储长度），值即具体的数值。相应地，而特性则有值和存储值的长度的概念。如同变量的声明和定义，特性characteristic也有声明和定义（赋值）的概念。 

一般地，在蓝牙标准里面，特性一般包括三个要素：声明、数值和描述。前两者都是必须的。作为通信交互，一个特性必须要告诉对方声明（存储长度和访问控制）、定义（具体赋值）。在某些特性（如notify或者indicate）里面，特性还需要告知对方附加的配置属性（提供订阅等）。

特性声明必须作为服务属性之后的第一条属性，而数值必须紧随其后。

#### 4. 例子

中心设备与外围设备是通过GATT协议进行通信的，具体的就是服务`Service`和特性`Characteristic `。

这里先对具体步骤说明一下，详细代码在第二节。

##### 1. 获取GATT

首先打开蓝牙，然后扫描设备，最后进行连接。连接时会获取到一个`GATT`,这就是通信的关键。

```JAVA'
BluetoothGatt mBluetoothGatt = bluetoothDevice.connectGatt(MainActivity.this, false, bluetoothGattCallback);
//bluetoothDevice就是扫描到的设备
```

##### 2. 获取服务

BLE蓝牙开发主要有负责通信的`BluetoothGattService`完成的。当且称为通信服务。通信服务通过硬件工程师提供的`UUID`获取。获取方式如下：

```java
BluetoothGattService communicationService = mBluetoothGatt.getService(UUID.fromString("蓝牙模块提供的负责通信的服务的UUID字符串"));
```

##### 3. 获取特征

通过上面可以知道，一个服务可以又多个特性。这个负责通信的服务也有一个负责读数据的特性`notifyCharacteristic`和一个写数据的特性`writeCharacteristic`也分别通过UUID获取到这两个特性。

```java
   // 例如形式如：49535343-fe7d-4ae5-8fa9-9fafd205e455
  notifyCharacteristic = communicationService.getCharacteristic(UUID.fromString("notify uuid"));
  writeCharacteristic =  communicationService.getCharacteristic(UUID.fromString("write uuid"));
```

##### 4. 读写数据

上面已经获取到读写特性了，接下来就可以开始通信了。

注意：读和写都是以特性`Characteristic`为基础的，**就是先将要发送的数据存在Characteristic的value中，然后通过前面获取到的GATT将Characteristic发送到设备端**，读取也是一样的先读取Characteristic，然后从Characteristic中获取数据。

```java
//--------------写数据-----------------
//1.准备数据 是一个byte数组 具体和协议有关系 
//一般是0xA9 这种16进制的 通过一系列转换后才变成一个byte数组 具体方法这里就不写了
byte[] data = new byte[]{-70, 0, 0, 6, -1, -49, 0, 12, 12, 0, -63, 0, 1, 1};
//2.将数据存到特性的特征值中
writeCharacter.setValue(data);
//3.然后通过GATT把特性写到设备端，这里返回值就是是否写成功
Boolean isWriteSuccess=mBluetoothGatt.writeCharacteristic(writeCharacter);
//--------------读数据-----------------
//1.首先通过GATT读取特性 isReadSuccess代表是否读取成功
boolean isReadSuccess = mBluetoothGatt.readCharacteristic(notifyCharacteristic);
//2.然后从特性中获取特征值 就是数据
byte[] data = characteristic.getValue();
```



#### 5. 小结

一个BLE设备可以有多个服务`Service`，每个Service又可以有多个特性`Characteristic `,每个特性又包括`特性数值`和`特性描述`。

其中服务、特性、特性描述都可以通过对应的UUID来查找。

## 2. 使用流程

### 2.1 打开蓝牙

使用蓝牙之前需要添加一些相关权限。

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

获取到权限后再去打开蓝牙。

**先要拿到BluetoothManager** 

```java
BluetoothManager mBluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
```

通过`BluetoothManager`的`getAdapter()`方法**再拿到BluetoothAdapter**，

```java
BluetoothAdapter  mBluetoothAdapter = mBluetoothManager.getAdapter();
```

接着需要判断一下支不支持蓝牙

```java
if(mBluetoothAdapter==null){
    //说明不支持蓝牙 不过一般的手机都有蓝牙...
}
```

通过`mBluetoothAdapter`判断是否打开蓝牙了，没有打开则跳转去打开蓝牙。

```java
	if (!mBluetoothAdapter.isEnabled()) {
        //蓝牙没有打开 跳转去开启
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

### 2.3 扫描设备

通过前面拿到的`BluetoothAdapter`的`startSacn( LeScanCallback)`的方法开始扫描设备。

```java
 mBluetoothAdapter.startLeScan(leScanCallback);
```

还需要实现`LeScanCallback`的回调方法。

```java
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
            if (name != null && !deviceList.contains(device)) {
                //将设备放入list集合
                deviceList.add(device);
                //这里用listView来显示扫描到的蓝牙设备
                myAdapter.notifyDataSetChanged();
            }
        }
    };
```

不过现在`startLeScan`这个方法已经过时了,`Api21`以上可以使用新的``BluetoothLeScanner`.

```java
                    BluetoothLeScanner bluetoothLeScanner = mBluetoothAdapter.getBluetoothLeScanner();
                    bluetoothLeScanner.startScan(scanCallback);

    @TargetApi(21)
    ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
             BluetoothDevice device = result.getDevice();
            //扫描到的蓝牙设备名称
            String name = device.getName();
            //扫描到的蓝牙设备地址
            //String address = device.getAddress();
            if (name != null && !deviceList.contains(device)) {
                //将设备放入list集合
                deviceList.add(device);
                //这里用listView来显示扫描到的蓝牙设备
                myAdapter.notifyDataSetChanged();
            }
            super.onScanResult(callbackType, result);
        }

        @Override
        public void onBatchScanResults(List<ScanResult> results) {
            super.onBatchScanResults(results);
        }

        @Override
        public void onScanFailed(int errorCode) {
            super.onScanFailed(errorCode);
        }
    };
```

可以把扫描到的设备用集合存起来。

### 2.3 建立连接

通过前面扫描的回调中获取到的`BluetoothDevice`进行连接。

```java
                BluetoothGatt   mBluetoothGatt = bluetoothDevice.connectGatt(MainActivity.this, false, bluetoothGattCallback);
//第二个参数为是否自动重连
```

的方法进行连接，这个函数将返回`BluetoothGatt`的实例，拿到了`BluetoothGatt`可以进行相关读写数据操作了。 

### 2.4 开始通信

获取用于通信的服务，然后在分别获取到读数据和写数据的特性。

```java
//1.获取通信服务
BluetoothGattService communicationService = mBluetoothGatt.getService(UUID.fromString("蓝牙模块提供的负责通信的服务的UUID字符串"));
//2.获取特性 读和写
   // 例如形式如：49535343-fe7d-4ae5-8fa9-9fafd205e455
  notifyCharacteristic = communicationService.getCharacteristic(UUID.fromString("notify uuid"));
  writeCharacteristic =  communicationService.getCharacteristic(UUID.fromString("write uuid"));
//3.发送接收数据
//--------------写数据-----------------
//1.准备数据 是一个byte数组 具体和协议有关系 
//一般是0xA9 这种16进制的 通过一系列转换后才变成一个byte数组
byte[] data = new byte[]{-70, 0, 0, 6, -1, -49, 0, 12, 12, 0, -63, 0, 1, 1};
//2.将数据存到特性的特征值中
writeCharacter.setValue(data);
//3.然后通过GATT把特性写到设备端，这里返回值就是是否写成功
Boolean isWriteSuccess=mBluetoothGatt.writeCharacteristic(writeCharacter);
//--------------读数据-----------------
//1.首先通过GATT读取特性 isReadSuccess代表是否读取成功
boolean isReadSuccess = mBluetoothGatt.readCharacteristic(notifyCharacteristic);
//2.然后从特性中获取特征值 就是数据
byte[] data = characteristic.getValue();
```

### 2.5 开启通知

前面读取数据时需要手打去读，设备端不能主动发数据过来。

如果设备主动给手机发信息，则可以通`notification`的方式，**这种方式不用手机去轮询地读设备上的数据**。 手机可以用如下方式给设备设置notification功能。如果notificaiton方式对于某个Characteristic是enable的，那么当设备上的这个Characteristic改变时，手机上的`onCharacteristicChanged()`回调就会被触发，就不用手机这边一直轮询检测查看设备端有没有变化了。

**Characteristic通知开启后设备端的Characteristic变化时，`onCharacteristicChanged()`回调就会被触发。如果关心过个Characteristic,则每个Characteristic都要开启**

```java
 	/**
     * 这个UUID是通用的
     */    
private static final String COMMON_NOTIFY_UUID = "00002902-0000-1000-8000-00805f9b34fb";

    /**
     * 启用或禁用通知上的特性。
     */
    public void setCharacteristicNotification(BluetoothGattCharacteristic characteristic, boolean enabled) {
        if (mBluetoothAdapter == null || mBluetoothGatt == null || characteristic == null) {
            Log.e(TAG, "BluetoothAdapter not initialized or characteristic is null");
            return;
        }
        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(UUID.fromString(COMMON_NOTIFY_UUID));
        mBluetoothGatt.setCharacteristicNotification(characteristic, enabled);
        if (descriptor != null) {
            descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
            mBluetoothGatt.writeDescriptor(descriptor);
        }
    
```

`onCharacteristicChanged()`方法如下：是BluetoothGattCallback回调中的方法。

```java
        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
             //开启notify之后，就可以在这里接收数据了。
 			//判断到底是哪个characteristic发生了变化
            if (characteristic==writeCharacter){
                //byte[]转为16进制字符串
                Log.v(TAG, "xxx接收到的消息：" + Arrays.toString(characteristic.getValue()));
            }
            super.onCharacteristicChanged(gatt, characteristic);
        }
```

###  2.6 关闭连接

在操作完成后，或者出现异常时需要关闭连接。否则下次连接或者发送数据可能出现问题。

```java
        if (mBluetoothGatt != null) {
            mBluetoothGatt.disconnect();
            mBluetoothGatt.close();
        }
```



## 3. BLE数据拆包

**BLE限制了一次只能发送20字节数据，超过20字节后需要拆成多个包**，如果发送的数据超过了20个字节就需要拆成多个包发送，然后接收方将收到的多个包合成一个。



```java
//数据拆分后放入队列 然后一个一个发送
private Queue<byte[]> nextByte = new LinkedList<>();    
public boolean writeToDevice(BluetoothGatt gatt, byte[] bytes) {

        int length = bytes.length;
        byte[] data;
        if (length <= mtuSize) { // 每次最多写入20字节
            data = bytes;
        } else {
            int count = length / mtuSize;
            int remainder = length % mtuSize;
            for (int i = 0; i < count; ++i) {
                byte[] subCmd = new byte[mtuSize];
                System.arraycopy(bytes, i * mtuSize, subCmd, 0, mtuSize);
                nextByte.offer(subCmd);
            }
            if (remainder != 0) {
                byte[] remainCmd = new byte[remainder];
                System.arraycopy(bytes, count * mtuSize, remainCmd, 0, remainder);
                nextByte.offer(remainCmd);
            }
            data = nextByte.peek();
        }
        boolean ok = gatt.write(data);
        if (!ok) {
            disconnect();
        }
        return ok;
    }
```

一般发送都很少超过20字节，主要是接收，设备端发送过来的数据一般都会很长。

然后数据一般都会有一个包头之类的，里面一般会有数据长度之类的东西，然后接收多个包合成一个完整的数据。

## 4. OTA升级

![dfu](https://github.com/illusorycloud/dailynote/raw/master/Android/dfu.webp)

流程：

* 1.连接检测更新
* 2.记录相关数据，升级后好恢复
* 3.让设备进入DFU模式
* 4.发送升级包，DFU升级
* 5.重新连接，自检恢复

##  5. 数据格式转化的工具类

#### 1. 两个byte -->int

```java
private  int byteToInt(byte b, byte c) {//计算总包长，两个字节表示的
    short s = 0;
    int ret;
    short s0 = (short) (c & 0xff);// 最低位
    short s1 = (short) (b & 0xff);
    s1 <<= 8;
    s = (short) (s0 | s1);
    ret = s;
    return ret;
}
```

#### 2. int -->两个byte

```java
private byte[] int2byte(int res) {
     if (res == null)
            return null;
    byte[] targets = new byte[2];
    targets[1] = (byte) (res & 0xff);// 最低位
    targets[0] = (byte) ((res >> 8) & 0xff);// 次低位
    return targets;
}
```

#### 3. 16进制字符串 -->byte[ ]

```java
public static byte[] hexStringToByte(String hex) {
     if (hex == null)
            return null;
    int len = (hex.length() / 2);
    byte[] result = new byte[len];
    char[] achar = hex.toCharArray();
    for (int i = 0; i < len; i++) {
        int pos = i * 2;
        result[i] = (byte) (toByte(achar[pos]) << 4 | toByte(achar[pos + 1]));
    }
    return result;
}
private static byte toByte(char c) {
    byte b = (byte) "0123456789ABCDEF".indexOf(c);
    return b;
}
```

#### 4. byte[ ] -->16进制字符串

```java
    public String bytesToHexString(byte[] bArray) {
        if (bArray == null)
            return null;
        StringBuffer sb = new StringBuffer(bArray.length);
        String sTemp;
        for (int i = 0; i < bArray.length; i++) {
            sTemp = Integer.toHexString(0xFF & bArray[i]);
            if (sTemp.length() < 2)
                sb.append(0);
            sb.append(sTemp.toUpperCase());
        }
        return sb.toString();
    }
```

## 参考

`https://blog.csdn.net/QQ576494799/article/details/78193221`

`https://blog.csdn.net/android_jiangjun/article/details/77113883`

 `https://www.jianshu.com/p/71116665fd08`

`刘权---《BLE4.0 低功耗蓝牙协议总结》` 

`https://learn.adafruit.com/introduction-to-bluetooth-low-energy?view=all`

