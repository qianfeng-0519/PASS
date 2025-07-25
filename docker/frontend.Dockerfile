# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件并安装依赖
COPY frontend/package*.json ./
RUN npm install

# 复制源代码并构建
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY frontend ./
RUN npm run build

# 生产阶段 - 使用简单的静态服务器
FROM node:18-alpine

WORKDIR /app

# 安装serve来提供静态文件服务
RUN npm install -g serve

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动静态文件服务器
CMD ["serve", "-s", "dist", "-l", "3000"]