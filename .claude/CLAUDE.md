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
