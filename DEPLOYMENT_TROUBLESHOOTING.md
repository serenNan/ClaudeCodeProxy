# ClaudeCodeProxy Docker部署故障排除指南

本文档总结了ClaudeCodeProxy项目Docker部署过程中遇到的常见问题和解决方案。

## 问题汇总与解决方案

### 1. 前端构建依赖问题

#### 问题描述
在构建前端静态文件时，出现多个依赖缺失错误：

```bash
Error: Cannot find module @rollup/rollup-linux-x64-gnu
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
Error: Failed to load native binding
```

#### 解决方案
安装缺失的平台特定依赖：

```bash
# 安装缺失的依赖
npm install --save-dev @rollup/rollup-linux-x64-gnu
npm install --save-dev lightningcss-linux-x64-gnu
npm install --save-dev @tailwindcss/oxide-linux-x64-gnu
```

#### 根本原因
这些依赖是平台特定的二进制文件，在某些Linux环境中不会自动安装。

### 2. Docker构建失败：dist目录不存在

#### 问题描述
```bash
failed to calculate checksum of ref... "/web/dist": not found
```

#### 解决方案
**必须先构建前端再构建Docker镜像：**

```bash
# 1. 进入前端目录
cd web

# 2. 安装依赖
npm install

# 3. 构建前端静态文件
npm run build:prod

# 4. 再构建Docker镜像
docker-compose build
```

### 3. 端口映射不匹配

#### 问题描述
应用配置使用6500端口，但Docker容器映射的是8080端口，导致服务无法访问。

#### 问题分析
- **应用配置** (`appsettings.json`): `"Urls": "http://*:6500"`
- **Dockerfile**: `EXPOSE 8080`
- **docker-compose.yml**: 映射8080端口

#### 解决方案

**方案1：修改端口映射（推荐）**
```bash
# 直接运行容器，映射正确端口
docker run -d -p 8080:6500 \
  --name claude-code-proxy \
  -e ConnectionStrings__DefaultConnection="Data Source=/app/data/ClaudeCodeProxy.db;Cache=Shared" \
  -e RunMigrationsAtStartup=true \
  -e USER_NAME=admin \
  -e PASSWORD=admin123 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  claude-code-proxy
```

**方案2：修改应用配置**
在docker-compose.yml中添加环境变量：
```yaml
environment:
  - ASPNETCORE_URLS=http://*:8080
```

### 4. 容器镜像拉取失败

#### 问题描述
```bash
Unable to find image 'claude-code-proxy:latest' locally
Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: request canceled
```

#### 解决方案
使用正确的镜像名称（基于docker-compose构建的镜像）：

```bash
# 使用完整镜像名
crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/claude-code-proxy
```

## 完整部署流程

### 标准Docker部署步骤

```bash
# 1. 构建前端静态文件
cd web
npm install
npm run build:prod

# 2. 构建Docker镜像
docker-compose build

# 3. 运行容器（修正端口映射）
docker run -d -p 8080:6500 \
  --name claude-code-proxy \
  -e ConnectionStrings__DefaultConnection="Data Source=/app/data/ClaudeCodeProxy.db;Cache=Shared" \
  -e RunMigrationsAtStartup=true \
  -e USER_NAME=admin \
  -e PASSWORD=admin123 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/claude-code-proxy

# 4. 验证服务
curl http://localhost:8080/health
curl http://localhost:8080/system-info
```

### 使用docker-compose.yml的修正版本

创建 `docker-compose.override.yml` 文件：

```yaml
version: '3.8'
services:
  claude-code-proxy:
    ports:
      - "8080:6500"  # 修正端口映射
    environment:
      - ASPNETCORE_URLS=http://*:6500
```

## 验证检查清单

部署后请验证以下端点：

- [ ] `http://localhost:8080/health` - 健康检查 (200 OK)
- [ ] `http://localhost:8080/system-info` - 系统信息
- [ ] `http://localhost:8080/` - Web界面
- [ ] `http://localhost:8080/scalar/v1` - API文档

## 日志查看命令

```bash
# 查看容器日志
docker logs claude-code-proxy

# 实时查看日志
docker logs -f claude-code-proxy

# 查看最后50行日志
docker logs claude-code-proxy --tail=50
```

## 常见问题快速索引

| 问题类型 | 症状 | 解决方案 |
|---------|------|----------|
| 前端构建失败 | 缺少*.node模块 | 安装平台特定依赖 |
| Docker构建失败 | dist目录不存在 | 先构建前端 |
| 端口访问失败 | 连接被拒绝 | 检查端口映射 |
| 镜像拉取失败 | registry超时 | 使用正确的镜像名 |
| 服务启动慢 | 首次初始化 | 等待数据库迁移完成 |

## 性能优化建议

1. **构建缓存**: 使用多阶段构建减少镜像大小
2. **依赖缓存**: 合理分层COPY指令
3. **健康检查**: 配置适当的健康检查间隔
4. **资源限制**: 为容器设置合理的内存和CPU限制

## 故障排查命令

```bash
# 检查容器状态
docker ps -a

# 检查端口映射
docker port claude-code-proxy

# 进入容器调试
docker exec -it claude-code-proxy /bin/bash

# 检查容器资源使用
docker stats claude-code-proxy
```

## 下一步改进建议

1. **CI/CD集成**: 添加GitHub Actions自动构建
2. **环境变量标准化**: 统一端口配置
3. **健康检查优化**: 添加数据库连接检查
4. **多架构支持**: 支持ARM64架构
5. **安全加固**: 使用非root用户运行应用