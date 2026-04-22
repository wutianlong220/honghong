# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个恋爱主题的互动游戏应用，使用 Next.js 16 App Router + Drizzle ORM + Supabase 构建。使用标准 Next.js 部署模式，部署在 Vercel。

## 核心命令

```bash
# 开发
pnpm install        # 安装依赖（必须使用 pnpm，preinstall 脚本会强制检查）
pnpm dev           # 启动开发服务器（端口 3000）

# 构建
pnpm build         # 生产构建（执行 scripts/build.sh）
pnpm start         # 启动生产服务器（执行 scripts/start.sh）

# 代码检查
pnpm lint          # ESLint 检查
pnpm ts-check      # TypeScript 类型检查
```

## 关键架构特点

### 1. 标准 Next.js 部署 ✅

本项目使用**标准的 Next.js 部署模式**：
- 开发：`pnpm dev`（端口 3000）
- 构建：`pnpm build`（输出到 `.next/`）
- 生产：`pnpm start`

**优势**：
- ✅ 完美兼容 Vercel
- ✅ 可以使用 Edge Functions、ISR 等优化
- ✅ 符合 Next.js 官方最佳实践
- ✅ 部署简单稳定

### 2. 构建时环境变量配置

**构建脚本包含假数据库 URL**，避免 Next.js 16 在构建时预渲染 API 路由失败：

```json
{
  "scripts": {
    "build": "DATABASE_URL=\"postgresql://fake:fake@localhost:5432/fake\" bash ./scripts/build.sh"
  }
}
```

**Vercel 部署配置**：
- 在 `vercel.json` 中配置了相同的构建命令
- 在 Vercel Dashboard → Settings → Environment Variables 中添加：
  - **Name**: `DATABASE_URL`
  - **Value**: `postgresql://fake:fake@localhost:5432/fake`
  - **Environment**: **Build**（只用于构建，不用于运行时）

**重要**：运行时环境变量需要单独配置（Production 环境使用真实的 `DATABASE_URL`）。

### 3. 数据库架构

使用 Drizzle ORM + PostgreSQL，数据层位于 `src/storage/database/`：

```
src/storage/database/
├── drizzle.ts              # Drizzle 实例
├── supabase-client.ts      # Supabase 客户端
└── shared/
    ├── schema.ts           # 数据库 Schema 定义（所有表结构）
    └── ...                 # 其他共享类型
```

**关键**：所有数据库表结构定义在 `src/storage/database/shared/schema.ts`，这是单一事实来源。

**迁移**：
```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit push
```

### 4. 服务层（Service Layer）

业务逻辑封装在 `src/lib/` 的服务模块中：

```typescript
// 认证服务
src/lib/auth.ts              # 登录、注册、Token 管理
src/lib/session.ts           # 会话管理

// 业务服务
src/lib/blog-service.ts      # 博客文章 CRUD
src/lib/game-record-service.ts  # 游戏记录
src/lib/user-service.ts      # 用户管理

// 客户端
src/lib/supabase-browser.ts  # Supabase 客户端（浏览器）
```

**开发原则**：
- API 路由只处理 HTTP 请求/响应，业务逻辑在服务层
- 服务层函数可以复用（如服务端组件调用）

### 5. Next.js 配置

`next.config.ts` 包含重要配置：

```typescript
// 避免构建时预渲染数据库包
serverExternalPackages: ['pg', '@supabase/supabase-js', 'drizzle-orm', 'bcrypt']

// 允许的开发源
allowedDevOrigins: ['*.dev.coze.site']

// 图片域名白名单
images.remotePatterns: [{ hostname: 'lf-coze-web-cdn.coze.cn' }]
```

### 6. Babel 配置

项目使用 `@react-dev-inspector/babel-plugin` 进行开发时调试（`.babelrc`）。

**注意**：以下包已在 `dependencies`（不在 `devDependencies`），确保 Vercel 构建时可用：
- `@react-dev-inspector/babel-plugin`
- `@react-dev-inspector/middleware`
- `typescript`
- `@tailwindcss/postcss`

## 已修复的历史问题

### 问题 1：Vercel 部署构建失败（已修复 ✅）

**症状**：`Error: DATABASE_URL is not set` - `Failed to collect page data`

**原因**：Next.js 16 在构建时预渲染 API 路由，此时没有数据库环境变量。

**最终解决方案**：在构建脚本中提供假 `DATABASE_URL`
```json
{
  "scripts": {
    "build": "DATABASE_URL=\"postgresql://fake:fake@localhost:5432/fake\" bash ./scripts/build.sh"
  }
}
```

**其他尝试过的方案**（已放弃）：
- 方案 A：为所有 API 路由添加 `export const runtime = 'nodejs'` 和 `export const dynamic = 'force-dynamic'` - 仍然失败

### 问题 2：自定义服务器与 Vercel 不兼容（已修复 ✅）

**原问题**：项目使用自定义服务器（`src/server.ts`），Vercel 无法识别

**解决方案**：删除自定义服务器，使用标准 Next.js 部署
- ✅ 删除 `src/server.ts`
- ✅ 修改 `scripts/build.sh`（移除 tsup 打包步骤）
- ✅ 修改 `scripts/dev.sh`（使用 `next dev`）
- ✅ 修改 `scripts/start.sh`（使用 `next start`）

### 问题 3：依赖分类错误（已修复 ✅）

**症状**：Vercel 构建时找不到 Babel 插件、TypeScript 等

**解决方案**：将以下包从 `devDependencies` 移至 `dependencies`：
- `@react-dev-inspector/babel-plugin`
- `@react-dev-inspector/middleware`
- `typescript`
- `@tailwindcss/postcss`

### 问题 4：.npmrc 安全配置问题（已修复 ✅）

**症状**：依赖完整性校验被禁用

**解决方案**：删除 `.npmrc` 中的以下配置：
- `strictStorePkgContentCheck=false`
- `verifyStoreIntegrity=false`

## 代码组织规范

### 添加新 API 路由

```typescript
// src/app/api/your-route/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';        // 必须
export const dynamic = 'force-dynamic';  // 必须

export async function POST(request: NextRequest) {
  // 1. 调用服务层函数
  // 2. 返回 NextResponse
}
```

### 添加新页面

**服务端组件（默认）**：
```typescript
// src/app/your-page/page.tsx
import { getServiceData } from '@/lib/your-service';

export const dynamic = 'force-dynamic';  // 如果访问数据库

export default async function YourPage() {
  const data = await getServiceData();
  return <div>{/* 使用 shadcn 组件 */}</div>;
}
```

**客户端组件**：
```typescript
'use client';

import { useState } from 'react';

export default function YourComponent() {
  const [state, setState] = useState(null);
  // ... 交互逻辑
}
```

### 添加数据库表

1. 在 `src/storage/database/shared/schema.ts` 中定义表结构
2. 运行 `pnpm drizzle-kit generate` 生成迁移
3. 运行 `pnpm drizzle-kit push` 执行迁移
4. 在 `src/lib/` 创建对应的服务文件

## 技术栈

- **框架**：Next.js 16.1.1 (App Router)
- **数据库**：PostgreSQL + Drizzle ORM
- **认证**：JWT + bcrypt + httpOnly cookies
- **UI**：shadcn/ui + Tailwind CSS v4
- **部署**：Vercel（标准 Next.js 部署）
- **包管理**：pnpm 9+（强制）

## 重要注意事项

1. **必须使用 pnpm**：`preinstall` 钩子会强制检查
2. **构建时需要假 DATABASE_URL**：在 `vercel.json` 和 `package.json` 的 build 脚本中已配置
3. **业务逻辑在服务层**：不要在 API 路由中直接操作数据库
4. **Schema 是单一事实来源**：所有表结构定义在 `schema.ts`
5. **标准 Next.js 部署**：可以正常使用 `next dev`、`next build`、`next start`
6. **Vercel 环境变量**：需要在 Build 和 Production 环境分别配置 `DATABASE_URL`

## 调试技巧

### 本地开发

```bash
# 启动开发服务器（端口 3000）
pnpm dev

# 查看数据库连接
echo $DATABASE_URL

# 测试 API 路由
curl http://localhost:3000/api/leaderboard
```

### 构建调试

```bash
# 清理缓存后构建
rm -rf .next && pnpm build

# 查看构建日志
pnpm build 2>&1 | tee build.log

# 检查 TypeScript 类型
pnpm ts-check
```

### 常见错误

**"Cannot find module"**：
- 运行 `pnpm install` 确保依赖完整
- 检查是否使用了正确的包管理器（pnpm）

**"DATABASE_URL is not set"**：
- 检查 `.env.local` 或环境变量
- 确认构建脚本包含假 `DATABASE_URL`

**"Module not found"错误**：
- 确保所有构建依赖在 `dependencies`（不在 `devDependencies`）
- 运行 `pnpm install` 确保依赖完整

## Vercel 部署完整配置

### 环境变量配置

在 Vercel Dashboard → Project Settings → Environment Variables 中添加：

**Build 环境**（构建时使用）：
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://fake:fake@localhost:5432/fake`
- **Environment**: **Build** ✅ (只勾选 Build)
- **说明**：避免 Next.js 16 在构建时预渲染 API 路由失败

**Production 环境**（运行时使用）：
- **Name**: `DATABASE_URL`
- **Value**: `(真实的 PostgreSQL 数据库连接字符串)`
- **Environment**: **Production** ✅ (只勾选 Production)
- **说明**：应用运行时使用的真实数据库

**其他必需的环境变量**（Production）：
- `JWT_SECRET`: JWT 签名密钥
- 其他业务相关的环境变量

### vercel.json 配置

项目根目录包含 `vercel.json` 配置文件：

```json
{
  "buildCommand": "DATABASE_URL=\"postgresql://fake:fake@localhost:5432/fake\" pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "nodeVersion": "20.x"
}
```

### 部署检查清单

在部署到 Vercel 前，确保：

- [ ] `.nvmrc` 文件存在（锁定 Node.js 20.x）
- [ ] `vercel.json` 配置正确
- [ ] `package.json` 的 build 脚本包含假 `DATABASE_URL`
- [ ] 所有构建依赖在 `dependencies`（不在 `devDependencies`）
- [ ] `.npmrc` 不包含禁用完整性校验的配置
- [ ] 本地构建成功：`pnpm build`
- [ ] Vercel Dashboard 中已配置 Build 和 Production 环境变量
