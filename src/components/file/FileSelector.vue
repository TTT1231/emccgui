<script setup lang="ts">
import { ref, computed, onUnmounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCompileStore } from '@/stores/useCompileStore'
import { EditorView, keymap, lineNumbers, highlightActiveLine,
  highlightActiveLineGutter, drawSelection, dropCursor,
  rectangularSelection, crosshairCursor, highlightSpecialChars } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import {
  defaultHighlightStyle, syntaxHighlighting, indentOnInput,
  bracketMatching, foldGutter, foldKeymap
} from '@codemirror/language'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'

const { t } = useI18n()
const store = useCompileStore()

const fileInput = ref<HTMLInputElement | null>(null)
const editorContainer = ref<HTMLElement | null>(null)
const fileContent = ref('')
const isDragging = ref(false)
const isDirty = ref(false)
const isSaving = ref(false)
const lineCount = ref(0)
// 保存成功短暂反馈
const savedFlash = ref(false)
// 保存原始内容用于对比
let savedContent = ''

// ===== 文件类型颜色映射 =====
const LANGUAGE_COLORS = {
  // C/C++ 系 - 蓝色系
  c: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'C' },
  cpp: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'C++' },
  cc: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'C++' },
  cxx: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'C++' },
  h: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'H' },
  hpp: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'H++' },
  hxx: { bg: 'rgba(66, 153, 225, 0.15)', color: '#4299e1', label: 'H++' },
  // Rust - 橙红色系
  rs: { bg: 'rgba(230, 126, 34, 0.15)', color: '#e67e22', label: 'RS' },
  // Go - 青色系
  go: { bg: 'rgba(26, 188, 156, 0.15)', color: '#1abc9c', label: 'GO' },
  // Java - 红色系
  java: { bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', label: 'JAVA' },
  // Python - 黄绿色系
  py: { bg: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f', label: 'PY' },
  // C# - 紫色系
  cs: { bg: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6', label: 'C#' },
} as const

// 获取文件类型样式
function getFileBadgeStyle(ext: string) {
  const style = LANGUAGE_COLORS[ext as keyof typeof LANGUAGE_COLORS]
  return {
    background: style?.bg || 'var(--accent-light)',
    color: style?.color || 'var(--accent)',
  }
}

// 获取文件类型标签文本
function getFileBadgeLabel(ext: string) {
  return LANGUAGE_COLORS[ext as keyof typeof LANGUAGE_COLORS]?.label || ext.toUpperCase()
}

let editorView: EditorView | null = null
const themeCompartment = new Compartment()

// WebAssembly 常用编译语言文件扩展名
// 参考: https://wasmlang.org/
const ACCEPTED_EXTS = new Set([
  // C / C++ (Emscripten)
  'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx',
  // Rust
  'rs',
  // Go (TinyGo)
  'go',
  // Java (TeVM, JWebAssembly)
  'java',
  // Python (Pyodide)
  'py',
  // C#
  'cs',
])

// ===== 主题色板 =====
const editorColors = computed(() => {
  const dark = store.theme === 'dark'
  return {
    // 编辑器本体
    editorBg:           dark ? '#1e1e2e' : '#ffffff',
    editorText:         dark ? '#cdd6f4' : '#1f1f1f',
    cursor:             dark ? '#aeafad' : '#000000',
    // Gutter（行号区）
    gutterBg:           dark ? '#181825' : '#f8f8f8',
    gutterBorder:       dark ? '#313244' : '#e8e8e8',
    lineNum:            dark ? '#45475a' : '#6f6f6f',
    activeLineNum:      dark ? '#cdd6f4' : '#1f1f1f',
    // 当前行
    activeLine:         dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.022)',
    // 选区
    selection:          dark ? 'rgba(99,102,241,0.30)' : 'rgba(173,214,255,0.60)',
    selectionFocused:   dark ? 'rgba(99,102,241,0.38)' : 'rgba(173,214,255,0.85)',
    // 括号匹配
    bracketBg:          dark ? 'rgba(100,255,130,0.15)' : 'rgba(0,180,80,0.12)',
    bracketBorder:      dark ? 'rgba(100,255,130,0.45)' : 'rgba(0,140,60,0.40)',
    // 折叠占位
    foldBg:             dark ? '#313244' : '#ebebeb',
    foldBorder:         dark ? '#45475a' : '#c8c8c8',
    foldColor:          dark ? '#7f849c' : '#6f6f6f',
    foldHoverBg:        dark ? '#45475a' : '#d4d4d4',
    // 折叠箭头悬停
    foldArrow:          dark ? '#7f849c' : '#9e9e9e',
    // 搜索高亮
    searchMatch:        dark ? 'rgba(234,179,8,0.30)' : 'rgba(234,179,8,0.35)',
    searchMatchSel:     dark ? 'rgba(234,179,8,0.55)' : 'rgba(234,179,8,0.65)',
    // 滚动条
    scrollThumb:        dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.20)',
    scrollThumbHover:   dark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.38)',
    // Header / 卡片边框
    headerBg:           dark ? '#181825' : '#f3f3f3',
    headerBorder:       dark ? '#313244' : '#e8e8e8',
    cardBorder:         dark ? '#313244' : '#e0e0e0',
    cardShadow:         dark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.10)',
  }
})

// ===== 自定义折叠 Gutter：VS Code 风格 SVG 三角箭头 =====
function makeFoldMarker(open: boolean): HTMLElement {
  const el = document.createElement('span')
  el.className = open ? 'cm-fold-open' : 'cm-fold-closed'
  el.title = open ? 'Collapse' : 'Expand'
  // open = 展开状态 → 向下箭头 (▼)，closed = 已折叠 → 向右箭头 (▶)
  el.innerHTML = open
    ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
    : `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M3.5 2 L6.5 5 L3.5 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  return el
}

// 组合 extensions（替代 basicSetup，以便注入自定义 foldGutter）
function buildExtensions(filename: string) {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter({ markerDOM: makeFoldMarker }),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
    getLanguageExtension(filename),
  ]
}

function getFileExt(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function getLanguageExtension(filename: string) {
  const ext = getFileExt(filename)

  // Rust
  if (ext === 'rs') return rust()

  // Python
  if (ext === 'py') return python()

  // Java
  if (ext === 'java') return java()

  // 其他语言使用 C++ 作为 fallback（C, C++, Go, C# 等）
  return cpp()
}

function initEditor(content: string, filename: string) {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }

  if (!editorContainer.value) return

  editorView = new EditorView({
    state: EditorState.create({
      doc: content,
      extensions: [
        buildExtensions(filename),
        themeCompartment.of(store.theme === 'dark' ? oneDark : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const current = update.state.doc.toString()
            isDirty.value = current !== savedContent
            lineCount.value = update.state.doc.lines
          }
        }),
      ],
    }),
    parent: editorContainer.value,
  })
}

async function processFile(file: File) {
  const ext = getFileExt(file.name)
  if (!ACCEPTED_EXTS.has(ext)) return

  try {
    const content = await file.text()
    fileContent.value = content
    savedContent = content
    isDirty.value = false
    lineCount.value = content.split('\n').length
    store.setSelectedFile({ name: file.name, path: file.webkitRelativePath || file.name })
    // 自动从源文件名派生输出文件名（去掉扩展名）
    const baseName = file.name.replace(/\.[^.]+$/, '')
    store.setOutputFileName(baseName)
    await nextTick()
    initEditor(content, file.name)
  } catch (error) {
    console.error('Failed to read file:', error)
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
    // 重置 input，允许重复选择同一个文件
    target.value = ''
  }
}

function clearFile() {
  store.setSelectedFile(null)
  fileContent.value = ''
  savedContent = ''
  isDirty.value = false
  if (fileInput.value) fileInput.value.value = ''
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
}

// ===== 保存逻辑 =====
async function saveFile() {
  if (!editorView || !store.selectedFile || isSaving.value) return
  isSaving.value = true

  const content = editorView.state.doc.toString()
  const filename = store.selectedFile.name
  const mimeType = 'text/plain'

  try {
    // 优先使用 File System Access API（Chrome/Edge 支持，可直接写回磁盘）
    if ('showSaveFilePicker' in window) {
      const ext = getFileExt(filename)
      const handle = await (window as Window & typeof globalThis & {
        showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle>
      }).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Source File',
          accept: { [mimeType]: [`.${ext}`] },
        }],
      })
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
    } else {
      // 降级：触发浏览器下载
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }

    // 保存成功后更新基准内容
    savedContent = content
    isDirty.value = false
    savedFlash.value = true
    setTimeout(() => { savedFlash.value = false }, 1500)
  } catch (err: unknown) {
    // 用户取消 showSaveFilePicker 时 err.name === 'AbortError'，静默处理
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Save failed:', err)
    }
  } finally {
    isSaving.value = false
  }
}

// ===== 组件级拖放：仅在 FileSelector 区域内生效 =====
function handleDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault()
    isDragging.value = true
  }
}

function handleDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  // relatedTarget 超出组件范围才消除
  if (!target.contains(event.relatedTarget as Node)) {
    isDragging.value = false
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) processFile(file)
}

// Ctrl+S / Cmd+S 快捷键
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (isDirty.value) saveFile()
  }
}

watch(
  () => store.theme,
  (newTheme) => {
    if (!editorView) return
    editorView.dispatch({
      effects: themeCompartment.reconfigure(newTheme === 'dark' ? oneDark : []),
    })
  }
)

// keep-alive 每次激活（含首次挂载）时注册快捷键
onActivated(() => {
  window.addEventListener('keydown', handleKeydown)
})

// keep-alive 休眠时取消，避免在其他标签页仍触发
onDeactivated(() => {
  window.removeEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})
</script>

<template>
  <div
    class="file-selector"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >

    <!-- ===== 组件级拖放覆盖层（唯一）===== -->
    <Transition name="drop-fade">
      <div v-if="isDragging" class="drop-overlay">
        <div class="drop-overlay__box">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
            <path d="M12 12v6"/>
            <path d="m9 15 3-3 3 3"/>
          </svg>
          <span class="drop-overlay__title">{{ store.selectedFile ? t('fileSelector.dropReplace') : t('fileSelector.dropOpen') }}</span>
          <span class="drop-overlay__hint">{{ t('fileSelector.dropHint') }}</span>
        </div>
      </div>
    </Transition>

    <!-- ===== 无文件：上传区 ===== -->
    <template v-if="!store.selectedFile">
      <!-- 隐藏 input，统一由 js 触发 -->
      <input
        ref="fileInput"
        type="file"
        class="file-input-hidden"
        accept=".c,.cpp,.cc,.cxx,.h,.hpp,.hxx,.rs,.go,.java,.py,.cs"
        @change="handleFileSelect"
      />

      <!-- 居中布局容器 -->
      <div class="empty-state">
        <!-- 主上传区 -->
        <div
          class="upload-card"
          :class="{ 'upload-card--active': isDragging }"
          @click="fileInput?.click()"
        >
          <div class="drop-zone__icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
              <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
              <path d="M12 12v6"/>
              <path d="m9 15 3-3 3 3"/>
            </svg>
          </div>
          <p class="drop-zone__title">{{ t('fileSelector.dragOrClick', { click: '' }) }}<span class="drop-zone__link">{{ t('fileSelector.clickToSelect') }}</span></p>
          <p class="drop-zone__hint">{{ t('fileSelector.supportedLangs') }}</p>
        </div>

        <!-- 使用步骤 -->
        <div class="steps">
          <div class="step">
            <span class="step-num">1</span>
            <span class="step-text">{{ t('fileSelector.step1') }}</span>
          </div>
          <div class="step-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <span class="step-text">{{ t('fileSelector.step2') }}</span>
          </div>
          <div class="step-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <div class="step">
            <span class="step-num">3</span>
            <span class="step-text">{{ t('fileSelector.step3') }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 有文件：统一编辑器卡片 ===== -->
    <div
      v-else
      class="editor-card"
    >
      <!-- 隐藏 input，换文件按钮触发 -->
      <input
        ref="fileInput"
        type="file"
        class="file-input-hidden"
        accept=".c,.cpp,.cc,.cxx,.h,.hpp,.hxx,.rs,.go,.java,.py,.cs"
        @change="handleFileSelect"
      />

      <!-- 主标题行 -->
      <div class="editor-header">
        <div class="editor-header__left">
          <span class="dirty-dot" :class="{ 'dirty-dot--visible': isDirty }" :title="t('fileSelector.unsavedChanges')">●</span>
          <span
            class="file-badge"
            :style="getFileBadgeStyle(getFileExt(store.selectedFile!.name))"
          >{{ getFileBadgeLabel(getFileExt(store.selectedFile!.name)) }}</span>
          <svg class="code-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span class="file-name" :class="{ 'file-name--dirty': isDirty }">{{ store.selectedFile?.name }}</span>
        </div>
        <div class="editor-header__right">
          <span class="line-count">{{ lineCount }} {{ t('fileSelector.lines') }}</span>

          <!-- Save Button -->
          <button
            class="save-btn"
            :class="{ 'save-btn--dirty': isDirty, 'save-btn--saved': savedFlash }"
            :disabled="!isDirty && !savedFlash"
            :title="t('fileSelector.saveTooltip')"
            @click="saveFile"
          >
            <svg v-if="!savedFlash" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{{ savedFlash ? t('fileSelector.saved') : t('fileSelector.save') }}</span>
          </button>

          <!-- Change File -->
          <button class="icon-btn" :title="t('fileSelector.reselectTooltip')" @click="fileInput?.click()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>

          <!-- Close -->
          <button class="icon-btn icon-btn--danger" :title="t('fileSelector.removeTooltip')" @click="clearFile">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 输出文件名栏 -->
      <div class="output-bar">
        <svg class="output-bar__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
        </svg>
        <span class="output-bar__label">{{ t('fileSelector.outputLabel') }}</span>
        <div class="output-bar__input">
          <input
            :value="store.outputFileName"
            type="text"
            class="output-bar__field"
            :placeholder="t('fileSelector.outputPlaceholder')"
            spellcheck="false"
            @input="store.setOutputFileName(($event.target as HTMLInputElement).value)"
          />
          <span class="output-bar__suffix">{{ store.outputFormat === 'wasm-only' ? '.wasm' : '.js' }}</span>
        </div>
      </div>

      <!-- 代码编辑器 -->
      <div ref="editorContainer" class="editor-container" />
    </div>

  </div>
</template>

<style lang="scss" scoped>
.file-selector {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

// ===== 隐藏 file input =====
.file-input-hidden {
  display: none;
}

// ===== 无文件：居中容器 =====
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 0;
}

// ===== 无文件：上传卡 =====
.upload-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 520px;
  padding: 44px 24px;
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--accent);
    background: var(--accent-light);

    .drop-zone__icon { color: var(--accent); }
  }

  &--active {
    border-color: var(--accent);
    border-style: solid;
    background: var(--accent-light);

    .drop-zone__icon { color: var(--accent); }
  }
}

.drop-zone__icon {
  color: var(--text-muted);
  transition: color 0.2s;
  margin-bottom: 4px;
}

.drop-zone__title {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.drop-zone__link {
  color: var(--accent);
  font-weight: 500;
}

.drop-zone__hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  letter-spacing: 0.01em;
}

// ===== 输出文件名（无文件时，内嵌于 meta-card）=====
.meta-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 14px 20px;
  margin-bottom: 12px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.input-with-suffix {
  flex: 1;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: var(--bg-input, var(--bg-tertiary));
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color 0.25s, box-shadow 0.25s;

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  }
}

.field-input {
  flex: 1;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
}

.input-suffix {
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-tertiary));
  border-left: 1px solid var(--border);
}

// ===== 使用步骤 =====
.steps {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.step-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}

// ===== 使用说明（无文件时）=====
.instructions-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
}

.instructions-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.instructions-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.9;

  li + li { margin-top: 2px; }
}

// ===== 有文件：统一编辑器卡片 =====
.editor-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid v-bind('editorColors.cardBorder');
  box-shadow: v-bind('editorColors.cardShadow');
}

// ===== 组件级拖放遮罩（单一，覆盖整个 FileSelector）=====
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  backdrop-filter: blur(2px);
  border-radius: var(--radius-lg);
  border: 2px solid var(--accent);
  pointer-events: none; // 让 drop 事件透传到根 div 的监听器

  &__box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 52px;
    background: var(--bg-secondary);
    border: 1.5px solid var(--accent);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 36px rgba(0, 0, 0, 0.16);
    color: var(--accent);
    pointer-events: none;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
  }

  &__hint {
    font-size: 12px;
    color: var(--text-muted);
  }
}

// 覆盖层淡入淡出
.drop-fade-enter-active,
.drop-fade-leave-active {
  transition: opacity 0.15s ease;
}
.drop-fade-enter-from,
.drop-fade-leave-to {
  opacity: 0;
}

// 主标题行
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 8px 14px;
  background: v-bind('editorColors.headerBg');
  border-bottom: 1px solid v-bind('editorColors.headerBorder');
  gap: 12px;

  &__left {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    flex: 1;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
}

.file-badge {
  flex-shrink: 0;
  padding: 2px 7px;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
}

.code-icon {
  color: var(--accent);
  flex-shrink: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-mono);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--dirty { color: var(--text-secondary); }
}

.dirty-dot {
  font-size: 15px;
  line-height: 1;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  flex-shrink: 0;

  &--visible {
    opacity: 1;
    color: #e8c66a;
  }
}

.line-count {
  font-size: 12px;
  color: var(--text-muted);
  padding-right: 4px;
}

// 保存按钮
.save-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: not-allowed;
  transition: all 0.15s;
  white-space: nowrap;

  svg { flex-shrink: 0; }

  &--dirty {
    border-color: var(--accent);
    color: var(--accent);
    cursor: pointer;
    background: color-mix(in srgb, var(--accent) 8%, transparent);

    &:hover { background: color-mix(in srgb, var(--accent) 18%, transparent); }
    &:active { transform: scale(0.97); }
  }

  &--saved {
    border-color: var(--success);
    color: var(--success);
    background: color-mix(in srgb, var(--success) 10%, transparent);
    cursor: default;
  }
}

// 图标按钮（换文件 / 关闭）
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  &--danger:hover {
    background: var(--error);
    border-color: var(--error);
    color: white;
  }
}

// 输出文件名栏
.output-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: v-bind('editorColors.headerBg');
  border-bottom: 1px solid v-bind('editorColors.headerBorder');

  &__icon {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__input {
    display: flex;
    align-items: stretch;
    overflow: hidden;
    background: var(--bg-input, var(--bg-tertiary));
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 220px;

    &:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
    }
  }

  &__field {
    flex: 1;
    padding: 4px 10px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-primary);
    background: transparent;
    border: none;
    outline: none;
    min-width: 0;

    &::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }
  }

  &__suffix {
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    border-left: 1px solid var(--border);
  }
}

// ===== CodeMirror 编辑器 =====
.editor-container {
  height: 680px;
  overflow: hidden;

  :deep(.cm-editor) {
    height: 100%;
    font-family: var(--font-mono);
    font-size: 13.5px;
    line-height: 1.6;
    background: v-bind('editorColors.editorBg');
    color: v-bind('editorColors.editorText');
    border-radius: 0;
    &.cm-focused { outline: none; }
  }

  :deep(.cm-scroller) {
    overflow: auto !important;
    height: 100%;
    font-family: inherit;
    &::-webkit-scrollbar { width: 8px; height: 8px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
      background: v-bind('editorColors.scrollThumb');
      border-radius: 4px;
      &:hover { background: v-bind('editorColors.scrollThumbHover'); }
    }
  }

  :deep(.cm-content) {
    padding: 6px 0 16px;
    caret-color: v-bind('editorColors.cursor');
  }

  :deep(.cm-gutters) {
    background: v-bind('editorColors.gutterBg');
    border-right: 1px solid v-bind('editorColors.gutterBorder');
    color: v-bind('editorColors.lineNum');
    user-select: none;
    padding: 0;
  }

  :deep(.cm-lineNumbers) {
    min-width: 42px;
    .cm-gutterElement {
      padding: 0 10px 0 6px;
      font-size: 12px;
      line-height: inherit;
      color: v-bind('editorColors.lineNum');
      transition: color 0.1s;
    }
  }

  :deep(.cm-activeLineGutter) {
    background: transparent;
    color: v-bind('editorColors.activeLineNum') !important;
  }

  :deep(.cm-activeLine) {
    background: v-bind('editorColors.activeLine');
  }

  :deep(.cm-foldGutter) {
    width: 18px;
    .cm-gutterElement {
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      line-height: inherit;
    }
  }

  :deep(.cm-fold-open),
  :deep(.cm-fold-closed) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: transparent;
    transition: color 0.12s, background 0.12s;
    flex-shrink: 0;
  }

  :deep(.cm-gutters:hover .cm-fold-open) {
    color: v-bind('editorColors.foldArrow');
  }

  :deep(.cm-gutterElement:hover .cm-fold-open) {
    background: v-bind('editorColors.activeLine');
  }

  :deep(.cm-fold-closed) {
    color: v-bind('editorColors.foldArrow');
  }
  :deep(.cm-fold-closed:hover) {
    background: v-bind('editorColors.activeLine');
  }

  :deep(.cm-foldPlaceholder) {
    background: v-bind('editorColors.foldBg');
    border: 1px solid v-bind('editorColors.foldBorder');
    border-radius: 3px;
    color: v-bind('editorColors.foldColor');
    padding: 0 6px;
    font-size: 11px;
    cursor: pointer;
    transition: background 0.1s;
    &:hover { background: v-bind('editorColors.foldHoverBg'); }
  }

  :deep(.cm-selectionBackground) {
    background: v-bind('editorColors.selection') !important;
  }

  :deep(.cm-focused .cm-selectionBackground) {
    background: v-bind('editorColors.selectionFocused') !important;
  }

  :deep(.cm-searchMatch) {
    background: v-bind('editorColors.searchMatch');
    border-radius: 2px;
  }

  :deep(.cm-searchMatch-selected) {
    background: v-bind('editorColors.searchMatchSel');
  }

  :deep(.cm-matchingBracket) {
    background: v-bind('editorColors.bracketBg');
    outline: 1px solid v-bind('editorColors.bracketBorder');
    border-radius: 2px;
  }

  :deep(.cm-line) { padding-left: 4px; }

  :deep(.cm-cursor) {
    border-left: 2px solid v-bind('editorColors.cursor');
  }
}
</style>
