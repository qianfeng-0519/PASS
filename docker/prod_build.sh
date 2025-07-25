#!/bin/bash

# 加载环境变量
if [ -f "../.env" ]; then
  source ../.env
else
  echo "错误：找不到 .env 文件"
  exit 1
fi

# 检查必要的环境变量
if [ -z "$DOCKER_REGISTRY" ] || [ -z "$NAMESPACE" ] || [ -z "$IMAGE_TAG" ] || [ -z "$REGISTRY_USER" ] || [ -z "$REGISTRY_PASSWORD" ]; then
  echo "错误：请在 .env 文件中设置 DOCKER_REGISTRY、NAMESPACE、IMAGE_TAG、REGISTRY_USER 和 REGISTRY_PASSWORD"
  exit 1
fi

# 登录镜像仓库（使用正确的格式）
echo "🔐 登录镜像仓库..."
docker login --username=$REGISTRY_USER --password=$REGISTRY_PASSWORD $DOCKER_REGISTRY
if [ $? -ne 0 ]; then
  echo "❌ 登录失败，请检查账号密码"
  exit 1
fi

# 创建并使用 buildx 构建器
echo "🔧 设置 buildx 构建器..."
# 简化的构建器设置（使用全局配置）
setup_buildx_builder() {
    # 检查全局配置是否存在
    if [ ! -f ~/.docker/buildx/buildkitd.toml ]; then
        echo "⚠️  未找到 buildx 配置文件，请先运行全局配置脚本"
        echo "💡 提示：请参考项目文档配置 buildx 镜像源"
        exit 1
    fi
    
    # 创建或使用构建器
    if ! docker buildx inspect multiplatform-builder >/dev/null 2>&1; then
        echo "🚀 创建 Buildx 构建器（使用全局配置）..."
        docker buildx create \
            --name multiplatform-builder \
            --config ~/.docker/buildx/buildkitd.toml \
            --use
        
        echo "🔄 启动构建器..."
        docker buildx inspect --bootstrap
    else
        echo "✅ 使用现有 Buildx 构建器..."
        docker buildx use multiplatform-builder
    fi
}

# 执行构建器设置
setup_buildx_builder

echo "🚀 开始构建生产环境镜像..."

# 构建后端镜像（包含正确的命名空间）
echo "📦 构建后端镜像 (linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  --tag ${DOCKER_REGISTRY}/${NAMESPACE}/pass-backend:${IMAGE_TAG} \
  --tag ${DOCKER_REGISTRY}/${NAMESPACE}/pass-backend:latest \
  --push \
  --file backend.Dockerfile \
  ..

if [ $? -ne 0 ]; then
  echo "❌ 后端镜像构建失败"
  exit 1
fi

# 构建前端镜像（包含正确的命名空间）
echo "📦 构建前端镜像 (linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  --tag ${DOCKER_REGISTRY}/${NAMESPACE}/pass-frontend:${IMAGE_TAG} \
  --tag ${DOCKER_REGISTRY}/${NAMESPACE}/pass-frontend:latest \
  --push \
  --file frontend.Dockerfile \
  ..

if [ $? -ne 0 ]; then
  echo "❌ 前端镜像构建失败"
  exit 1
fi

echo "✅ 生产环境镜像构建并推送完成！"
echo "📋 构建的镜像："
echo "   - ${DOCKER_REGISTRY}/${NAMESPACE}/pass-backend:${IMAGE_TAG}"
echo "   - ${DOCKER_REGISTRY}/${NAMESPACE}/pass-frontend:${IMAGE_TAG}"