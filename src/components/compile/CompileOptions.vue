<script lang="ts" setup>
import { ref } from 'vue'

import { useCompileStore } from '@/stores/useCompileStore'
import { optimizationLevels } from '@/data'
import SearchBtn from './SearchBtn.vue'

const store = useCompileStore()

// ===== Toast 通知状态 =====
const showToast = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

// 显示 Toast 通知
const showNotification = (message: string) => {
  toastMessage.value = message
  showToast.value = true

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 700)
}

// ===== 纯 UI tooltip 状态（仅此组件使用）=====
const activeTooltip = ref<string | null>(null)
const tooltipDirection = ref<'up' | 'down'>('down')
const tooltipPosition = ref({ left: '0px', top: '0px' })
let hideTooltipTimer: ReturnType<typeof setTimeout> | null = null

// 根据 key 获取编译选项（本地辅助）
const getOptionByKey = (key: string) => store.compileOptions.find(opt => opt.key === key)

// 获取单个选项的冲突原因（从 store activeConflicts 中查找）
const getConflictMessage = (optionKey: string): string | null =>
  store.activeConflicts.find(c => c.key === optionKey)?.reason ?? null

// Tooltip
const showTooltip = (name: string, event: MouseEvent) => {
  if (hideTooltipTimer) {
    clearTimeout(hideTooltipTimer)
    hideTooltipTimer = null
  }

  if (activeTooltip.value === name) return

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom

  tooltipDirection.value = spaceBelow < 80 ? 'up' : 'down'

  const TOOLTIP_MAX_W = 288
  const clampedLeft = Math.min(rect.left, window.innerWidth - TOOLTIP_MAX_W - 8)

  tooltipPosition.value = {
    left: `${Math.max(8, clampedLeft)}px`,
    top: tooltipDirection.value === 'down' ? `${rect.bottom + 8}px` : `${rect.top - 8}px`,
  }

  activeTooltip.value = name
}

const hideTooltip = () => {
  if (hideTooltipTimer) clearTimeout(hideTooltipTimer)
  hideTooltipTimer = setTimeout(() => {
    activeTooltip.value = null
    hideTooltipTimer = null
  }, 100)
}

// 命令处理
const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(store.fullCommand)
    showNotification('✓ 命令已复制到剪贴板')
  } catch (err) {
    showNotification('✕ 复制失败，请手动复制')
  }
}

const handleAddCompileOptions = (value: string) => {
  store.addCustomOption(value)
}

const handleRevokeCompileOptions = () => {
  store.revokeCustomOption()
}

// 自定义运行时方法
const customMethodInput = ref('')
const handleAddCustomMethod = () => {
  const name = customMethodInput.value.trim()
  if (!name) return
  store.addCustomRuntimeMethod(name)
  customMethodInput.value = ''
}
</script>

<template>
  <div class="emcc-container">
    <div class="main-content">
      <!-- 左侧：配置区域 -->
      <div class="config-panel">
        <!-- 编译选项卡片 -->
        <section class="config-card compile-options-card">
          <div class="card-header">
            <div class="card-header-icon compile-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m16 3 4 5-4 5"/>
                <path d="M20 8H4"/>
                <path d="m8 21-4-5 4-5"/>
                <path d="M4 16h16"/>
              </svg>
            </div>
            <h3 class="card-title">编译选项</h3>
            <span class="options-count">{{ store.enabledAvailableCount }}/{{ store.availableOptions.length }}</span>
            <!-- 冲突徽章 -->
            <span v-if="store.activeConflicts.length > 0" class="conflict-badge">⚠ {{ store.activeConflicts.length }}</span>
          </div>

          <div class="card-content">
            <!-- 冲突 Banner -->
            <Transition name="warning">
              <div v-if="store.activeConflicts.length > 0" class="conflict-alert">
                <div class="alert-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                    <line x1="12" x2="12" y1="9" y2="13"/>
                    <line x1="12" x2="12.01" y1="17" y2="17"/>
                  </svg>
                </div>
                <div class="alert-content">
                  <div class="alert-title">存在 {{ store.activeConflicts.length }} 个选项冲突</div>
                  <div class="alert-list">
                    <div v-for="conflict in store.activeConflicts" :key="conflict.key" class="alert-item">
                      <span class="alert-opt-name">{{ conflict.name }}</span>
                      <span class="alert-reason">{{ conflict.reason }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- 选项网格 -->
            <div class="options-grid">
              <label
                v-for="opt in store.availableOptions"
                :key="opt.key"
                class="option-chip"
                :class="{
                  disabled: opt.dependsOn && !getOptionByKey(opt.dependsOn)?.enabled,
                  conflicted: store.conflictedKeySet.has(opt.key),
                  active: opt.enabled,
                }"
                @mouseenter="showTooltip(opt.name, $event)"
                @mouseleave="hideTooltip"
              >
                <input
                  type="checkbox"
                  :checked="opt.enabled"
                  :disabled="!!(opt.dependsOn && !getOptionByKey(opt.dependsOn)?.enabled)"
                  @change="store.updateOption(opt.key, ($event.target as HTMLInputElement).checked)"
                />
                <span class="chip-indicator"></span>
                <span class="chip-label">{{ opt.name }}</span>

                <!-- Tooltip -->
                <Transition name="tooltip">
                  <div
                    v-if="activeTooltip === opt.name"
                    class="tooltip"
                    :class="[`tooltip-${tooltipDirection}`]"
                    :style="{ left: tooltipPosition.left, top: tooltipPosition.top }"
                  >
                    <div class="tooltip-content">
                      <span>{{ opt.hint }}</span>
                      <div v-if="store.conflictedKeySet.has(opt.key)" class="tooltip-conflict">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                          <line x1="12" x2="12" y1="9" y2="13"/>
                          <line x1="12" x2="12.01" y1="17" y2="17"/>
                        </svg>
                        <span>{{ getConflictMessage(opt.key) }}</span>
                      </div>
                    </div>
                    <div class="tooltip-arrow"></div>
                  </div>
                </Transition>
              </label>
            </div>

            <!-- 优化级别 - 下拉选择 -->
            <div class="dynamic-fields">
              <div class="form-field form-field-compact">
                <label class="field-label">优化级别</label>
                <select :value="store.optimizationLevel" class="field-select" @change="store.setOptimizationLevel(($event.target as HTMLSelectElement).value as any)">
                  <option
                    v-for="level in optimizationLevels"
                    :key="level.value"
                    :value="level.value"
                  >
                    {{ level.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 动态输入框 -->
            <div v-if="store.optionsWithInput.length > 0" class="dynamic-fields">
              <template v-for="opt in store.optionsWithInput" :key="opt.key + '-input'">
                <div class="form-field form-field-compact">
                  <label class="field-label">{{ opt.inputLabel || opt.name }}</label>
                  <input
                    :value="opt.currentValue"
                    type="text"
                    class="field-input"
                    :placeholder="opt.inputPlaceholder"
                    spellcheck="false"
                    @input="store.updateOptionValue(opt.key, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </template>
            </div>

            <!-- 动态下拉选择 -->
            <div v-if="store.optionsWithSelect.length > 0" class="dynamic-fields">
              <template v-for="opt in store.optionsWithSelect" :key="opt.key + '-select'">
                <div class="form-field form-field-compact">
                  <label class="field-label">{{ opt.name }}</label>
                  <select :value="opt.currentValue" class="field-select" @change="store.updateOptionValue(opt.key, ($event.target as HTMLSelectElement).value)">
                    <option
                      v-for="selectOpt in opt.selectOptions"
                      :key="selectOpt.value"
                      :value="selectOpt.value"
                    >
                      {{ selectOpt.label }}
                    </option>
                  </select>
                </div>
              </template>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：命令预览 -->
      <div class="preview-panel">
        <!-- 命令高亮显示 - 代码块风格 -->
        <div class="code-block">
          <div class="code-block-header">
            <span class="code-lang">emcc</span>
            <button class="copy-btn" @click="copyCommand" title="复制命令">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
          <div class="code-block-content">
            <div
              v-for="(line, index) in store.commandLines"
              :key="index"
              class="command-line"
              :class="[
                `line-${index % 2 === 0 ? 'even' : 'odd'}`,
                `line-type-${line.type}`,
                { 'line-runtime-methods': line.isRuntimeMethods },
                { 'line-custom': line.isCustom },
                { 'line-ref-contrib': line.isRefContrib },
              ]"
            >
              <span class="line-name">{{ line.name }}</span>
              <template v-if="line.value">
                <span v-if="line.type === 'flag'" class="line-eq">=</span>
                <span v-else class="line-space">&nbsp;</span>
                <!-- 运行时方法特殊显示 -->
                <template v-if="line.isRuntimeMethods && line.methods">
                  <span class="line-value methods-value"
                    ><template v-for="(method, idx) in line.methods" :key="method"
                      ><span class="method-item">{{ method }}</span
                      ><template v-if="idx < line.methods.length - 1"
                        >,</template
                      ></template
                    ></span
                  >
                </template>
                <span v-else class="line-value">{{ line.value }}</span>
              </template>
            </div>
          </div>
        </div>
        <SearchBtn
          :existing-commands="store.existingCommandNames"
          @handle-add="handleAddCompileOptions"
          @handle-revoke="handleRevokeCompileOptions"
        />
        <!-- 运行时方法 -->
        <section class="config-card methods-card">
          <div class="card-header">
            <div class="card-header-icon methods-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.29,7 12,12 20.71,7"/>
                <line x1="12" x2="12" y1="22" y2="12"/>
              </svg>
            </div>
            <h3 class="card-title">导出运行时方法</h3>
            <span class="options-count">{{ store.runtimeMethods.filter(m => m.enabled).length }}/{{ store.runtimeMethods.length }}</span>
          </div>

          <div class="card-content">
            <div class="methods-grid">
              <label
                v-for="method in store.runtimeMethods"
                :key="method.key"
                class="method-chip"
                :class="{
                  active: method.enabled,
                  conflicted: store.outputFormat === 'wasm-only',
                }"
                @mouseenter="showTooltip(method.name, $event)"
                @mouseleave="hideTooltip"
              >
                <input
                  type="checkbox"
                  :checked="method.enabled"
                  :disabled="store.outputFormat === 'wasm-only'"
                  @change="store.toggleRuntimeMethod(method.key)"
                />
                <span class="chip-indicator"></span>
                <span class="chip-label">{{ method.name }}</span>

                <!-- Tooltip -->
                <Transition name="tooltip">
                  <div
                    v-if="activeTooltip === method.name"
                    class="tooltip"
                    :class="'tooltip-' + tooltipDirection"
                    :style="{ left: tooltipPosition.left, top: tooltipPosition.top }"
                  >
                    <div class="tooltip-content">
                      <span>{{ method.hint }}</span>
                      <div v-if="store.outputFormat === 'wasm-only'" class="tooltip-conflict">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 16v-4"/>
                          <path d="M12 8h.01"/>
                        </svg>
                        <span>纯 WASM 模式不生成 JS glue 代码，此方法无效</span>
                      </div>
                    </div>
                    <div class="tooltip-arrow"></div>
                  </div>
                </Transition>
              </label>

              <!-- 自定义方法 chips -->
              <span
                v-for="name in store.customRuntimeMethods"
                :key="name"
                class="method-chip active custom-method-chip"
              >
                <span class="chip-indicator"></span>
                <span class="chip-label">{{ name }}</span>
                <button class="remove-method-btn" @click.stop="store.removeCustomRuntimeMethod(name)" title="移除">×</button>
              </span>
            </div>

            <!-- 自定义运行时方法输入 -->
            <div class="custom-method-input-row">
              <input
                v-model="customMethodInput"
                type="text"
                class="field-input custom-method-input"
                placeholder="输入方法名，如 UTF8ToString"
                spellcheck="false"
                @keydown.enter="handleAddCustomMethod"
              />
              <button
                class="add-method-btn"
                :disabled="!customMethodInput.trim()"
                @click="handleAddCustomMethod"
              >+</button>
            </div>
          </div>
        </section>

        <!-- 复制命令按钮 -->
        <button
          class="execute-btn copy-command-btn"
          @click="copyCommand"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span class="btn-text">复制命令</span>
        </button>

        <!-- Toast 通知 -->
        <Teleport to="body">
          <Transition name="toast">
            <div v-if="showToast" class="toast-notification">
              <svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span class="toast-message">{{ toastMessage }}</span>
            </div>
          </Transition>
        </Teleport>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emcc-container {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  padding: 24px;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: 24px;
  min-height: 0;
}

/* ===== 响应式断点 ===== */

/* 大屏（1600px+）：增大内间距，限制最大宽度防止过度拉伸 */
@media (min-width: 1600px) {
  .emcc-container {
    padding: 32px;
    max-width: 2000px;
    margin: 0 auto;
  }

  .main-content {
    gap: 32px;
  }
}

/* 小屏笔记本（900px - 1280px）：收紧 padding 和 gap */
@media (max-width: 1280px) {
  .emcc-container {
    padding: 16px;
  }

  .main-content {
    gap: 16px;
  }

  .card-header {
    padding: 12px 14px;
  }

  .card-content {
    padding: 12px;
  }
}

/* 平板横屏（768px - 900px）：单列布局，高度自适应滚动 */
@media (max-width: 900px) {
  .emcc-container {
    padding: 12px;
    max-height: none;
    overflow: auto;
  }

  .main-content {
    flex-direction: column;
    gap: 14px;
    min-height: min-content;
  }

  .config-panel,
  .preview-panel {
    overflow-y: visible;
    min-height: 0;
  }

  .config-card {
    flex: none;
  }

  .code-block {
    flex: none;
    min-height: 200px;
    max-height: 320px;
  }
}

/* 平板竖屏（600px - 768px）：进一步收缩字号和间距 */
@media (max-width: 768px) {
  .emcc-container {
    padding: 10px;
  }

  .main-content {
    gap: 12px;
  }

  .card-header {
    padding: 10px 12px;
  }

  .card-title {
    font-size: 0.9em;
  }

  .chip-label {
    font-size: 0.75em;
  }

  .option-chip {
    padding: 6px 10px;
  }

  .method-chip {
    padding: 5px 8px;
  }

  .field-input,
  .field-select {
    font-size: 0.85em;
    padding: 8px 10px;
  }

  .execute-btn {
    padding: 12px 16px;
    font-size: 0.9em;
  }
}

.config-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
}

.preview-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
}

/* ===== 统一滚动条样式（明暗主题自适应）===== */
.config-panel::-webkit-scrollbar,
.preview-panel::-webkit-scrollbar,
.card-content::-webkit-scrollbar,
.code-block-content::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.config-panel::-webkit-scrollbar-track,
.preview-panel::-webkit-scrollbar-track,
.card-content::-webkit-scrollbar-track,
.code-block-content::-webkit-scrollbar-track {
  background: transparent;
}

.config-panel::-webkit-scrollbar-thumb,
.preview-panel::-webkit-scrollbar-thumb,
.card-content::-webkit-scrollbar-thumb,
.code-block-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.config-panel::-webkit-scrollbar-thumb:hover,
.preview-panel::-webkit-scrollbar-thumb:hover,
.card-content::-webkit-scrollbar-thumb:hover,
.code-block-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ===== Config Cards ===== */
.config-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.config-card:hover {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}

.card-header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
  border-bottom: 1px solid var(--border);
}

.card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 8px;
}

.card-header-icon.compile-icon {
  color: #22c55e;
  background: color-mix(in srgb, #22c55e 15%, transparent);
}

.card-title {
  flex: 1;
  margin: 0;
  font-size: 0.95em;
  font-weight: 600;
  color: var(--text-primary);
}

.options-count {
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 0.75em;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 20px;
}

.conflict-badge {
  padding: 3px 8px;
  font-family: var(--font-mono);
  font-size: 0.72em;
  font-weight: 700;
  color: white;
  background: #ef4444;
  border-radius: 20px;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

.card-content {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

/* ===== Form Fields ===== */
.form-field {
  margin-bottom: 16px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field-compact {
  margin-bottom: 12px;
}

.field-label {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85em;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.field-label:hover {
  color: var(--text-primary);
}

.field-input,
.field-select {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.25s ease;
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
}

.field-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.field-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

/* ===== Input with Suffix ===== */
.input-with-suffix {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.25s ease;
}

.input-with-suffix:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
}

.input-with-suffix .field-input {
  flex: 1;
  border: none;
  border-radius: 0;
  background: transparent;
}

.input-with-suffix .field-input:focus {
  box-shadow: none;
}

.input-suffix {
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-family: var(--font-mono);
  font-size: 0.85em;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border-left: 1px solid var(--border);
}

/* ===== Options Grid ===== */
.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

/* ===== Option Chips ===== */
.option-chip {
  position: relative;
  z-index: 1;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.25s ease;
}

.option-chip:hover {
  z-index: 100;
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, var(--bg-primary));
}

.option-chip input {
  display: none;
}

.chip-indicator {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 4px;
  transition: all 0.25s ease;
}

.chip-indicator::after {
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  content: '';
  border: solid white;
  border-width: 0 2px 2px 0;
  border-radius: 1px;
  opacity: 0;
  transform: rotate(45deg) scale(0.8);
  transition: all 0.2s ease;
}

.option-chip.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-primary));
}

.option-chip.active .chip-indicator {
  background: var(--accent);
  border-color: var(--accent);
}

.option-chip.active .chip-indicator::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

.chip-label {
  font-family: var(--font-mono);
  font-size: 0.8em;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  user-select: none;
  transition: color 0.2s ease;
}

.option-chip.active .chip-label {
  color: var(--accent);
}

/* Disabled State */
.option-chip.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.option-chip.disabled:hover {
  border-color: var(--border);
  background: var(--bg-primary);
}

/* Conflicted State */
.option-chip.conflicted {
  background: color-mix(in srgb, #f59e0b 10%, var(--bg-primary));
  border-color: #f59e0b;
}

.option-chip.conflicted .chip-indicator {
  border-color: #f59e0b;
}

.option-chip.conflicted.active .chip-indicator {
  background: #f59e0b;
}

.option-chip.conflicted .chip-label {
  color: #d97706;
}

.option-chip.conflicted::after {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 0.65em;
  color: white;
  content: '!';
  background: #f59e0b;
  border-radius: 50%;
}

/* ===== Conflict Alert ===== */
.conflict-alert {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: color-mix(in srgb, #f59e0b 12%, var(--bg-secondary));
  border: 1px solid #f59e0b;
  border-radius: 10px;
  animation: alert-pulse 2s ease-in-out infinite;
}

@keyframes alert-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, #f59e0b 20%, transparent);
  }
  50% {
    box-shadow: 0 0 0 4px color-mix(in srgb, #f59e0b 10%, transparent);
  }
}

[data-theme='light'] .conflict-alert {
  background: color-mix(in srgb, #f59e0b 8%, #fff);
}

.alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #f59e0b;
  background: color-mix(in srgb, #f59e0b 20%, transparent);
  border-radius: 8px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  margin-bottom: 8px;
  font-size: 0.9em;
  font-weight: 600;
  color: #d97706;
}

[data-theme='light'] .alert-title {
  color: #b45309;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: color-mix(in srgb, #f59e0b 10%, transparent);
  border-radius: 6px;
}

.alert-opt-name {
  font-family: var(--font-mono);
  font-size: 0.8em;
  font-weight: 600;
  color: #d97706;
}

[data-theme='light'] .alert-opt-name {
  color: #b45309;
}

.alert-reason {
  font-size: 0.75em;
  color: var(--text-secondary);
}

/* ===== Dynamic Fields Section ===== */
.dynamic-fields {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px dashed var(--border);
}

.warning-enter-active,
.warning-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.warning-enter-from,
.warning-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.tooltip .tooltip-arrow {
  left: 20px;
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
}

.tooltip.tooltip-down .tooltip-arrow {
  top: -6px;
  border-bottom: 6px solid var(--tooltip-arrow-down);
}

.tooltip.tooltip-up .tooltip-arrow {
  bottom: -6px;
  border-top: 6px solid var(--tooltip-arrow-up);
}

.tooltip-content {
  padding: 8px 12px;
  font-size: 0.8em;
  line-height: 1.5;
  color: var(--tooltip-text);
  white-space: normal;
  max-width: 280px;
  width: max-content;
  background: var(--tooltip-bg);
  border: 1px solid var(--tooltip-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.tooltip-conflict {
  display: flex;
  gap: 5px;
  align-items: flex-start;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(245, 158, 11, 0.25);
  color: var(--warning-emphasis);
  font-size: 0.95em;
  white-space: normal;
  max-width: 240px;
  line-height: 1.4;
}

.tooltip-conflict svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--warning);
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

.tooltip-down.tooltip-enter-from,
.tooltip-down.tooltip-leave-to {
  transform: translateY(-8px);
}

.tooltip-up.tooltip-enter-from,
.tooltip-up.tooltip-leave-to {
  transform: translateY(8px);
}

/* ===== Methods Card ===== */
.methods-card {
  flex: none;
}

.custom-method-chip {
  cursor: default;
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-primary));
}

.custom-method-chip:hover {
  background: color-mix(in srgb, var(--accent) 12%, var(--bg-primary));
  border-color: var(--accent);
}

.remove-method-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  margin-left: 2px;
  font-size: 1em;
  line-height: 1;
  color: var(--accent);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 3px;
  opacity: 0.7;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.remove-method-btn:hover {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  opacity: 1;
}

.custom-method-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed var(--border);
}

.custom-method-input {
  flex: 1;
  padding: 7px 12px;
  font-size: 0.85em;
}

.add-method-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 1.3em;
  font-weight: 600;
  color: white;
  cursor: pointer;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  transition: background 0.2s ease, transform 0.15s ease;
}

.add-method-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: scale(1.05);
}

.add-method-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.methods-card .card-header-icon.methods-icon {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}

.methods-card .options-count {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}

.methods-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.method-chip {
  position: relative;
  z-index: 1;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.25s ease;
}

.method-chip:hover {
  z-index: 100;
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, var(--bg-primary));
}

.method-chip input {
  display: none;
}

.method-chip .chip-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.method-chip .chip-indicator::after {
  top: 3px;
  left: 5px;
  width: 4px;
  height: 8px;
}

.method-chip.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-primary));
}

.method-chip.active .chip-indicator {
  background: var(--accent);
  border-color: var(--accent);
}

.method-chip.active .chip-label {
  color: var(--accent);
}

.method-chip.conflicted {
  cursor: not-allowed;
  opacity: 0.5;
}

.method-chip.conflicted:hover {
  border-color: var(--border);
  background: var(--bg-primary);
}

.method-chip.conflicted.active {
  opacity: 0.6;
}

.method-chip.conflicted.active .chip-indicator {
  background: var(--text-secondary);
  border-color: var(--text-secondary);
}

.method-chip.conflicted.active .chip-label {
  color: var(--text-secondary);
}

/* ===== Info Alert ===== */
.info-alert {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: color-mix(in srgb, #3b82f6 12%, var(--bg-secondary));
  border: 1px solid #3b82f6;
  border-radius: 10px;
}

[data-theme='light'] .info-alert {
  background: color-mix(in srgb, #3b82f6 8%, #fff);
}

.alert-icon.info-icon {
  color: #3b82f6;
  background: color-mix(in srgb, #3b82f6 20%, transparent);
}

.info-alert .alert-title {
  color: #3b82f6;
}

[data-theme='light'] .info-alert .alert-title {
  color: #2563eb;
}

.code-block {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--code-block-bg);
  border: 1px solid var(--code-block-border);
  border-radius: 8px;
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--code-block-header-bg);
  border-bottom: 1px solid var(--code-block-header-border);
}

.code-lang {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--code-lang-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: var(--text-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  opacity: 0.6;
  transition: all 0.25s ease;
}

.copy-btn:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  opacity: 1;
}

.code-block-content {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: hidden auto;
  font-family: var(--font-mono);
  font-size: 0.85em;
  line-height: 1.5;
}

.command-line {
  display: flex;
  flex-wrap: wrap;
  padding: 3px 8px;
  margin-bottom: 2px;
  white-space: nowrap;
  border-left: 3px solid transparent;
  border-radius: 3px;
}

.command-line.line-runtime-methods {
  white-space: normal;
}

.command-line.line-runtime-methods .line-name {
  white-space: nowrap;
}

.command-line:hover {
  background: rgb(255 255 255 / 8%);
}

[data-theme='light'] .command-line:hover {
  background: rgb(0 0 0 / 5%);
}

.command-line.line-even {
  background: rgb(255 255 255 / 2%);
  border-left-color: #4fc3f7;
}

[data-theme='light'] .command-line.line-even {
  background: rgb(0 0 0 / 1.5%);
  border-left-color: #0288d1;
}

.command-line.line-odd {
  border-left-color: #81c784;
}

[data-theme='light'] .command-line.line-odd {
  border-left-color: #388e3c;
}

.command-line.line-type-command {
  border-left-color: #ff79c6 !important;
}

.command-line.line-type-command .line-name {
  font-weight: 700;
  color: #ff79c6;
}

[data-theme='light'] .command-line.line-type-command .line-name {
  color: #d63384;
}

.command-line.line-type-command .line-value {
  color: #8be9fd;
}

[data-theme='light'] .command-line.line-type-command .line-value {
  color: #0d6efd;
}

.command-line.line-type-output {
  padding-left: 20px;
  border-left-color: #50fa7b !important;
}

.command-line.line-type-output .line-name {
  color: #50fa7b;
}

[data-theme='light'] .command-line.line-type-output .line-name {
  color: #198754;
}

.command-line.line-type-output .line-value {
  color: #f1fa8c;
}

[data-theme='light'] .command-line.line-type-output .line-value {
  color: #6f42c1;
}

.command-line.line-type-flag {
  padding-left: 20px;
}

.command-line.line-type-flag .line-name {
  color: #bd93f9;
}

[data-theme='light'] .command-line.line-type-flag .line-name {
  color: #6610f2;
}

.command-line.line-custom {
  background: rgb(245 158 11 / 8%);
  border-left-color: #f59e0b !important;
}

[data-theme='light'] .command-line.line-custom {
  background: rgb(245 158 11 / 6%);
}

.command-line.line-custom .line-name {
  color: #f59e0b;
}

[data-theme='light'] .command-line.line-custom .line-name {
  color: #d97706;
}

.command-line.line-custom .line-value {
  color: #fbbf24;
}

[data-theme='light'] .command-line.line-custom .line-value {
  color: #b45309;
}

.command-line.line-ref-contrib {
  background: rgb(59 130 246 / 8%);
  border-left-color: #3b82f6 !important;
}

[data-theme='light'] .command-line.line-ref-contrib {
  background: rgb(59 130 246 / 5%);
}

.command-line.line-ref-contrib .line-name {
  color: #60a5fa;
}

[data-theme='light'] .command-line.line-ref-contrib .line-name {
  color: #2563eb;
}

.command-line.line-ref-contrib .line-value {
  color: #93c5fd;
}

[data-theme='light'] .command-line.line-ref-contrib .line-value {
  color: #1d4ed8;
}

.line-name {
  font-weight: 500;
  color: #bd93f9;
}

[data-theme='light'] .line-name {
  color: #6610f2;
}

.line-eq,
.line-space {
  color: #888;
  white-space: pre;
}

.line-value {
  font-weight: 500;
  color: #f38ba8;
}

[data-theme='light'] .line-value {
  color: #c2185b;
}

.line-runtime-methods {
  flex-wrap: wrap;
}

.line-runtime-methods .methods-value {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: break-word;
}

.line-runtime-methods .methods-value .method-item {
  font-weight: 600;
  color: #50fa7b;
}

[data-theme='light'] .line-runtime-methods .methods-value .method-item {
  color: #198754;
}

.execute-btn {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px 24px;
  font-size: 1em;
  font-weight: 600;
  color: white;
  cursor: pointer;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 12px color-mix(in srgb, #22c55e 35%, transparent);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.execute-btn svg {
  flex-shrink: 0;
  fill: currentColor;
}

.execute-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 8px 20px color-mix(in srgb, #22c55e 45%, transparent);
  transform: translateY(-2px);
}

.execute-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px color-mix(in srgb, #22c55e 30%, transparent);
}

.execute-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.link-span {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--accent);
  text-underline-offset: 2px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

.link-span:hover {
  color: var(--accent-hover);
  text-decoration-color: var(--accent-hover);
}

.link-span:focus,
.link-span:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
  outline-offset: 2px;
}

.link-span:active {
  text-decoration-thickness: 1.5px;
}

/* ===== 复制命令按钮样式 ===== */
.copy-command-btn {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent);
}

.copy-command-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-hover) 0%, color-mix(in srgb, var(--accent-hover) 85%, black) 100%);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 45%, transparent);
}

.copy-command-btn:active:not(:disabled) {
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
}

/* ===== Toast 通知样式 ===== */
.toast-notification {
  position: fixed;
  z-index: 9999;
  top: 24px;
  left: 50%;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 20px;
  font-size: 0.9em;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  background: var(--accent);
  border-radius: 10px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent), 0 0 0 1px color-mix(in srgb, white 15%, transparent);
  transform: translateX(-50%);
}

.toast-icon {
  flex-shrink: 0;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.toast-message {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

/* 明亮模式优化 */
[data-theme='light'] .toast-notification {
  box-shadow: 0 8px 28px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 0 1px color-mix(in srgb, white 25%, transparent);
}

[data-theme='light'] .toast-icon {
  filter: drop-shadow(0 1px 2px color-mix(in srgb, var(--accent) 40%, transparent));
}

[data-theme='light'] .toast-message {
  text-shadow: 0 1px 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

/* Toast 进入/退出动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

</style>
