# Claude Code Proxy - 前端管理界面

## 🚀 功能特性

### 🔐 用户认证
- 基于用户名密码的登录系统
- JWT token 认证机制
- 自动路由守卫，未登录用户重定向到登录页面
- 美观的登录界面，包含在线图片资源

### 📊 数据面板
- 系统概览统计（API Keys 数量、账号数量）
- 实时系统状态监控
- 性能指标展示

### 🔑 API Key 管理
- 完整的 CRUD 操作（创建、读取、更新、删除）
- 支持显示/隐藏 API Key
- Key 状态管理（启用/禁用）
- 创建时间和更新时间显示

### 👥 账号管理
- 支持多平台账号管理：
  - Claude
  - Claude Console  
  - Gemini
- 账号状态管理
- Session Key 管理
- 最后使用时间跟踪

### ⚙️ 系统设置
- 基础系统配置
- 性能参数设置
- 安全选项配置
- 通知设置
- 界面主题切换

## 🛠️ 技术栈

- **框架**: React 19 + TypeScript
- **路由**: React Router v7
- **样式**: Tailwind CSS + Shadcn/ui
- **组件库**: Radix UI primitives
- **构建工具**: Vite
- **状态管理**: React Context API

## 🚀 启动说明

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
- 前端地址: http://localhost:5176 (端口可能不同)
- 后端API: http://localhost:5000

## 🔧 配置说明

### API 代理配置
在 `vite.config.ts` 中配置了代理，将 `/api` 请求转发到后端服务：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

### Mock 数据
当后端服务不可用时，前端会自动使用 Mock 数据进行演示，包括：
- 登录认证 (任意用户名密码可登录)
- API Keys 示例数据
- 账号管理示例数据

## 📱 界面预览

### 登录页面
- 现代化渐变背景
- 中心化卡片布局
- 表单验证和错误提示
- 加载状态显示

### 管理界面
- 响应式侧边栏导航
- 面包屑导航
- 统一的卡片式布局
- 数据表格和表单组件

## 🔐 登录测试
由于集成了 Mock 认证，您可以使用任意用户名和密码进行登录测试。

## 📝 开发说明

### 文件结构
```
src/
├── components/          # UI 组件
│   ├── ui/             # 基础 UI 组件
│   ├── auth/           # 认证相关组件
│   └── ...
├── contexts/           # React Context
├── layouts/           # 页面布局
├── pages/             # 页面组件
├── services/          # API 服务
└── hooks/             # 自定义 Hooks
```

### 添加新页面
1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由配置
3. 在侧边栏配置中添加导航项

### API 集成
所有 API 调用都通过 `src/services/api.ts` 中的 `ApiService` 类处理，支持：
- 自动 JWT token 管理
- 请求/响应拦截
- 错误处理
- Mock 数据回退

## 🎨 UI/UX 特性
- 完全响应式设计
- 深色/浅色主题支持
- 流畅的动画过渡
- 直观的用户交互
- 现代化的视觉设计