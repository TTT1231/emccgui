# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

**emccgui** 是一个使用 Electron 和 Vue.js 构建的桌面 GUI 应用程序，为 Emscripten (emcc) 编译器提供图形界面。它允许用户将 C/C++ 代码编译为 WebAssembly，无需手动编写复杂的命令行参数。

## 开发命令

```bash
# 启动开发服务器
pnpm start
# 或
pnpm run dev

# 打包应用程序
pnpm run package

# 构建安装程序 (Windows exe, macOS zip, Linux deb/rpm)
pnpm run make

# 发布到 GitHub Releases
pnpm run publish

# 代码检查
pnpm run lint

# 代码格式化
pnpm run format
```

## 架构

### Electron 多进程结构

应用程序遵循 Electron 的多进程架构，具有严格的安全边界：

- **主进程** ([`src/main/`](src/main/))：Node.js 环境，控制应用程序生命周期和系统交互
- **渲染进程** ([`src/renderer/`](src/renderer/))：Vue.js UI，在浏览器上下文中运行，无法直接访问 Node.js
- **预加载脚本** ([`src/preload/`](src/preload/))：使用 `contextBridge` 的安全桥接，暴露选择性 API

### 类型安全的 IPC 通信模式

应用程序使用**自定义 IPC 工厂模式**实现类型安全的进程间通信，主要解决字符串类型安全问题，防止写错导致的问题维护很麻烦。这是需要理解的最重要架构模式：

1. **接口定义**：所有 IPC 方法定义在 [`src/shared/types/ipc.d.ts`](src/shared/types/ipc.d.ts) 中，作为 `IElectronApi` 接口，包含不同控制组的嵌套接口（WindowControl、EmccControl 等）

2. **主进程注册** ([`src/main/ipc/index.ts`](src/main/ipc/index.ts))：

   ```typescript
   const ipcMain = createIpcMain<'IElectronApi', IElectronApi>();
   ipcMain.handle('IElectronApi-EmccControl-executeCommand', async (_, command, workDir) => {
      // 处理逻辑
   });
   ```

3. **预加载桥接** ([`src/preload/index.ts`](src/preload/index.ts))：
   - 使用 `createPreloadApi` 创建类型化的 IPC renderer
   - 通过 `contextBridge.exposeInMainWorld('electronApi', electronApi)` 暴露方法
   - 通道命名约定：`IElectronApi-{GroupName}-{methodName}`

4. **渲染进程使用**：通过 `window.electronApi` 访问，具有完整的 TypeScript 自动补全

**安全性**：启用上下文隔离，禁用 node 集成，所有原生访问通过类型化 IPC。

### 主要 IPC 控制组

- **WindowControl**：窗口操作（最小化、最大化、关闭、开发者工具）
- **EmccControl**：执行 emcc 命令、通过文件对话框选择文件
- **BrowserControl**：打开外部 URL
- **InternalControl**：版本信息、自动更新检查

### Vue.js 渲染进程结构

- **入口**：[`src/renderer/src/main.ts`](src/renderer/src/main.ts) 配置了 Vue Router
- **根组件**：[`src/renderer/App.vue`](src/renderer/App.vue) 包含主题管理
- **主要功能**：[`src/renderer/components/EmccCoding/`](src/renderer/components/EmccCoding/) - emcc 配置 UI
- **自定义 UI**：[`src/renderer/components/TitleBar/`](src/renderer/components/TitleBar/) - 自定义窗口边框

EmccCoding 组件包含完整的 emcc 选项配置，位于 [`src/renderer/components/EmccCoding/src/data.ts`](src/renderer/components/EmccCoding/src/data.ts)。

### 构建配置

**Electron Forge** ([`forge.config.ts`](forge.config.ts)) 管理构建过程：

- **VitePlugin**：编译 3 个独立的打包文件：
   - 主进程 (vite.main.config.ts)
   - 预加载脚本 (vite.preload.config.ts)
   - 渲染进程 (vite.renderer.config.ts)
- **Makers**：平台特定的安装程序（Windows 用 Squirrel，macOS 用 ZIP，Linux 用 Deb/RPM）
- **Publishers**：GitHub 发布自动化
- **FusesPlugin**：安全加固（禁用 node cli，启用 cookie 加密，ASAR 完整性验证）

**输出**：构建的应用程序位于 `out/` 目录。

## 技术栈

- **Electron 39.0.0**：桌面应用框架
- **Vue 3.5.26**：使用组合式 API 的 UI 框架
- **TypeScript 5.9.3**：所有进程的完整类型安全
- **Vite 7.3.0**：快速构建工具，支持 HMR
- **Ant Design Vue 4.2.6**：组件库
- **TailwindCSS 4.1.18**：原子化 CSS 框架

## 添加新的 IPC 方法

添加新的 IPC 通信时：

1. 在 [`src/shared/types/ipc.d.ts`](src/shared/types/ipc.d.ts) 中相应的控制组接口内定义方法签名
2. 在 [`src/main/ipc/index.ts`](src/main/ipc/index.ts) 中使用 `ipcMain` 工厂注册处理器
3. 在 [`src/preload/index.ts`](src/preload/index.ts) 中添加到预加载 API
4. 在渲染进程中通过 `window.electronApi.{GroupName}.{methodName}` 访问

通道名称必须遵循格式：`IElectronApi-{GroupName}-{methodName}`

## 文件组织

- `src/main/ipc/utils/`：IPC 工厂工具（内部实现细节）
- `src/shared/`：进程间共享的代码（类型、工具函数）
- `resources/`：应用程序资源和更新配置
- `scripts/`：构建和部署脚本

## 代码提交规范

本项目遵循**语义化提交（Conventional Commits）**规范，使用中文描述。

### 提交消息格式

```
<type>(<scope>): <subject>
```

**必填部分：**
- `type`: 提交类型
- `subject`: 简短描述（不超过 50 字符，中文，动词开头，首字母小写，结尾无标点）

**可选部分：**
- `scope`: 影响范围

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加 WASM 输出格式选择 |
| `fix` | 修复 Bug | fix: 修复 emcc 编译路径错误 |
| `docs` | 文档变更 | docs: 更新 README 安装说明 |
| `style` | 代码格式调整（不影响功能） | style: 格式化 TypeScript 代码 |
| `refactor` | 重构（既不是新功能也不是修复） | refactor: 优化 IPC 通信模块 |
| `perf` | 性能优化 | perf: 优化 Vite 构建速度 |
| `test` | 测试相关 | test: 添加 IPC 单元测试 |
| `build` | 构建系统或外部依赖变更 | build: 升级 Electron 到 39.0.0 |
| `ci` | CI 配置文件和脚本变更 | ci: 添加 GitHub Actions 工作流 |
| `chore` | 其他不修改 src 或测试文件的变更 | chore: 更新 .gitignore |
| `revert` | 回滚之前的提交 | revert: feat: 添加自定义标题栏 |

### Scope（影响范围）

常用的 scope 包括：
- `main`: 主进程
- `renderer`: 渲染进程
- `preload`: 预加载脚本
- `ipc`: IPC 通信
- `build`: 构建配置
- `ui`: UI 组件
- `deps`: 依赖管理

### 提交示例

**简单提交：**
```bash
feat: 添加深色主题切换功能
fix(renderer): 修复编译按钮状态未正确更新的问题
```

**带详细说明（多行）：**
```bash
refactor(ipc): 优化 IPC 通信错误处理机制

重构 IPC 调用的错误处理流程，统一使用 try-catch 包裹异步操作，
并添加详细的错误日志记录。

- 创建 IpcError 基类
- 在所有 IPC handler 中添加错误处理
- 更新渲染进程的错误显示逻辑
```

**带 Breaking Change：**
```bash
feat(main): 实现自动更新功能

BREAKING CHANGE: 应用程序现在需要访问 GitHub Releases 才能检查更新。
在离线环境中需要禁用自动更新功能。
```

### 提交前检查清单

- [ ] 提交类型符合规范
- [ ] Subject 以动词开头，首字母小写，结尾无标点
- [ ] Subject 不超过 50 字符
- [ ] Breaking Changes（如有）已在 footer 中说明
- [ ] 代码已通过 `pnpm run lint` 检查
- [ ] 代码已通过 `pnpm run format` 格式化

### 协作提交

当 Claude Code 协助提交代码时，会自动添加：
```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

**详细规范参考：** [`.claude/GIT_COMMIT_CONVENTION.md`](.claude/GIT_COMMIT_CONVENTION.md)
