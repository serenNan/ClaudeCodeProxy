FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM node:20.18-alpine3.21 AS web
WORKDIR /src

# 设置npm镜像源以加速ARM64构建
RUN npm config set registry https://registry.npmmirror.com
RUN yarn config set registry https://registry.npmmirror.com

# 安装必需的工具
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# 复制package文件优先，利用缓存
COPY web/package*.json web/yarn.lock* ./
RUN yarn install --frozen-lockfile --network-timeout 100000 || npm install --force

# 复制源代码并构建
COPY web .
RUN yarn run build || npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/ClaudeCodeProxy.Host/ClaudeCodeProxy.Host.csproj", "src/ClaudeCodeProxy.Host/"]
COPY ["src/ClaudeCodeProxy.Abstraction/ClaudeCodeProxy.Abstraction.csproj", "src/ClaudeCodeProxy.Abstraction/"]
COPY ["src/ClaudeCodeProxy.Domain/ClaudeCodeProxy.Domain.csproj", "src/ClaudeCodeProxy.Domain/"]
COPY ["src/Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/ClaudeCodeProxy.EntityFrameworkCore.Sqlite.csproj", "src/Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/"]
COPY ["src/ClaudeCodeProxy.Core/ClaudeCodeProxy.Core.csproj", "src/ClaudeCodeProxy.Core/"]
RUN dotnet restore "src/ClaudeCodeProxy.Host/ClaudeCodeProxy.Host.csproj"
COPY . .
WORKDIR "/src/src/ClaudeCodeProxy.Host"
RUN dotnet build "./ClaudeCodeProxy.Host.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ClaudeCodeProxy.Host.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=web /src/dist ./wwwroot
ENTRYPOINT ["dotnet", "ClaudeCodeProxy.Host.dll"]
