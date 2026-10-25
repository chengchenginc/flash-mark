@echo off
rem FlashMark 打包脚本（Windows cmd 版）
rem 用法:  scripts\build.bat             生产构建
rem        scripts\build.bat --debug     debug 构建
rem        scripts\build.bat --help      帮助
rem 说明: 调用 node scripts/package.mjs（node 在控制台下用宽字符 API 输出，中文正常显示）
setlocal
set "SCRIPT_DIR=%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] node not found. Please install Node.js and add it to PATH.
    exit /b 1
)
node "%SCRIPT_DIR%package.mjs" %*
endlocal
