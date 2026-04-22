# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI**: coze-coding-dev-sdk (LLM/TTS/ASR)
- **Auth**: JWT (jose) + bcrypt 密码加密

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/            # API 路由
│   │   │   ├── auth/       # 认证相关 API
│   │   │   │   ├── register/route.ts  # 用户注册
│   │   │   │   ├── login/route.ts     # 用户登录
│   │   │   │   ├── logout/route.ts    # 用户登出
│   │   │   │   └── me/route.ts        # 获取当前用户
│   │   │   ├── blog/       # 博客相关 API
│   │   │   │   ├── route.ts          # 获取文章列表
│   │   │   │   ├── migrate/route.ts  # 迁移初始文章
│   │   │   │   └── generate/route.ts # LLM 生成文章
│   │   │   └── game/       # 游戏相关 API
│   │   ├── blog/           # 博客页面
│   │   │   ├── page.tsx    # 文章列表页
│   │   │   └── [id]/page.tsx # 文章详情页
│   │   ├── login/          # 登录页面
│   │   │   └── page.tsx
│   │   └── register/       # 注册页面
│   │       └── page.tsx
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── components/BlogActions.tsx  # AI生成文章按钮
│   ├── components/UserMenu.tsx     # 用户菜单组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   ├── auth.ts         # 认证服务 (JWT/Cookie)
│   │   ├── blog-service.ts # 博客数据库操作服务
│   │   └── user-service.ts # 用户数据库操作服务
│   ├── storage/database/   # 数据库相关
│   │   ├── supabase-client.ts       # Supabase 客户端
│   │   └── shared/schema.ts         # 数据库 Schema
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 数据库

### 博客文章表 (blog_posts)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 主键，自增 |
| title | text | 文章标题 |
| summary | text | 文章摘要 |
| content | text | 文章内容 (Markdown) |
| author | text | 作者 |
| tags | text | 标签 (JSON数组字符串) |
| read_time | text | 阅读时间 |
| created_at | timestamptz | 创建时间 |

### 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 主键，自增 |
| username | varchar(50) | 用户名，唯一 |
| password | varchar(255) | 密码 (bcrypt哈希) |
| created_at | timestamptz | 注册时间 |

### 博客操作服务 (blog-service.ts)

- `getAllPosts()`: 获取所有文章
- `getPostById(id)`: 根据ID获取文章
- `createPost(post)`: 创建新文章
- `createPosts(posts)`: 批量创建文章

### 用户操作服务 (user-service.ts)

- `getUserByUsername(username)`: 根据用户名查找用户
- `getUserById(id)`: 根据ID查找用户
- `createUser(username, password)`: 创建用户（密码自动加密）
- `verifyPassword(plain, hashed)`: 验证密码
- `validateUser(username, password)`: 用户登录验证

### 认证服务 (auth.ts)

- `createToken(payload)`: 创建JWT Token
- `verifyToken(token)`: 验证JWT Token
- `setAuthCookie(token)`: 设置登录Cookie
- `getCurrentUser()`: 获取当前登录用户
- `clearAuthCookie()`: 清除登录Cookie
- `isAuthenticated()`: 检查是否已登录

## 认证API

| 接口 | 方法 | 功能 |
|------|------|------|
| /api/auth/register | POST | 用户注册 |
| /api/auth/login | POST | 用户登录 |
| /api/auth/logout | POST | 用户登出 |
| /api/auth/me | GET | 获取当前用户 |

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- **项目理解加速**：初始可以依赖项目下`package.json`文件理解项目类型，如果没有或无法理解退化成阅读其他文件。
- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。


## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**


