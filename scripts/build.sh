#!/usr/bin/env bash
# FlashMark 打包脚本（bash 包装，适用于 Git Bash / macOS / Linux）
# 用法:  ./scripts/build.sh            # 生产构建
#        ./scripts/build.sh --debug    # debug 构建
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/package.mjs" "$@"
