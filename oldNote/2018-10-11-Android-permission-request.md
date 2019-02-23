---
layout: post
title: Android 动态申请权限
categories: [Android]
description: Android 6.0后的动态申请权限
keywords: Permissions
---

# Android 动态申请权限

## 1.具体步骤

```
- 1.检查是否有此权限：API23以下不用检查 直接进行操作 23及以上则需要 先checkSelfPermission()，如果已经开启，则直接进行需要的操作。
- 2.如果没有开启，则要判断是否需要向用户解释为何申请权限的原因：shouldShowRequestPermissionRationale。
- 3.如果需要（返回true），则弹出对话框提示用户申请权限原因，用户确认后申请权限：requestPermissions()，如果不需要（即返回false），则直接申请权限：requestPermissions()。
```

## 2.判断和申请权限

```java
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    //6.0以上 需要动态申请
    if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
        //拥有权限，执行操作
        takePhoto();
    } else {
        //没有权限，向用户请求权限 requestCode来区分申请的那个权限
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 0);
    }
} else {
    //6.0以下 不用动态申请，直接执行操作
    takePhoto();
}
```

## 3.重写onRequestPermissionsResult 权限请求结果

```java
/**
     * @param requestCode
     * @param grantResults
     * @param权限申请结果
     */
    @TargetApi(Build.VERSION_CODES.M)//API23以上才需要动态申请权限
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        //requestCode来区分申请的那个权限
        if (requestCode == 0) { //上边相机权限requestCode填的0 所以对相机权限申请做处理
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                //用户同意授权 执行要做的事
                takePhoto();
            } else {
                //用户点了拒绝  判断是否需要展示为什么需要申请权限

                    if (!shouldShowRequestPermissionRationale(Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
                        //用户拒绝且勾选了不在提示 已经无法再次申请权限 则弹出提示框
                        AlertDialog mDialog = new AlertDialog.Builder(this)
                                .setTitle("友好提醒")
                                .setMessage("您已拒绝权限,请开启权限！")
                                .setPositiveButton("开启", new DialogInterface.OnClickListener() {
                                    @Override
                                    public void onClick(DialogInterface dialog, int which) {
                                        dialog.cancel();
                                        //去开启权限
                                  Intent loaclIntent=new Intent();
                       	loaclIntent.setAction("android.settings.APPLICATION_DETAILS_SETTINGS");
                         loaclIntent.setData(Uri.fromParts("package", getPackageName(), null));
                                    startActivity(loaclIntent);
                                    }
                                })
                                .setCancelable(true)
                                .create();
                        mDialog.show();
                    } else {
                        //点了拒绝没勾选不在提示 则继续申请权限
                        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 0);
                    }
                }
            }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
```

## 4.shouldShowRequestPermissionRationale

根据测试shouldShowRequestPermissionRationale的返回值主要以下几种情况 ：

| 第一次打开App时                                    | false |
| -------------------------------------------------- | ----- |
| 上次弹出权限点击了禁止（但没有勾选“下次不在询问”） | true  |
| 上次选择禁止并勾选：下次不在询问                   | false |

[Demo下载](https://github.com/lillusory/RequestPermission)

