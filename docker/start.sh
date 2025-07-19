#!/bin/bash

echo "🚀 启动 PASS 应用..."

# 进入docker目录
cd "$(dirname "$0")"

# 检查环境变量文件
if [ ! -f ../.env ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置"
fi

# 构建并启动服务
echo "📦 构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker-compose exec backend python manage.py migrate

# 创建超级用户（可选）
echo "👤 如需创建管理员用户，请运行："
echo "docker-compose exec backend python manage.py createsuperuser"

# 显示访问信息
echo "✅ 启动完成！"
echo "🌐 前端访问: http://localhost:3000"
echo "🔧 后端API: http://localhost:8000/api/"
echo "👨‍💼 管理后台: http://localhost:8000/admin/"
echo ""
echo "📋 常用命令："
echo "  停止服务: docker-compose down"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"