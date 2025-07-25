#!/bin/bash

#该脚本是放在服务器拉取镜像和运行镜像使用的，本地不可用

set -e  # 出错时立即退出

# 检查是否有 .env 文件并加载环境变量
if [ -f ../.env ]; then
  source ../.env
  echo "已加载环境变量"
else
  echo "警告: .env 文件不存在，将使用系统环境变量"
fi

# 验证必需的环境变量
required_vars=("DOCKER_REGISTRY" "NAMESPACE" "IMAGE_TAG" "REGISTRY_USER" "REGISTRY_PASSWORD")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ 错误: 环境变量 $var 未设置"
    exit 1
  fi
done

# 显式导出环境变量给docker-compose使用
export DOCKER_REGISTRY
export NAMESPACE  
export IMAGE_TAG

# 从环境变量构建配置
REGISTRY_URL="$DOCKER_REGISTRY"
REPOSITORY="$NAMESPACE"
COMPOSE_FILE="./docker-compose.prod.yml"
# 镜像名（不包含 -prod 后缀）
IMAGE_NAMES=("pass-backend" "pass-frontend")

echo "🔧 配置信息:"
echo "   镜像仓库: $REGISTRY_URL"
echo "   命名空间: $REPOSITORY"
echo "   镜像标签: $IMAGE_TAG"
echo "   Compose文件: $COMPOSE_FILE"


# 登录镜像仓库
echo "🔐 正在登录镜像仓库..."
if ! docker login "$REGISTRY_URL" -u "$REGISTRY_USER" -p "$REGISTRY_PASSWORD"; then
  echo "❌ 镜像仓库登录失败"
  exit 1
fi

# 检查并拉取最新镜像
for service in "${IMAGE_NAMES[@]}"; do
  echo "🔍 检查 $service 镜像更新..."
  
  # 构建完整的镜像名称
  FULL_IMAGE_NAME="$REGISTRY_URL/$REPOSITORY/$service:$IMAGE_TAG"
  
  # 获取远程镜像的 digest
  remote_digest=$(docker buildx imagetools inspect "$FULL_IMAGE_NAME" | grep "Digest:" | awk '{print $2}')
  
  # 获取本地镜像的 digest（如果存在）
  if docker image inspect "$FULL_IMAGE_NAME" &>/dev/null; then
    local_digest=$(docker image inspect "$FULL_IMAGE_NAME" --format='{{index .RepoDigests 0}}' | awk -F'@' '{print $2}')
  else
    local_digest=""
  fi
  
  # 比较 digest，决定是否拉取
  if [ "$remote_digest" != "$local_digest" ]; then
    echo "📥 $service 有更新，正在拉取最新镜像..."
    docker pull "$FULL_IMAGE_NAME"
  else
    echo "✅ $service 已是最新版本，跳过拉取"
  fi
done

# 启动服务
echo "🚀 正在启动服务..."
docker-compose -f "$COMPOSE_FILE" up -d

# 显示服务状态
echo "🌐 服务状态:"
docker-compose -f "$COMPOSE_FILE" ps

echo "✅ 部署完成!"