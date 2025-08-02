@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =========================================
echo    Claude Code Proxy 停止服务脚本
echo =========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [×] 需要管理员权限才能停止Windows服务
    echo.
    echo 请右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

echo [√] 已获得管理员权限
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
echo 请确保已编译项目，或使用 install-service.bat 先安装服务
pause
exit /b 1

:FOUND
echo [√] 找到应用程序: %APP_PATH%
echo.

:: 停止服务
echo [i] 正在停止Windows服务...
echo.
"%APP_PATH%" --stop-service

if %errorLevel% == 0 (
    echo.
    echo [√] 服务停止成功！
) else (
    echo.
    echo [×] 服务停止失败！
    echo.
    echo 服务可能已经停止或未安装
)

echo.
pause 