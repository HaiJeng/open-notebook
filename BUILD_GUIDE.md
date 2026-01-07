# Open Notebook 构建指南

本项目使用**基础镜像 + 应用镜像**的两层构建策略，以加速后续构建和测试。

## 📦 镜像架构

```
library/open-notebook-base:latest      (基础镜像 - 包含所有系统依赖)
    ↓
library/open-notebook-cn:latest        (应用镜像 - 包含应用代码)
```

## 🚀 快速开始

### 方式 1: 使用构建脚本（推荐）

**Windows:**
```bash
# 首次构建（构建基础镜像 + 应用镜像）
build-docker.bat --build-base

# 后续构建（仅构建应用镜像，速度极快）
build-docker.bat
```

**Linux/Mac:**
```bash
# 首次构建（构建基础镜像 + 应用镜像）
chmod +x build-docker.sh
./build-docker.sh --build-base

# 后续构建（仅构建应用镜像，速度极快）
./build-docker.sh
```

### 方式 2: 手动构建

#### 步骤 1: 准备 Node.js（可选，脚本会自动下载）

```bash
mkdir -p docker-deps
cd docker-deps
curl -LO https://nodejs.org/dist/v20.18.2/node-v20.18.2-linux-x64.tar.xz
cd ..
```

#### 步骤 2: 构建基础镜像（首次或依赖变更时）

```bash
docker build -f Dockerfile.base -t library/open-notebook-base:latest .
```

#### 步骤 3: 构建应用镜像

```bash
docker build -t library/open-notebook-cn:latest .
```

#### 步骤 4: 运行

```bash
docker-compose up -d
```

## ⏱️ 构建时间对比

| 场景 | 传统方式 | 基础镜像方式 |
|------|---------|-------------|
| 首次完整构建 | 5-10 分钟 | 基础镜像: 3-5 分钟<br>应用镜像: 2-3 分钟 |
| 代码变更重建 | 3-5 分钟 | **30-60 秒** ⚡ |
| 依赖变更重建 | 5-10 分钟 | 重建基础镜像: 3-5 分钟<br>应用镜像: 30-60 秒 |

## 🎯 使用场景

### 何时重建基础镜像？

**需要重建的情况：**
- ✅ 首次使用
- ✅ 升级 Node.js 版本
- ✅ 添加新的系统依赖（apt-get install）
- ✅ 更新 Python 基础镜像版本

**不需要重建的情况：**
- ❌ 修改应用代码
- ❌ 更新 Python 包依赖（pyproject.toml）
- ❌ 更新 NPM 包依赖（package.json）
- ❌ 修改配置文件

### 何时只构建应用镜像？

**日常开发和测试时：**
```bash
# Windows
build-docker.bat

# Linux/Mac
./build-docker.sh
```

构建速度：**30-60 秒** ⚡

## 🔧 高级选项

### 查看帮助

```bash
# Windows
build-docker.bat --help

# Linux/Mac
./build-docker.sh --help
```

### 推送到镜像仓库

```bash
# Windows
build-docker.bat --build-base --push

# Linux/Mac
./build-docker.sh --build-base --push
```

## 🌏 国内镜像源

基础镜像默认使用**清华大学镜像源**加速 apt-get 下载。

如需修改或禁用，编辑 `Dockerfile.base` 第 6 行：

```dockerfile
# 使用其他镜像源
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

# 或注释掉以使用官方源
# RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources
```

## 📋 文件说明

| 文件 | 用途 |
|------|------|
| `Dockerfile.base` | 基础镜像定义（系统依赖、Node.js、UV） |
| `Dockerfile` | 应用镜像定义（应用代码、Python/NPM 依赖） |
| `build-docker.sh` | Linux/Mac 构建脚本 |
| `build-docker.bat` | Windows 构建脚本 |
| `docker-compose.yml` | Docker Compose 配置 |

## 🐛 故障排查

### 问题 1: 基础镜像不存在

```
Error: pull access denied for library/open-notebook-base
```

**解决方法：** 先构建基础镜像
```bash
build-docker.bat --build-base
```

### 问题 2: Node.js 下载失败

**解决方法：** 手动下载
```bash
mkdir -p docker-deps
cd docker-deps
# 使用国内镜像
curl -LO https://npmmirror.com/mirrors/node/v20.18.2/node-v20.18.2-linux-x64.tar.xz
```

### 问题 3: BuildKit 缓存失效

**解决方法：** 确保启用 BuildKit
```bash
export DOCKER_BUILDKIT=1  # Linux/Mac
set DOCKER_BUILDKIT=1     # Windows
```

## 💡 最佳实践

1. **首次使用**：运行 `--build-base` 构建基础镜像
2. **日常开发**：只运行构建脚本，不加参数
3. **清理旧镜像**：定期运行 `docker system prune -a`
4. **版本管理**：给基础镜像打标签，如 `v1.0`

```bash
docker tag library/open-notebook-base:latest library/open-notebook-base:v1.0
```

## 📚 相关文档

- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [BuildKit 缓存](https://docs.docker.com/build/cache/)
- [项目主 README](./README.md)
