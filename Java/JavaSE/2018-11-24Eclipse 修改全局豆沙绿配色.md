# Eclipse 修改全局豆沙绿配色

### 1.修改代码编辑区背景颜色

Windows -> Preference->General->Appearance->Editors->Text Editors

修改Background color  自定义颜色:

色调:85 

饱和度:120

 亮度:205

此时编辑区为豆沙了 ,但是左边右边和下方还是白色.强迫症表示很难受

### 2.修改下方console 区背景色

Windows -> Preference->Run/Debug->Console

修改Background color 为上边的豆沙绿.

### 3.修改左右两边背景色

package explore 这个是和系统窗口有关系.

所以需要修改windows窗体颜色

#### Win7:

在桌面上点击右键->个性化->窗口颜色->高级外观设置

点击：“项目”下拉框，选择“窗口”（默认显示为”桌面“）

单击右面的颜色1（L）：单击其他，调整为上边的豆沙绿.直接点击确定！

这时返回到上一个页面，颜色（R）：不要改变，，直接点击确定.

#### Win10:

windows+R键调出运行窗口 

输入 regedit 调出注册表编辑器 

1.HKEY_CURRENT_USER-->Control Panel-->Colors-->windows  将数据修改为 202 234 206 

2.HKEY_LOCAL_MACHINE-->SOFTWARE-->Microsoft-->Windows-->CurrentVersion-->Themes-->DefaultColors-->Standard  将数据修改为caeace  选择16进制 

重启后即可生效.







