@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =========================================
echo    Claude Code Proxy 服务安装脚本
echo =========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [×] 需要管理员权限才能安装Windows服务
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
echo 请确保已编译项目，或将此脚本放在正确的目录下
echo.
echo 尝试的路径：
for /L %%i in (0,1,3) do (
    call echo   %%PATHS[%%i]%%
)
echo.
pause
exit /b 1

:FOUND
echo [√] 找到应用程序: %APP_PATH%
echo.

:: 安装服务
echo [i] 正在安装Windows服务...
echo.
"%APP_PATH%" --install-service

if %errorLevel% == 0 (
    echo.
    echo [√] 服务安装成功！
    echo.
    echo 您现在可以：
    echo   1. 运行 start-service.bat 启动服务
    echo   2. 运行 windows-service-manager.bat 管理服务
    echo   3. 使用 Windows 服务管理器（services.msc）管理服务
) else (
    echo.
    echo [×] 服务安装失败！
    echo.
    echo 请检查：
    echo   1. 是否以管理员身份运行
    echo   2. 应用程序是否正常编译
    echo   3. 查看错误日志获取详细信息
)

echo.
pause 