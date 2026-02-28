<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppState } from '@/stores'
import { optionConflicts } from '@/data'

const { state } = useAppState()
const toastRef = ref<{ show: (msg: string) => void } | null>(null)

// Generate command
const commandLines = computed(() => {
  const lines: string[] = []
  const isJsWasm = state.outputFormat === 'js-wasm'

  // Get conflicted keys
  const conflictedKeys = new Set<string>()
  if (state.outputFormat === 'wasm-only') {
    for (const opt of state.compileOptions) {
      if (opt.jsWasmOnly && opt.enabled) {
        conflictedKeys.add(opt.key)
      }
    }
  }
  for (const conflict of optionConflicts) {
    const trigger = state.compileOptions.find(o => o.key === conflict.triggerKey)
    if (trigger?.enabled) {
      for (const key of conflict.conflictsWith) {
        if (state.compileOptions.find(o => o.key === key)?.enabled) {
          conflictedKeys.add(key)
        }
      }
    }
  }

  // 1. emcc + input file
  lines.push(`emcc ${state.selectedFile?.name || 'input.cpp'}`)

  // 2. Output file
  const ext = isJsWasm ? '.js' : '.wasm'
  lines.push(`-o output${ext}`)

  // 3. Enabled options
  for (const opt of state.compileOptions) {
    if (!opt.enabled) continue
    if (conflictedKeys.has(opt.key)) continue
    if (opt.jsWasmOnly && !isJsWasm) continue

    if (opt.formatType === 'arg') {
      lines.push(`${opt.cmdPrefix}${opt.cmdName}`)
    } else {
      const value = opt.currentValue || opt.defaultValue
      lines.push(`${opt.cmdPrefix}${opt.cmdName}=${value}`)
    }
  }

  // 4. Runtime methods
  const enabledMethods = state.runtimeMethods.filter(m => m.enabled)
  if (enabledMethods.length > 0 && isJsWasm) {
    const methodsList = enabledMethods.map(m => `'${m.name}'`).join(',')
    lines.push(`-s EXPORTED_RUNTIME_METHODS=[${methodsList}]`)
  }

  // 5. Optimization level
  lines.push(`-${state.optimizationLevel}`)

  return lines
})

const fullCommand = computed(() => commandLines.value.join(' '))

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(fullCommand.value)
    toastRef.value?.show('命令已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="command-output-section">
    <div class="command-header">
      <h3 class="section-title">生成的命令</h3>
      <button class="copy-btn" @click="copyCommand">
        复制命令
      </button>
    </div>

    <div class="command-box">
      <div
        v-for="(line, index) in commandLines"
        :key="index"
        class="command-line"
      >
        <span class="line-number">{{ index + 1 }}</span>
        <span class="line-content">{{ line }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.command-output-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.copy-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--accent-hover);
}

.command-box {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-x: auto;
}

.command-line {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.line-number {
  color: var(--text-muted);
  user-select: none;
  min-width: 20px;
  text-align: right;
}

.line-content {
  color: var(--text-primary);
}
</style>
