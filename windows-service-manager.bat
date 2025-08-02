@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [√] 已获得管理员权限
) else (
    echo [×] 需要管理员权限才能管理Windows服务
    echo.
    echo 请右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

:: 设置应用程序路径
set "APP_NAME=ClaudeCodeProxy.Host.exe"
set "APP_PATH=%~dp0%APP_NAME%"

:: 检查应用程序是否存在
if not exist "%APP_PATH%" (
    echo [×] 找不到应用程序: %APP_PATH%
    echo.
    echo 请确保此批处理文件与 %APP_NAME% 在同一目录下
    pause
    exit /b 1
)

:MENU
cls
echo =========================================
echo      Claude Code Proxy 服务管理器
echo =========================================
echo.
echo 请选择操作：
echo.
echo [1] 安装Windows服务
echo [2] 卸载Windows服务
echo [3] 启动服务
echo [4] 停止服务
echo [5] 查看服务状态
echo [6] 查看帮助信息
echo [0] 退出
echo.
set /p choice=请输入选项 (0-6): 

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto UNINSTALL
if "%choice%"=="3" goto START
if "%choice%"=="4" goto STOP
if "%choice%"=="5" goto STATUS
if "%choice%"=="6" goto HELP
if "%choice%"=="0" goto EXIT

echo [×] 无效选项，请重新选择
pause
goto MENU

:INSTALL
echo.
echo [i] 正在安装Windows服务...
"%APP_PATH%" --install-service
if %errorLevel% == 0 (
    echo [√] 服务安装完成
) else (
    echo [×] 服务安装失败
)
echo.
pause
goto MENU

:UNINSTALL
echo.
echo [i] 正在卸载Windows服务...
"%APP_PATH%" --uninstall-service
if %errorLevel% == 0 (
    echo [√] 服务卸载完成
) else (
    echo [×] 服务卸载失败
)
echo.
pause
goto MENU

:START
echo.
echo [i] 正在启动服务...
"%APP_PATH%" --start-service
if %errorLevel% == 0 (
    echo [√] 服务启动完成
) else (
    echo [×] 服务启动失败
)
echo.
pause
goto MENU

:STOP
echo.
echo [i] 正在停止服务...
"%APP_PATH%" --stop-service
if %errorLevel% == 0 (
    echo [√] 服务停止完成
) else (
    echo [×] 服务停止失败
)
echo.
pause
goto MENU

:STATUS
echo.
echo [i] 查看服务状态...
echo.
"%APP_PATH%" --service-status
echo.
pause
goto MENU

:HELP
echo.
echo [i] 显示帮助信息...
echo.
"%APP_PATH%" --help
echo.
pause
goto MENU

:EXIT
echo.
echo 感谢使用 Claude Code Proxy 服务管理器！
echo.
timeout /t 2 >nul
exit /b 0 