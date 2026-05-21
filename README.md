# AI Studio Plugin v0.1

Pascal Editor 的 AI 效果图生成插件。通过截图 + 选项 → 生成提示词 → AI 文生图大模型 → 画廊展示。

## 功能

- 📷 **截图** — 一键截取 3D 视口作为参考图
- 📁 **上传** — 支持本地图片上传
- 🎨 **多维度选项** — 景观视角/风格/内部/内墙方案/灯光/效果风格
- 🤖 **AI 生图** — 通过 OpenRouter 调用 Gemini 2.5 Flash Image
- 🖼️ **画廊** — 生成效果图展示、点击放大、下载保存
- ⚡ **实时计时** — 生成过程中显示耗时

## 架构

```
截图/上传 → base64 → POST /api/render → OpenRouter API
                                          ↓
                                    Gemini 2.5 Flash Image
                                          ↓
                                    返回 base64 图片
                                          ↓
                                    画廊展示/放大/保存
```

## 安装

```bash
# 1. 克隆 Pascal Editor
git clone https://github.com/pascalorg/editor.git
cd editor
git checkout 251af2c
bun install

# 2. 复制插件文件
cp src/components/chat/studio-panel.tsx apps/editor/components/chat/
mkdir -p apps/editor/app/api/render
cp src/app/api/render/route.ts apps/editor/app/api/render/

# 3. 确认侧边栏已有 studio 标签（通常已在 ai-chat-plugin 或 bim-editor 中配置）

# 4. 启动
cd apps/editor && npx next dev --port 3020
```

## 选项面板

| 分类 | 选项 | 默认值 |
|------|------|:---:|
| **景观视角** | 等距 / 内部 / 鸟瞰 / 平面图 / 仅结构 | 等距 |
| **风格** | 写实照片 / 草图蓝图 / 单元格着色 / 水彩画 | 写实 |
| **内部** | 带家具 / 仅房屋 | 带家具 |
| **内墙方案** | 白墙 / 配色 / 壁纸 / 面漆护墙 / 木作 | 白墙 |
| **灯光与氛围** | 白昼 / 晚霞时刻 / 夜晚 / 阴天 | 白昼 |
| **效果风格** | 现代自然 / 现代简约 / 极简主义 / 轻奢暖调 / 现代奢侈 / 中世纪自然 / 奶油极简 / 法式奶油 / 工业风格 / 侘寂风格 | 现代自然 |

## API 配置

API 已内置 OpenRouter + Gemini 2.5 Flash Image 配置。如需更换模型，编辑 `src/app/api/render/route.ts`：

```ts
const API_KEY = 'your-key'
const MODEL = 'your-model'
```

## 依赖

- Pascal Editor (@251af2c 或 bim-editor)
- OpenRouter API Key（已内置）

## 许可证

MIT
