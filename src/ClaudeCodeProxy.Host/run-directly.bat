@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =========================================
echo   Claude Code Proxy 直接运行脚本
echo =========================================
echo.

:: 查找应用程序路径
set "APP_NAME=ClaudeCodeProxy.Host.exe"
set "APP_PATH="

:: 尝试多个可能的路径
set "PATHS[0]=%~dp0%APP_NAME%"
set "PATHS[1]=%~dp0src\ClaudeCodeProxy.Host\bin\Release\net8.0\%APP_NAME%"
set "PATHS[2]=%~dp0src\ClaudeCodeProxy.Host\bin\Debug\net8.0\%APP_NAME%"
set "PATHS[3]=%~dp0src\ClaudeCodeProxy.Host\bin\Release\net8.0\publish\%APP_NAME%"

for /L %%i in (0,1,3) do (
    call set "CURRENT_PATH=%%PATHS[%%i]%%"
    if exist "!CURRENT_PATH!" (
        set "APP_PATH=!CURRENT_PATH!"
        goto :FOUND
    )
)

echo [×] 找不到应用程序 %APP_NAME%
echo.
echo 请确保已编译项目，尝试的路径：
for /L %%i in (0,1,3) do (
    call echo   %%PATHS[%%i]%%
)
echo.
echo 如果项目尚未编译，请先运行以下命令：
echo   dotnet build --configuration Release
echo   或者
echo   dotnet publish --configuration Release
echo.
pause
exit /b 1

:FOUND
echo [√] 找到应用程序: %APP_PATH%
echo.

:: 直接运行应用程序
echo [i] 正在启动 Claude Code Proxy...
echo.
echo 按 Ctrl+C 停止应用程序
echo.
echo =========================================
echo.

"%APP_PATH%" 