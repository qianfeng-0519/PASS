#!/bin/bash

echo "🛑 停止 PASS 应用..."

# 进入docker目录
cd "$(dirname "$0")"

# 停止服务
docker-compose down

echo "✅ 服务已停止"