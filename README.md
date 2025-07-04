# Next.js Chat UI - 打字气泡测试Demo

这是一个专注于测试打字气泡效果的简洁对话demo。

## 功能特性

- 💬 极简的对话界面
- ⌨️ **打字气泡效果** - 真实的逐字显示动画
- 🎯 专注于测试打字效果
- 📐 **固定尺寸对话框** - 800x600px 固定尺寸，带边框和阴影
- 📱 响应式设计

## 技术栈

- **框架**: Next.js 14
- **UI 库**: @chatui/core
- **语言**: TypeScript

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
├── app/
│   ├── components/
│   │   └── ChatUI.tsx          # 核心聊天组件
│   ├── globals.css             # 全局样式
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 主页
├── package.json
└── README.md
```

## 核心功能

### 打字气泡效果

用户发送消息后，AI会以打字气泡的形式逐字显示回复内容：

```typescript
// 打字气泡配置（优化后的快速版本）
<TypingBubble 
  content={typingContent}
  options={{
    step: [2, 5], // 每次显示2-5个字符（快速模式）
    interval: 50, // 每50ms显示一次（高速刷新）
    initialIndex: 0
  }}
/>
```

### 使用方式

1. 在输入框中输入任意消息
2. 点击发送或按回车
3. 观察AI回复的打字气泡效果
4. **打字气泡作为消息显示在聊天列表中**，而不是页面底部的浮层
5. **打字过程中显示富文本效果** - 可以看到 Markdown 格式的实时渲染
6. 每次发送消息都会在聊天列表中添加新的打字气泡消息

### 特性说明

- ✨ **逐字显示**: 模拟真实的打字效果
- 💬 **消息集成**: 打字气泡作为消息显示在聊天列表中
- 🎯 **自定义消息类型**: 使用 `type: 'typing'` 来区分打字消息
- 📝 **Markdown 支持**: AI回复支持 Markdown 格式（加粗、斜体、标题、列表等）
- 🎨 **富文本打字效果**: 打字过程中实时显示 Markdown 渲染效果
- ⚡ **双重渲染**: 使用 marked 库（打字气泡）+ react-markdown（普通消息）

## 自定义配置

### 修改AI回复内容

在 `generateAIResponse` 函数中修改回复文本数组。

### 调整打字速度

修改 `TypingBubble` 组件的 `options` 参数：
- `step`: 控制每次显示的字符数量
- `interval`: 控制显示间隔时间（毫秒）

### 调整延迟时间

修改 `setTimeout` 中的延迟计算公式：
```typescript
aiResponse.length * 80 + 2000 // 当前公式
```

## 许可证

MIT
