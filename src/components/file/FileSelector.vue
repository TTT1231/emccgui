<script setup lang="ts">
import { ref } from 'vue'
import { useAppState } from '@/stores'

const { state, setSelectedFile, setOutputFileName } = useAppState()
const fileInput = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    setSelectedFile({
      name: file.name,
      path: (file as any).webkitRelativePath || file.name
    })
  }
}

function clearFile() {
  setSelectedFile(null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="file-selector">
    <div class="file-section">
      <h3 class="section-title">选择源文件</h3>

      <div class="file-input-wrapper">
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          accept=".c,.cpp,.cc,.cxx"
          @change="handleFileSelect"
        />
        <div class="file-input-btn">
          <span class="icon">📄</span>
          <span>点击选择 C/C++ 源文件</span>
        </div>
      </div>

      <!-- Selected File Display -->
      <div v-if="state.selectedFile" class="selected-file">
        <div class="file-info">
          <span class="file-icon">📄</span>
          <div class="file-details">
            <h4>{{ state.selectedFile.name }}</h4>
            <p class="path">{{ state.selectedFile.path }}</p>
          </div>
        </div>
        <button class="clear-file-btn" @click="clearFile">清除</button>
      </div>

      <!-- Output File Name -->
      <div class="output-section">
        <label class="output-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
          </svg>
          输出文件名
        </label>
        <div class="input-with-suffix">
          <input
            :value="state.outputFileName"
            type="text"
            class="field-input"
            placeholder="hello"
            spellcheck="false"
            @input="setOutputFileName(($event.target as HTMLInputElement).value)"
          />
          <span class="input-suffix">{{
            state.outputFormat === 'wasm-only' ? '.wasm' : '.js'
          }}</span>
        </div>
      </div>
    </div>

    <!-- Usage Instructions -->
    <div class="instructions-section">
      <h3 class="section-title">使用说明</h3>
      <div class="instructions">
        <p>1. 选择要编译的 C/C++ 源文件</p>
        <p>2. 在「编译」标签页配置编译选项</p>
        <p>3. 复制生成的 emcc 命令</p>
        <p>4. 在终端中运行命令进行编译</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-selector {
  max-width: 800px;
}

.file-section,
.instructions-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.file-input-wrapper {
  position: relative;
}

.file-input-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--bg-tertiary);
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.file-input-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.selected-file {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 24px;
}

.file-details h4 {
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.file-details .path {
  font-size: 12px;
  color: var(--text-muted);
  word-break: break-all;
}

.clear-file-btn {
  background: var(--error);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  transition: opacity 0.2s;
}

.clear-file-btn:hover {
  opacity: 0.8;
}

.instructions {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
}

.instructions p {
  margin-bottom: 8px;
}

/* ===== Output Section ===== */
.output-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.output-label {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.output-label:hover {
  color: var(--text-primary);
}

/* ===== Input with Suffix ===== */
.input-with-suffix {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all 0.25s ease;
}

.input-with-suffix:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
}

.input-with-suffix .field-input {
  flex: 1;
  padding: 12px 14px;
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-radius: 0;
  outline: none;
}

.input-with-suffix .field-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.input-suffix {
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-tertiary));
  border-left: 1px solid var(--border);
}
</style>
