##Android 蓝牙音箱开发##

项目下载地址[github](https://github.com/LiuJunb/BlueToothEatPhone)：

###1.打开蓝牙：###

	  mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

      /**如果本地蓝牙没有开启，则开启*/
      if (!mBluetoothAdapter.isEnabled()) {
        // 我们通过startActivityForResult()方法发起的Intent将会在onActivityResult()回调方法中获取用户的选择，比如用户单击了Yes开启，
        // 那么将会收到RESULT_OK的结果，
        // 如果RESULT_CANCELED则代表用户不愿意开启蓝牙
        Intent mIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
        startActivityForResult(mIntent, ENABLE_BLUE);
       } else {
           Toast.makeText(this, "蓝牙已开启", Toast.LENGTH_SHORT).show();
       }

**监听打开的结果：**

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == ENABLE_BLUE) {
            if (resultCode == RESULT_OK) {
                Toast.makeText(this, "蓝牙开启成功", Toast.LENGTH_SHORT).show();
                getBondedDevices();
            } else if (resultCode == RESULT_CANCELED) {
                Toast.makeText(this, "蓝牙开始失败", Toast.LENGTH_SHORT).show();
            }
        } else {

        }
    }

###2.关闭蓝牙:###

	 /**关闭蓝牙*/
     if (mBluetoothAdapter.isEnabled()) {
           mBluetoothAdapter.disable();
     }

###3.设计蓝牙为可见:###

	 Intent intent = new Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE);
     intent.putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, 180);//180可见时间
     startActivity(intent);

###4.收索蓝牙:###

**注册广播监听搜索的结果：**

	 /**注册搜索蓝牙receiver*/
     mFilter = new IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
     mFilter.addAction(BluetoothDevice.ACTION_FOUND);
     mFilter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
     registerReceiver(mReceiver, mFilter);
**开始的搜索：**

	 // 如果正在搜索，就先取消搜索
     if (mBluetoothAdapter.isDiscovering()) {
         mBluetoothAdapter.cancelDiscovery();
     }
     // 开始搜索蓝牙设备,搜索到的蓝牙设备通过广播返回
     mBluetoothAdapter.startDiscovery();

**监听搜索的结果：**

    private BroadcastReceiver mReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            /** 搜索到的蓝牙设备*/
            if (action.equals(BluetoothDevice.ACTION_FOUND)) {
                BluetoothDevice device = intent
                        .getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                // 搜索到的不是已经配对的蓝牙设备
                if (device.getBondState() != BluetoothDevice.BOND_BONDED) {
                    BlueDevice blueDevice = new BlueDevice();
                    blueDevice.setName(device.getName());
                    blueDevice.setAddress(device.getAddress());
                    blueDevice.setDevice(device);
                    setDevices.add(blueDevice);
                    blueAdapter.setSetDevices(setDevices);
                    blueAdapter.notifyDataSetChanged();
                    Log.d(MAINACTIVITY, "搜索结果......"+device.getName());
                }

                /**当绑定的状态改变时*/
            } else if (action.equals(BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {



				
                /**搜索完成*/
            } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)) {
                setProgressBarIndeterminateVisibility(false);
                Log.d(MAINACTIVITY, "搜索完成......");
                hideProgressDailog();
            }
        }
    };
###5.配对蓝牙:###

**配对工具类**

	public class BlueUtils {
	
	    public BlueUtils(BlueDevice blueDevice) {
	        this.blueDevice = blueDevice;
	    }

	    /**
	     * 配对
	     */
	    public void doPair() {
	            if(null == mOthHandler){
	                HandlerThread handlerThread = new HandlerThread("other_thread");
	                handlerThread.start();
	                mOthHandler = new Handler(handlerThread.getLooper());
	            }
	            mOthHandler.post(new Runnable() {
	                @Override
	                public void run() {
	                    initSocket();   //取得socket
	                    try {
	                        socket.connect();   //请求配对
		//						mAdapterManager.updateDeviceAdapter();
	                    } catch (IOException e) {
	                        e.printStackTrace();
	                    }
	                }
	            });
	    }


	    /**
	     * 取消蓝牙配对
	     * @param device
	     */
	    public static void unpairDevice(BluetoothDevice device) {
	        try {
	            Method m = device.getClass()
	                    .getMethod("removeBond", (Class[]) null);
	            m.invoke(device, (Object[]) null);
	        } catch (Exception e) {
	            Log.d("BlueUtils", e.getMessage());
	        }
	    }


	    /**
	     * 取得BluetoothSocket
	     */
	   private void initSocket() {
	        BluetoothSocket temp = null;
	        try {
	            Method m = blueDevice.getDevice().getClass().getMethod("createRfcommSocket", new Class[] {int.class});
	            temp = (BluetoothSocket) m.invoke(blueDevice.getDevice(), 1);
	            //怪异错误： 直接赋值给socket,对socket操作可能出现异常，  要通过中间变量temp赋值给socket
	        } catch (SecurityException e) {
	            e.printStackTrace();
	        } catch (NoSuchMethodException e) {
	            e.printStackTrace();
	        } catch (IllegalArgumentException e) {
	            e.printStackTrace();
	        } catch (IllegalAccessException e) {
	            e.printStackTrace();
	        } catch (InvocationTargetException e) {
	            e.printStackTrace();
	        }
	        socket = temp;
	    }

	}

**注册监听配对结果的广播（使用同上面的注册代码）**

	 /**注册搜索蓝牙receiver*/
     mFilter = new IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
     mFilter.addAction(BluetoothDevice.ACTION_FOUND);
     mFilter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
     registerReceiver(mReceiver, mFilter);

**开始配对**

    /**
     * 开始配对蓝牙设备
     *
     * @param blueDevice
     */
    private void startPariBlue(BlueDevice blueDevice) {
        BlueUtils blueUtils = new BlueUtils(blueDevice);
        blueUtils.doPair();
    }


**监听配对结果：（使用同上面的广播接收者）**

    private BroadcastReceiver mReceiver = new BroadcastReceiver() {

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            /** 搜索到的蓝牙设备*/
            if (action.equals(BluetoothDevice.ACTION_FOUND)) {

				.....
                /**当绑定的状态改变时*/
            } else if (action.equals(BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                switch (device.getBondState()) {
                    case BluetoothDevice.BOND_BONDING:
                        Log.d(MAINACTIVITY, "正在配对......");

                        break;
                    case BluetoothDevice.BOND_BONDED:
                        Log.d(MAINACTIVITY, "完成配对");
                        hideProgressDailog();
                        /**开始连接*/
                        contectBuleDevices();
                        break;
                    case BluetoothDevice.BOND_NONE:
                        Log.d(MAINACTIVITY, "取消配对");
                        Toast.makeText(MainActivity.this,"成功取消配对",Toast.LENGTH_SHORT).show();
                        getBondedDevices();
                        break;
                    default:
                        break;
                }

                /**搜索完成*/
            } else if (action.equals(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)) {
				....
            }
        }
    };
###6.使用A2DP协议连接蓝牙设备:###

**连接设备**

	/**
     * 开始连接蓝牙设备
     */
    private void contectBuleDevices() {
        /**使用A2DP协议连接设备*/
        mBluetoothAdapter.getProfileProxy(this, mProfileServiceListener, BluetoothProfile.A2DP);
    }

**监听连接的回调**

    /**
     * 连接蓝牙设备（通过监听蓝牙协议的服务，在连接服务的时候使用BluetoothA2dp协议）
     */
    private BluetoothProfile.ServiceListener mProfileServiceListener = new BluetoothProfile.ServiceListener() {

        @Override
        public void onServiceDisconnected(int profile) {

        }

        @Override
        public void onServiceConnected(int profile, BluetoothProfile proxy) {
            try {
                if (profile == BluetoothProfile.HEADSET) {
					....

                } else if (profile == BluetoothProfile.A2DP) {
                    /**使用A2DP的协议连接蓝牙设备（使用了反射技术调用连接的方法）*/
                    a2dp = (BluetoothA2dp) proxy;
                    if (a2dp.getConnectionState(currentBluetoothDevice) != BluetoothProfile.STATE_CONNECTED) {
                        a2dp.getClass()
                                .getMethod("connect", BluetoothDevice.class)
                                .invoke(a2dp, currentBluetoothDevice);
                        Toast.makeText(MainActivity.this,"请播放音乐",Toast.LENGTH_SHORT).show();
                        getBondedDevices();
                    }
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };


###7.添加权限###

	<uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />


###8.打开乐库播放音乐###

	
###9.Android 6.0的系统需要动态添加权限才能搜索出蓝牙设备###

**Android 6.0的系统需要动态添加权限**

	/**判断手机系统的版本*/
    if (Build.VERSION.SDK_INT >= 6.0) {//Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            if(checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)!=PackageManager.PERMISSION_GRANTED){
                /**动态添加权限：ACCESS_FINE_LOCATION*/
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                        MY_PERMISSION_REQUEST_CONSTANT);
            }
     }

**请求权限的回调**

    /**请求权限的回调：这里判断权限是否添加成功*/
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case MY_PERMISSION_REQUEST_CONSTANT: {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Log.i("main","添加权限成功");
                }
                return;
            }
        }
    }