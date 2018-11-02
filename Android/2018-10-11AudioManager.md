# 1. AudioManager

## 1.获得AudioManager对象实例

```java
AudioManager audiomanage = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
```

------

## 2.相关方法详解

**常用方法**：

```
- adjustVolume(int direction, int flags)： 控制手机音量,调大或者调小一个单位,根据第一个参数进行判断 
AudioManager.ADJUST_LOWER,可调小一个单位; AudioManager.ADJUST_RAISE,可调大一个单位

- adjustStreamVolume(int streamType, int direction, int flags)： 同上,不过可以选择调节的声音类型 1）streamType参数,指定声音类型,有下述几种声音类型: STREAM_ALARM：手机闹铃 STREAM_MUSIC：手机音乐 
  STREAM_RING：电话铃声 STREAM_SYSTEAM：手机系统 
  STREAM_DTMF：音调 STREAM_NOTIFICATION：系统提示
  STREAM_VOICE_CALL:语音电话 2）第二个参数和上面那个一样,调大或调小音量的 3）可选的标志位,比如AudioManager.FLAG_SHOW_UI,显示进度条,AudioManager.PLAY_SOUND:播放声音
  
- setStreamVolume(int streamType, int index, intflags)：直接设置音量大小

- getMode( )：返回当前的音频模式

- setMode( )：设置声音模式 有下述几种模式: MODE_NORMAL(普通), MODE_RINGTONE(铃声), MODE_IN_CALL(打电话)，MODE_IN_COMMUNICATION(通话)

- getRingerMode( )：返回当前的铃声模式

- setRingerMode(int streamType):设置铃声模式 有下述几种模式: 如RINGER_MODE_NORMAL（普通）、RINGER_MODE_SILENT（静音）、RINGER_MODE_VIBRATE（震动）

- getStreamVolume(int streamType)： 获得手机的当前音量,最大值为7,最小值为0,当设置为0的时候,会自动调整为震动模式

- getStreamMaxVolume(int streamType)：获得手机某个声音类型的最大音量值

- setStreamMute(int streamType,boolean state)：将手机某个声音类型设置为静音

- setSpeakerphoneOn(boolean on)：设置是否打开扩音器

- setMicrophoneMute(boolean on)：设置是否让麦克风静音

- isMicrophoneMute()：判断麦克风是否静音或是否打开

- isMusicActive()：判断是否有音乐处于活跃状态

- isWiredHeadsetOn()：判断是否插入了耳机

```

**其他方法**：

```
- abandonAudioFocus(AudioManager.OnAudioFocusChangeListenerl)：放弃音频的焦点

- adjustSuggestedStreamVolume(int,int suggestedStreamType intflags)： 调整最相关的流的音量，或者给定的回退流

- getParameters(String keys)：给音频硬件设置一个varaible数量的参数值

- getVibrateSetting(int vibrateType)：返回是否该用户的振动设置为振动类型

- isBluetoothA2dpOn()：检查是否A2DP蓝牙耳机音频路由是打开或关闭

- isBluetoothScoAvailableOffCall()：显示当前平台是否支持使用SCO的关闭调用用例

- isBluetoothScoOn()：检查通信是否使用蓝牙SCO

- loadSoundEffects()：加载声音效果

- playSoundEffect((int effectType, float volume)：播放声音效果

- egisterMediaButtonEventReceiver(ComponentName eventReceiver)： 注册一个组件MEDIA_BUTTON意图的唯一接收机

- requestAudioFocus(AudioManager.OnAudioFocusChangeListener l,int streamType,int durationHint) 请求音频的焦点

- setBluetoothScoOn(boolean on)：要求使用蓝牙SCO耳机进行通讯

- startBluetoothSco/stopBluetoothSco()()：启动/停止蓝牙SCO音频连接

- unloadSoundEffects()：卸载音效

```

# 2.Vibrator

## 2.1 获得Vibrator实例:

```java
Vibrator vb = (Vibrator)getSystemService(Service.VIBRATOR_SERVICE);
```

## 2.2可以使用的相关方法

```java
- abstract void cancel()：关闭或者停止振动器

- abstract boolean hasVibrator()：判断硬件是否有振动器

- void vibrate(long milliseconds)：控制手机振动为milliseconds毫秒

- void vibrate(long[] pattern,int repeat):指定手机以pattern指定的模式振动! 比如:pattern为new int[200,400,600,800],就是让他在200,400,600,800这个时间交替启动与关闭振动器! 而第二个则是重复次数,如果是-1的只振动一次,如果是0的话则一直振动 还有其他两个方法用得不多~ 
对了，使用振动器还需要在
AndroidManifest.xml中添加下述权限： <uses-permission android:name="android.permission.VIBRATE"/>

```

# 3.AlarmManager

## 3.1获得AlarmManager实例对象：

```java
AlarmManager alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
```

------

## 3.2相关方法讲解：

```java
- set(int type,long startTime,PendingIntent pi)：一次性闹钟

- setRepeating(int type，long startTime，long intervalTime，PendingIntent pi)： 重复性闹钟,和3有区别,3闹钟间隔时间不固定

- setInexactRepeating（int type，long startTime，long intervalTime,PendingIntent pi）： 重复性闹钟，时间不固定

- cancel(PendingIntent pi)：取消AlarmManager的定时服务

- getNextAlarmClock()：得到下一个闹钟，返回值AlarmManager.AlarmClockInfo

- setAndAllowWhileIdle(int type, long triggerAtMillis, PendingIntent operation) 和set方法类似，这个闹钟运行在系统处于低电模式时有效

- setExact(int type, long triggerAtMillis, PendingIntent operation)： 在规定的时间精确的执行闹钟，比set方法设置的精度更高

- setTime(long millis)：设置系统墙上的时间

- setTimeZone(String timeZone)：设置系统持续的默认时区

- setWindow(int type, long windowStartMillis, long windowLengthMillis, PendingIntent 
operation)： 设置一个闹钟在给定的时间窗触发。类似于set，该方法允许应用程序精确地控制操作系统调 整闹钟触发时间的程度。

```

**关键参数讲解**：

```java
- Type(闹钟类型)：
有五个可选值:
AlarmManager.ELAPSED_REALTIME: 闹钟在手机睡眠状态下不可用，该状态下闹钟使用相对时间（相对于系统启动开始），状态值为3; 
AlarmManager.ELAPSED_REALTIME_WAKEUP 闹钟在睡眠状态下会唤醒系统并执行提示功能，该状态下闹钟也使用相对时间，状态值为2； 
AlarmManager.RTC 闹钟在睡眠状态下不可用，该状态下闹钟使用绝对时间，即当前系统时间，状态值为1； AlarmManager.RTC_WAKEUP 表示闹钟在睡眠状态下会唤醒系统并执行提示功能，该状态下闹钟使用绝对时间，状态值为0;
AlarmManager.POWER_OFF_WAKEUP 表示闹钟在手机关机状态下也能正常进行提示功能，所以是5个状态中用的最多的状态之一，该状态下闹钟也是用绝对时间，状态值为4；不过本状态好像受SDK版本影响，某些版本并不支持；

- startTime：闹钟的第一次执行时间，以毫秒为单位，可以自定义时间，不过一般使用当前时间。 需要注意的是,本属性与第一个属性（type）密切相关,
	如果第一个参数对应的闹钟使用的是相对时间 （ELAPSED_REALTIME和ELAPSED_REALTIME_WAKEUP），
	那么本属性就得使用相对时间 （相对于系统启动时间来说）,比如当前时间就表示为:SystemClock.elapsedRealtime()； 
						如果第一个参数对应的闹钟使用的是绝对时间(RTC、RTC_WAKEUP、POWER_OFF_WAKEUP）, 
                     那么本属性就得使用绝对时间，比如当前时间就表示 为：System.currentTimeMillis()。

- intervalTime：表示两次闹钟执行的间隔时间,也是以毫秒为单位.

- PendingIntent：绑定了闹钟的执行动作，比如发送一个广播、给出提示等等。 PendingIntent是Intent的封装类。
	需要注意的是，如果是通过启动服务来实现闹钟提 示的话，PendingIntent对象的获取就应该采用			Pending.getService (Context c,int i,Intent intent,int j)方法；
	如果是通过广播来实现闹钟 提示的话，PendingIntent对象的获取就应该采用 PendingIntent.getBroadcast (Context c,int i,Intent intent,int j)方法；
	如果是采用Activity的方式来实 现闹钟提示的话，PendingIntent对象的获取就应该采用 PendingIntent.getActivity(Context c,int i,Intent intent,int j)方法。
如果这三种方法错用了的话，虽然不会报错，但是看不到闹钟提示效果。

```

