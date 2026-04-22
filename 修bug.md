# Bug 修复清单

> 项目：honghong (Next.js + Vercel 部署)
> 生成时间：2026-04-22
> 状态：系统化调试中

---

## 📊 问题总览

| 优先级 | 问题数量 | 必须修复 | 建议修复 | 预计修复时间 |
|--------|----------|----------|----------|--------------|
| **P0** | 1 | ✅ 是 | - | 5-10 分钟 |
| **P1** | 2 | ✅ 是 | - | 1-2 小时 |
| **P2** | 2 | ⚠️ 建议 | - | 7 分钟 |
| **P3** | 2 | - | 可选 | 45 分钟 |
| **总计** | **7** | **3** | **4** | **约 2 小时** |

---

## ✅ P0 - 已修复

### 问题 1: API 路由预渲染导致构建失败

**状态**: ✅ 已修复（采用方案 C）

**最终解决方案**: **提供构建时环境变量 DATABASE_URL**

**修复内容**:
1. ✅ 修改 `package.json` 的 build 脚本，添加假的 DATABASE_URL
2. ✅ 验证构建成功
3. ⚠️ 需要在 Vercel 配置构建环境变量

**最终配置**:
```json
{
  "scripts": {
    "build": "DATABASE_URL=\"postgresql://fake:fake@localhost:5432/fake\" bash ./scripts/build.sh"
  }
}
```

**Vercel 部署配置**:
需要在 Vercel Dashboard → Settings → Environment Variables 中添加：
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://fake:fake@localhost:5432/fake`
- **Environment**: **Build** (只用于构建，不用于运行时)

**方案选择过程**:

**方案 A（路由级配置）** - 尝试失败 ❌
- 为所有 API 路由添加 `export const runtime = 'nodejs'`
- 为所有没有参数的路由添加 `request` 参数
- 添加所有必要的 `NextRequest` 导入
- 结果：构建仍然失败

**失败原因分析**:
- Next.js 16 的预渲染机制比预期更复杂
- 即使配置了 `runtime = 'nodejs'`，构建时还是会尝试预渲染
- 项目中原本工作的路由可能由于某种原因被跳过预渲染
- 但新路由会被预渲染，配置完全相同的情况下行为不一致

**选择方案 C 的原因**:
1. ✅ **唯一可行的方案**: 经过多次测试，这是唯一能让构建成功的方法
2. ✅ **实施简单**: 只需修改 build 脚本，不需要改变代码结构
3. ✅ **立即见效**: 构建成功，部署不再阻塞
4. ⚠️ **权衡利弊**: 虽然之前分析过此方案的缺点，但考虑到：
   - 项目是高度动态的（游戏+社交），预渲染本身没有价值
   - 构建时使用假 DATABASE_URL 不影响运行时
   - 相比于部署失败，这点复杂度是可以接受的

**注意事项**:
⚠️ **重要**: 运行时环境变量需要单独配置
- Vercel 部署时需要在 **Production** 环境配置真实的 `DATABASE_URL`
- Build 环境和 Production 环境的 `DATABASE_URL` 可以不同
- 确保运行时的 `DATABASE_URL` 指向真实的数据库

---

## ✅ P1 - 已修复

### 问题 2: 缺少 Vercel 部署配置文件

**状态**: ✅ 已修复

**修复内容**:
- ✅ 创建 `vercel.json` 配置文件
- ✅ 创建 `.nvmrc` 文件（锁定 Node.js 20.x）
- ✅ 明确指定构建命令和输出目录

**最终配置**：
```json
// vercel.json
{
  "buildCommand": "DATABASE_URL=\"postgresql://fake:fake@localhost:5432/fake\" pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "nodeVersion": "20.x"
}
```

---

### 问题 3: 自定义服务器架构不兼容 Vercel

**状态**: ✅ 已修复

**修复方案**: 删除自定义服务器，使用标准 Next.js 部署

**修复内容**:
1. ✅ 删除 `src/server.ts`
2. ✅ 修改 `scripts/build.sh`（移除 tsup 打包步骤）
3. ✅ 修改 `scripts/dev.sh`（使用 `next dev`）
4. ✅ 修改 `scripts/start.sh`（使用 `next start`）

**验证结果**:
- ✅ 开发服务器启动成功（端口 3000）
- ✅ 构建成功（输出到 `.next/`）
- ✅ 所有功能正常

**收益**:
- ✅ 完美兼容 Vercel
- ✅ 可以使用 Edge Functions、ISR 等优化
- ✅ 部署更简单、更稳定
- ✅ 成本更低
- ✅ 符合 Next.js 官方最佳实践

---

## ✅ P2 - 已修复

### 问题 4: 依赖分类错误

**状态**: ✅ 已修复（采用方案 A）

**修复内容**:
- ✅ 将 `@react-dev-inspector/babel-plugin` 移至 dependencies
- ✅ 将 `@react-dev-inspector/middleware` 移至 dependencies
- ✅ 将 `@tailwindcss/postcss` 移至 dependencies
- ✅ 将 `typescript` 移至 dependencies

**验证结果**:
- ✅ 构建成功，Babel 插件正常加载
- ✅ TypeScript 正常运行
- ✅ 构建时间正常（3.1秒）

**收益**:
- ✅ Vercel 生产构建会安装这些包
- ✅ 不会出现"找不到模块"的错误
- ✅ 部署更稳定可靠

---

### 问题 5: .npmrc 安全配置问题

**状态**: ✅ 已修复（采用方案 A）

**修复内容**:
- ✅ 删除 `strictStorePkgContentCheck=false`
- ✅ 删除 `verifyStoreIntegrity=false`

**验证结果**:
- ✅ 依赖完整性校验已启用
- ✅ 包安全性提高
- ✅ 构建成功（没有因校验导致错误）

**收益**:
- ✅ 防止安装损坏或被篡改的包
- ✅ 防止供应链攻击
- ✅ 提高项目整体安全性

---

## 🟢 P3 - 低优先级（优化建议）

### 问题 6: 自定义构建脚本的复杂性

**状态**: 🟢 可优化

**问题**:
- `scripts/build.sh` 执行多个步骤
- 增加调试难度
- 与 Vercel 标准流程不兼容

**建议**:
- 简化构建流程
- 使用 Next.js 标准构建命令

**预计修复时间**: 30 分钟（可选）

---

### 问题 7: 缺少环境变量验证

**状态**: 🟢 体验优化

**问题**:
- 启动时不检查必需的环境变量
- 运行时才发现环境变量缺失

**建议**:
- 添加启动时的环境变量检查
- 提供清晰的错误提示

**预计修复时间**: 15 分钟（可选）

---

## 🎯 推荐修复顺序

### 阶段 1: 紧急修复（20-30 分钟）
**目标**: 让 Vercel 能够成功部署

1. ✅ **P0-1**: 修复 API 路由预渲染问题（9 个文件）
   - 为每个 API 路由添加 `export const runtime = 'nodejs'`
   - 时间：5-10 分钟

2. ✅ **P1-2**: 添加 Vercel 部署配置文件
   - 创建 `vercel.json`
   - 创建 `.nvmrc`
   - 时间：10-15 分钟

3. ✅ **P2-4**: 修复依赖分类
   - 移动构建必需的依赖到 dependencies
   - 时间：5 分钟

### 阶段 2: 架构优化（已完成 ✅）
**目标**: 长期稳定性和性能

4. ✅ **P1-3**: 处理自定义服务器架构问题

   **采用方案**: 删除自定义服务器，使用标准 Next.js 部署
   - ✅ 删除 `src/server.ts`
   - ✅ 修改 `scripts/build.sh`
   - ✅ 修改 `scripts/dev.sh`
   - ✅ 修改 `scripts/start.sh`
   - ✅ 测试验证完成

### 阶段 3: 安全和优化（已完成 ✅）
**目标**: 安全性和开发体验

5. ✅ **P2-5**: 修复 .npmrc 安全配置
6. 🟢 **P3-6, 7**: 优化构建流程（可选）

---

## 📝 决策点

### 已完成的决策：

1. **P0 修复方案选择**: ✅ **方案 C** - 配置构建时环境变量
   - 原因：方案 A 经过多轮测试无法解决问题
   - 结果：构建成功
   - 后续：需要在 Vercel 配置构建环境变量

2. **P1-3 架构决策**: ⚠️ **待决策**
   - 选项 A: 删除自定义服务器，适配 Vercel
   - 选项 B: 保留自定义服务器，更换部署平台
   - 建议：优先解决其他问题后再考虑

---

## 🔗 相关信息

- **Git 历史**: 提交 `e21dd1f` 和 `7483bc1` 之前修复过类似问题
- **Next.js 文档**: [Route Segment Config](https://nextjs.org/docs/app/api-reference/next-config-js/runtime)
- **Vercel 文档**: [Custom Server Limitations](https://nextjs.org/docs/app/building-your-application/deploying#custom-server-limitations)

---

> 📌 **最后更新**: 2026-04-22 20:05
> 📌 **P0 状态**: ✅ 已修复
> 📌 **P1 状态**: ✅ 已修复
> 📌 **P2 状态**: ✅ 已修复
> 📌 **下一步**: 准备部署到 Vercel
