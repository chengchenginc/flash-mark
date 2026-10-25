# FlashMark 打包脚本（Windows PowerShell 包装）
# 用法:  .\scripts\build.ps1            # 生产构建
#        .\scripts\build.ps1 --debug    # debug 构建
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& node (Join-Path $ScriptDir 'package.mjs') @args
