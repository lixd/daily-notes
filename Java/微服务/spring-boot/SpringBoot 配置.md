# SpringBoot 配置

### 批量删除垃圾文件

我们在使用Maven更新版本依赖的时候，经常因为网速的原因，未下载完成而导致产生垃圾文件（xxx.lastUpdated）。 

```bash
@echo off
set REPOSITORY_PATH=D:\dev\mvnrepository （这里换成你的）
rem 开始删除... 
for /f "delims=" %%i in ('dir /b /s "%REPOSITORY_PATH%\*lastUpdated*"') do (
    del /s /q %%i
)
rem 删除完成!!
pause
```

