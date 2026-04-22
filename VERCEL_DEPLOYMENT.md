# Vercel 部署配置指南

## 🔧 Vercel 环境变量配置

由于项目使用了自定义服务器架构，需要在 Vercel 配置特定的环境变量。

---

## 📋 必需的环境变量

### 1. 构建环境变量（Build Environment）

**用于构建时避免预渲染失败**：

| 变量名 | 值 | 环境 | 说明 |
|--------|-----|------|------|
| `DATABASE_URL` | `postgresql://fake:fake@localhost:5432/fake` | Build | 假的数据库连接字符串，仅用于构建时避免错误 |

**配置步骤**：
1. 进入 Vercel Dashboard
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加新变量：
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://fake:fake@localhost:5432/fake`
   - **Environment**: ✅ **Build** (只勾选 Build，不要勾选 Production 或 Preview)

---

### 2. 运行时环境变量（Production Environment）

**用于实际运行时连接数据库**：

| 变量名 | 值 | 环境 | 说明 |
|--------|-----|------|------|
| `DATABASE_URL` | 你的真实数据库连接字符串 | Production | PostgreSQL 数据库连接 |
| `JWT_SECRET` | 你的 JWT 密钥 | Production | 用于生成和验证 JWT Token |
| `COZE_API_KEY` | Coze API 密钥 | Production | Coze LLM 服务密钥 |
| 其他业务相关环境变量 | 相应的值 | Production | 根据项目需要添加 |

**配置步骤**：
1. 在 Environment Variables 页面
2. 添加 `DATABASE_URL`（真实的）：
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://user:password@host:port/database`
   - **Environment**: ✅ **Production** 和 ✅ **Preview** (不要勾选 Build)
3. 添加其他运行时环境变量

---

## ⚠️ 重要说明

### 为什么有两个 DATABASE_URL？

1. **Build 环境的 `DATABASE_URL`**：
   - 值：假的连接字符串
   - 用途：让 Next.js 构建时不会因为缺少数据库变量而失败
   - 不影响：运行时行为

2. **Production 环境的 `DATABASE_URL`**：
   - 值：真实的数据库连接字符串
   - 用途：应用运行时连接数据库
   - 影响：应用的所有数据库操作

**关键点**：
- Vercel 会根据环境选择使用哪个变量
- Build 时使用假的，避免构建失败
- 运行时使用真的，正常访问数据

---

## 🔨 构建配置

### Build Command

```bash
pnpm build
```

注意：`package.json` 中的 build 脚本已经包含了假的 `DATABASE_URL`：
```json
{
  "scripts": {
    "build": "DATABASE_URL=\"postgresql://fake:fake@localhost:5432/fake\" bash ./scripts/build.sh"
  }
}
```

### Output Directory

```
dist
```

### Install Command

```bash
pnpm install
```

---

## 🚀 部署步骤

### 首次部署

1. **连接 GitHub 仓库**
   - Vercel Dashboard → Import Project
   - 选择你的 GitHub 仓库
   - 选择 `honghong` 目录

2. **配置项目**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (或留空)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`

3. **配置环境变量**
   - 按照上面的说明配置 Build 和 Production 环境变量
   - 确保至少配置了 `DATABASE_URL`（两个环境）

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 访问分配的 Vercel URL

### 后续部署

每次推送代码到 `main` 分支，Vercel 会自动部署。

---

## 🐛 常见问题

### 构建失败：DATABASE_URL not set

**原因**：缺少 Build 环境的 `DATABASE_URL`

**解决**：
1. 检查 Environment Variables 中是否有 Build 环境的 `DATABASE_URL`
2. 确保只勾选了 Build，没有勾选 Production

---

### 运行时错误：数据库连接失败

**原因**：缺少或配置了错误的 Production 环境 `DATABASE_URL`

**解决**：
1. 检查 Environment Variables 中 Production 环境的 `DATABASE_URL`
2. 确保连接字符串格式正确
3. 确保数据库可访问（防火墙、白名单等）

---

### 部署成功但功能异常

**可能原因**：
1. 缺少其他运行时环境变量（JWT_SECRET, COZE_API_KEY 等）
2. 数据库迁移未执行
3. 自定义服务器配置问题

**解决**：
1. 检查所有必需的环境变量是否已配置
2. 在生产数据库执行迁移：`pnpm drizzle-kit push`
3. 检查 Vercel 部署日志

---

## 📚 相关文档

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Custom Server](https://nextjs.org/docs/app/building-your-application/deploying#custom-server)
- 项目的 `CLAUDE.md` - 项目架构说明
- 项目的 `修bug.md` - 已知问题和解决方案

---

> 📌 **最后更新**: 2026-04-22
> 📌 **维护者**: 项目团队
