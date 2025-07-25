# ChatUI Demo

一个基于 Next.js 和 @chatui/core 构建的现代化聊天界面演示项目，支持打字效果和 Markdown 渲染。

## ✨ 特性

- 🎯 **现代化UI设计** - 基于 @chatui/core 的美观聊天界面
- ⌨️ **打字效果** - AI回复支持逐字显示的打字动画
- 📝 **Markdown支持** - 完整支持Markdown格式渲染
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **自定义样式** - 精心设计的渐变背景和组件样式
- ⚡ **高性能** - 基于Next.js 14构建，支持SSR

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm、yarn、pnpm 或 bun

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 🛠️ 技术栈

- **框架**: Next.js 14
- **UI组件**: @chatui/core
- **样式**: Tailwind CSS + 自定义CSS
- **Markdown**: react-markdown + remark-gfm
- **语言**: TypeScript
- **包管理**: npm

## 📁 项目结构

```
chatUI-demo/
├── app/
│   ├── components/
│   │   ├── ChatUI.tsx          # 主聊天组件
│   │   └── ChatUICore.tsx      # 核心聊天逻辑
│   ├── globals.css             # 全局样式
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页
├── public/                     # 静态资源
├── .gitignore                  # Git忽略文件
├── next.config.js              # Next.js配置
├── package.json                # 项目依赖
├── tailwind.config.js          # Tailwind配置
└── tsconfig.json               # TypeScript配置
```

## 🎨 功能演示

### 打字效果
- AI回复支持逐字显示动画
- 可配置打字速度和显示字符数
- 支持富文本内容的打字效果

### Markdown渲染
- 支持标题、列表、粗体、斜体等格式
- 自定义样式适配聊天界面
- 打字过程中实时渲染Markdown

### 响应式设计
- 桌面端：800px最大宽度，600px固定高度
- 平板端：95%视口宽度，500px高度
- 手机端：95%视口宽度，450px高度

## 🔧 自定义配置

### 修改打字效果参数

在 `app/components/ChatUICore.tsx` 中：

```typescript
<TypingBubble 
  options={{
    step: [2, 5],     // 每次显示2-5个字符
    interval: 50,     // 每50ms显示一次
    initialIndex: 0
  }}
/>
```

### 自定义样式

主要样式文件：`app/globals.css`
- 聊天容器样式：`.chat-container`
- Markdown样式：`.markdown-content`
- 打字气泡样式：`.typing-markdown`

## 📦 部署

### Vercel部署（推荐）

1. 将代码推送到GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动部署完成

### 其他平台

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [@chatui/core 文档](https://chatui.io/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
