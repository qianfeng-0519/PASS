#!/bin/bash
set -e  # 出错时立即退出

# 本地测试：构建并运行镜像（使用本地架构）
echo "🔧 验证配置文件..."
docker-compose -f docker-compose.test.yml config >/dev/null || {
  echo "❌ Compose 配置验证失败"
  exit 1
}

# 使用现代 docker build（自动使用镜像源配置）
echo "🚧 构建 backend 镜像..."
docker build -t pass-backend-test -f backend.Dockerfile ..

echo "🚧 构建 frontend 镜像..."
docker build -t pass-frontend-test -f frontend.Dockerfile ..

# 使用 Compose 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.test.yml up -d

# 验证服务状态
echo "🔍 检查服务状态..."
if ! docker-compose -f docker-compose.test.yml ps | grep -q "Up"; then
  echo "❌ 服务启动失败"
  exit 1
fi

echo "✅ 本地测试环境已启动：http://localhost:3000"