# tab-mama

<img src="public/icons/icon-128.png" width="96" alt="tab-mama icon"/>

[![CI](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml/badge.svg)](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml)
[![prek](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/j178/prek/master/docs/assets/badge-v0.json)](https://github.com/j178/prek)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/smith-30/tab-mama/badge)](https://securityscorecards.dev/viewer/?uri=github.com/smith-30/tab-mama)
[![dist size](https://img.shields.io/endpoint?url=https://smith-30.github.io/tab-mama/badges/dist-size.json)](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml)

[English](README.md) | [日本語](README.ja.md)

自动管理 Chrome 标签页的扩展程序(Manifest V3)。

## 功能

- **闲置关闭** — 自动关闭在设定时间(默认 60 分钟)内未激活的标签页
- **重复关闭** — 当多个标签页 URL 相同时,关闭较旧的标签页(打开超过 10 分钟)并保留最新的
- **域名排序** — 每 5 分钟按主机名的字母顺序排列标签页;同一域名内,较早打开的排在前面

固定的标签页、当前激活的标签页和正在播放声音的标签页始终被排除。

## 设置

可从弹出窗口进行配置。设置值保存在 `chrome.storage.local` 中,重启后依然保留。

| 设置 | 默认值 | 范围 |
|---|---|---|
| 标签页上限(不含固定) | 10 个 | 1〜99 个 |
| 闲置阈值 | 60 分钟 | 10〜480 分钟(10 分钟为步长) |

当未固定的标签页数量等于或低于上限时,闲置关闭与重复关闭不会执行。

## 开发

### 环境准备

```bash
pnpm install
```

### 命令

| 命令 | 说明 |
|---|---|
| `pnpm test` | 运行单元测试(vitest) |
| `pnpm test:watch` | 以监视模式运行测试 |
| `pnpm lint` | 使用 oxlint 进行代码检查 |
| `pnpm lint:fix` | 自动修复代码检查问题 |
| `pnpm format` | 使用 oxfmt 格式化 |
| `pnpm format:check` | 仅检查格式 |
| `pnpm build` | 构建生产版本到 `dist/` |
| `pnpm dev` | 开发构建(HMR) |
| `pnpm dev:shot` | 隐藏开发用语言切换的开发服务器(用于截图) |

### 加载到 Chrome

1. 运行 `pnpm build`
2. 打开 `chrome://extensions`
3. 开启右上角的 **开发者模式**
4. 点击 **加载已解压的扩展程序**,选择 `dist/` 目录

## 架构

```
src/
├── config.ts           # 默认阈值常量
├── background/
│   └── index.ts        # Service Worker — 连接 alarm 与事件监听器
├── lib/                # 不依赖 Chrome API 的纯逻辑
│   ├── idle.ts         # 计算需按闲置关闭的标签页 ID
│   ├── dedup.ts        # 计算需按去重关闭的标签页 ID
│   ├── sort.ts         # 计算域名排序的移动方案
│   └── types.ts        # 共享类型定义
├── storage/
│   └── tabMeta.ts      # chrome.storage.local 封装(标签页元数据 / enabled 标志 / 设置值)
├── chrome/
│   └── tabs.ts         # chrome.tabs 与 chrome.alarms 的轻量封装
└── popup/
    ├── index.html
    ├── main.tsx
    └── App.tsx         # 电源开关 / 标签页数量 / 设置界面
tests/
├── idle.test.ts
├── dedup.test.ts
└── sort.test.ts
```

### 代码质量

| 工具 | 作用 |
|---|---|
| **oxlint** | 使用 TypeScript / React / unicorn 等规则集进行检查 |
| **oxfmt** | 兼容 Prettier 的格式化工具(`singleQuote` / `trailingComma: all` / `sortImports`) |
| **secretlint** | 提交前检查是否泄露密钥 |
| **prek** | 基于 Rust 的 pre-commit 钩子运行器 |

每次提交时按 `oxfmt --check` → `oxlint` → `secretlint` → `vitest` 的顺序自动执行。

### 应对 MV3 的限制

Service Worker 在闲置时会被销毁,因此无法使用 `setTimeout` 持有长时间计时器。为此:

- 将标签页的 `openedAt` / `lastActiveAt` / `url` 持久化到 `chrome.storage.local`
- 使用 `chrome.alarms` 定期唤醒以扫描和处理(即使 SW 被销毁也能通过 alarm 恢复)
- 设置值(标签页上限、闲置阈值)同样保存在 `chrome.storage.local` 中,alarm 处理器每次读取
