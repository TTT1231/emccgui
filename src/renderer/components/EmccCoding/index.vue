<script lang="ts" setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';

import type {
   OptimizationLevelsType,
   CompileOption,
   RuntimeMethodOption,
   CommandLine,
} from './src/type';
import {
   optionsReferenceURL,
   compileOptionOptions,
   runtimeMethodOptions,
   optimizationLevels,
} from './src/data';
import { formatCommandLine, getConflictedOptions, getConflictReason } from './src/utils';
import SearchBtn from './src/SearchBtn.vue';

// ------------ Imports & Component Registration ------------
// ------------ State ------------

// 文件相关
const selectedFile = ref<{ path: string; name: string } | null>(null);
const outputFileName = ref('hello');
const isDragOver = ref(false);

// 输出格式选项
const outputFormat = ref<'js-wasm' | 'wasm-only'>('js-wasm');

// 编译选项配置（响应式，从 data.ts 获取初始值）
const compileOptionsOpt = ref<CompileOption[]>(JSON.parse(JSON.stringify(compileOptionOptions)));

// 运行时方法配置（响应式）
const runtimeMethodsOpt = ref<RuntimeMethodOption[]>(
   JSON.parse(JSON.stringify(runtimeMethodOptions)),
);

// 优化级别配置
const options = ref({
   optimizationLevel: 'O3' as OptimizationLevelsType,
});

// 手动添加的编译选项
const addOptionsStack = ref<string[]>([]);

// 执行状态
const isExecuting = ref(false);

// Tooltip 状态
const activeTooltip = ref<string | null>(null);
const tooltipDirection = ref<'up' | 'down'>('down');
const tooltipPosition = ref({ left: '0px', top: '0px' });
let hideTooltipTimer: ReturnType<typeof setTimeout> | null = null;

// ------------ Computed ------------

// 需要输入框的已启用选项
const optionsWithInput = computed(() =>
   compileOptionsOpt.value.filter(opt => opt.hasInput && isOptionEnabled(opt)),
);

// 有下拉选项的已启用选项
const optionsWithSelect = computed(() =>
   compileOptionsOpt.value.filter(
      opt => opt.valueType === 'select' && opt.selectOptions && opt.enabled,
   ),
);

// 当前有冲突的选项 keys
const conflictedKeys = computed(() =>
   getConflictedOptions(outputFormat.value, compileOptionsOpt.value),
);

// 当前有冲突的选项对象（用于显示警告）
const conflictedOptions = computed(() =>
   compileOptionsOpt.value.filter(opt => conflictedKeys.value.has(opt.key)),
);

// 生成命令行数组（用于高亮显示）
const commandLines = computed(() => {
   const lines: CommandLine[] = [];
   const isJsWasm = outputFormat.value === 'js-wasm';

   // emcc 命令 + 输入文件
   const inputFile = selectedFile.value?.name || 'input.cpp';
   lines.push({ name: 'emcc', value: inputFile, type: 'command' });

   // 输出文件
   const outputExt = isJsWasm ? '.js' : '.wasm';
   lines.push({ name: '-o', value: `${outputFileName.value}${outputExt}`, type: 'output' });

   // 遍历所有编译选项，自动生成命令行
   for (const option of compileOptionsOpt.value) {
      if (!isOptionEnabled(option)) continue;
      if (option.jsWasmOnly && !isJsWasm) continue;

      // 处理 select 类型
      if (option.valueType === 'select') {
         const selectValue = option.currentValue || option.defaultValue;
         if (option.formatType === 'arg') {
            lines.push({ name: `-${selectValue}`, type: 'flag' });
         } else {
            const cmdName = `${option.cmdPrefix}${option.cmdName}`;
            lines.push({ name: cmdName, value: String(selectValue), type: 'flag' });
         }
         continue;
      }

      // 根据选项格式生成命令行
      const cmdName =
         option.cmdPrefix === '-s'
            ? `${option.cmdPrefix}${option.cmdName}`
            : `${option.cmdPrefix}${option.cmdName}`;

      switch (option.formatType) {
         case 'arg':
            lines.push({ name: cmdName, type: 'flag' });
            break;
         case 'setting':
         case 'flag':
            lines.push({
               name: cmdName,
               value: String(option.currentValue ?? option.defaultValue),
               type: 'flag',
            });
            break;
      }
   }

   // 优化级别
   lines.push({ name: `-${options.value.optimizationLevel}`, type: 'flag' });

   // 手动添加的编译选项
   for (const customCmd of addOptionsStack.value) {
      const eqIndex = customCmd.indexOf('=');
      if (eqIndex > 0) {
         const name = customCmd.substring(0, eqIndex);
         const value = customCmd.substring(eqIndex + 1);
         lines.push({ name, value, type: 'flag', isCustom: true });
      } else {
         lines.push({ name: customCmd, type: 'flag', isCustom: true });
      }
   }

   // 导出的运行时方法
   const enabledMethods = runtimeMethodsOpt.value.filter(m => m.enabled).map(m => m.name);
   if (enabledMethods.length > 0 && isJsWasm) {
      lines.push({
         name: '-sEXPORTED_RUNTIME_METHODS',
         value: enabledMethods.join(','),
         type: 'flag',
         isRuntimeMethods: true,
         methods: enabledMethods,
      });
   }

   return lines;
});

// 生成完整命令字符串
const fullCommand = computed(() =>
   commandLines.value.map(line => formatCommandLine(line)).join(' '),
);

// 获取所有已存在的编译选项命令名称（用于 SearchBtn 检测重复）
const getAllExistingCommandNames = computed(() => {
   const commandNames: string[] = [];
   const isJsWasm = outputFormat.value === 'js-wasm';

   for (const option of compileOptionsOpt.value) {
      if (!isOptionEnabled(option)) continue;
      if (option.jsWasmOnly && !isJsWasm) continue;

      if (option.valueType === 'select') {
         const selectValue = option.currentValue || option.defaultValue;
         if (option.formatType === 'arg') {
            commandNames.push(`-${selectValue}`);
         } else {
            commandNames.push(`${option.cmdPrefix}${option.cmdName}`);
         }
         continue;
      }

      const cmdName =
         option.cmdPrefix === '-s'
            ? `${option.cmdPrefix}${option.cmdName}`
            : `${option.cmdPrefix}${option.cmdName}`;

      switch (option.formatType) {
         case 'arg':
         case 'setting':
         case 'flag':
            commandNames.push(cmdName);
            break;
      }
   }

   commandNames.push(`-${options.value.optimizationLevel}`);

   const enabledMethods = runtimeMethodsOpt.value.filter(m => m.enabled).map(m => m.name);
   if (enabledMethods.length > 0 && isJsWasm) {
      commandNames.push('-sEXPORTED_RUNTIME_METHODS');
   }

   for (const customCmd of addOptionsStack.value) {
      const eqIndex = customCmd.indexOf('=');
      commandNames.push(eqIndex > 0 ? customCmd.substring(0, eqIndex) : customCmd);
   }

   return commandNames;
});

// ------------ Helper Functions ------------

// 根据 key 获取编译选项
const getOptionByKey = (key: string) => compileOptionsOpt.value.find(opt => opt.key === key);

// 检查选项是否启用（包括依赖检查）
const isOptionEnabled = (option: CompileOption): boolean => {
   if (!option.enabled) return false;
   if (option.dependsOn) {
      const dep = getOptionByKey(option.dependsOn);
      if (!dep?.enabled) return false;
   }
   return true;
};

// 检查单个选项是否有冲突
const hasConflict = (optionKey: string): boolean => conflictedKeys.value.has(optionKey);

// 获取单个选项的冲突原因
const getConflictMessage = (optionKey: string): string | null =>
   getConflictReason(optionKey, outputFormat.value, compileOptionsOpt.value);

// ------------ Tooltip ------------
const showTooltip = (name: string, event: MouseEvent) => {
   if (hideTooltipTimer) {
      clearTimeout(hideTooltipTimer);
      hideTooltipTimer = null;
   }

   if (activeTooltip.value === name) return;

   const target = event.currentTarget as HTMLElement;
   const rect = target.getBoundingClientRect();
   const spaceBelow = window.innerHeight - rect.bottom;

   tooltipDirection.value = spaceBelow < 80 ? 'up' : 'down';
   tooltipPosition.value = {
      left: `${rect.left}px`,
      top: tooltipDirection.value === 'down' ? `${rect.bottom + 8}px` : `${rect.top - 8}px`,
   };

   activeTooltip.value = name;
};

const hideTooltip = () => {
   if (hideTooltipTimer) {
      clearTimeout(hideTooltipTimer);
   }
   hideTooltipTimer = setTimeout(() => {
      activeTooltip.value = null;
      hideTooltipTimer = null;
   }, 100);
};

// ------------ File Handlers ------------
const handleFileSelect = async () => {
   const result = await window.electronApi.EmccControl.selectFile();
   if (result) {
      selectedFile.value = { path: result.filePath, name: result.fileName };
      outputFileName.value = result.fileName.replace(/\.(cpp|c|cc)$/, '');
   }
};

const handleDrop = async (e: DragEvent) => {
   isDragOver.value = false;
   const files = e.dataTransfer?.files;
   if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.cpp', '.c', '.cc'];
      if (file && validExtensions.some(ext => file.name.endsWith(ext))) {
         const filePath = window.getPathForFile(file);
         selectedFile.value = { path: filePath, name: file.name };
         outputFileName.value = file.name.replace(/\.(cpp|c|cc)$/, '');
      }
   }
};

const handleDragOver = (e: DragEvent) => {
   e.preventDefault();
   isDragOver.value = true;
};

const handleDragLeave = () => {
   isDragOver.value = false;
};

const removeFile = () => {
   selectedFile.value = null;
};

// ------------ Command Handlers ------------

const copyCommand = async () => {
   await navigator.clipboard.writeText(fullCommand.value);
};

const executeCommand = async () => {
   if (!selectedFile.value) {
      message.warning('请先选择一个文件');
      return;
   }

   isExecuting.value = true;

   try {
      const filePath = selectedFile.value.path;
      const workDir = filePath.substring(
         0,
         Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/')),
      );

      const result = await window.electronApi.EmccControl.executeCommand(
         fullCommand.value,
         workDir,
      );

      if (result.success) {
         message.success('执行成功', 2);
      } else {
         message.error(`执行失败: ${result.error || ''}`, 2);
      }
   } catch (error: unknown) {
      message.error((error as { message?: string }).message || '执行失败', 2);
   } finally {
      isExecuting.value = false;
   }
};

const handleAddCompileOptions = (value: string) => {
   addOptionsStack.value.push(value);
};

const handleRevokeCompileOptions = () => {
   addOptionsStack.value.pop();
};

// ------------ Misc Handlers ------------

const openBrowser = () => {
   window.electronApi.BrowserControl.openBrowser(optionsReferenceURL);
};
</script>

<template>
   <div class="emcc-container">
      <div class="main-content">
         <!-- 左侧：配置区域 -->
         <div class="config-panel">
            <!-- 文件选择区域 -->
            <section class="section">
               <h3 class="section-title flex flex-row flex-nowrap justify-between">
                  <span>📁 文件选择</span>
                  <span class="link-span" @click="openBrowser">完整配置参考</span>
               </h3>

               <div
                  class="drop-zone"
                  :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
                  @click="handleFileSelect"
                  @drop.prevent="handleDrop"
                  @dragover="handleDragOver"
                  @dragleave="handleDragLeave"
               >
                  <div class="drop-content">
                     <template v-if="!selectedFile">
                        <span class="drop-icon">📄</span>
                        <span class="drop-text">拖拽文件到此处或点击选择</span>
                        <span class="drop-hint">支持 .cpp / .c / .cc 文件</span>
                     </template>
                     <template v-else>
                        <span class="file-icon">📄</span>
                        <span class="file-name">{{ selectedFile.name }}</span>
                        <button class="remove-btn" @click.stop="removeFile">✕</button>
                     </template>
                  </div>
               </div>

               <!-- 输出格式选择 -->
               <div class="input-group">
                  <label class="input-label">输出</label>
                  <div class="format-options">
                     <label class="format-option" :class="{ active: outputFormat === 'js-wasm' }">
                        <input type="radio" v-model="outputFormat" value="js-wasm" />
                        <span>JS + WASM</span>
                     </label>
                     <label class="format-option" :class="{ active: outputFormat === 'wasm-only' }">
                        <input type="radio" v-model="outputFormat" value="wasm-only" />
                        <span>WASM</span>
                     </label>
                  </div>
               </div>
            </section>

            <!-- 编译选项 -->
            <section class="section">
               <h3 class="section-title">🔧 编译选项</h3>

               <!-- 冲突警告提示 -->
               <Transition name="warning">
                  <div v-if="conflictedOptions.length > 0" class="conflict-warning">
                     <span class="warning-icon">⚠️</span>
                     <div class="warning-content">
                        <div class="warning-title">
                           检测到 {{ conflictedOptions.length }} 个冲突选项
                        </div>
                        <div class="warning-list">
                           <div
                              v-for="opt in conflictedOptions"
                              :key="opt.key"
                              class="warning-item"
                           >
                              <span class="warning-opt-name">{{ opt.name }}</span>
                              <span class="warning-reason">{{ getConflictMessage(opt.key) }}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </Transition>

               <div class="options-grid">
                  <label
                     v-for="opt in compileOptionsOpt"
                     :key="opt.key"
                     v-show="opt.key !== 'SIDE_MODULE' || outputFormat === 'wasm-only'"
                     class="toggle-option"
                     :class="{
                        disabled: opt.dependsOn && !getOptionByKey(opt.dependsOn)?.enabled,
                        conflicted: hasConflict(opt.key),
                     }"
                     @mouseenter="showTooltip(opt.name, $event)"
                     @mouseleave="hideTooltip"
                  >
                     <input
                        type="checkbox"
                        v-model="opt.enabled"
                        :disabled="!!(opt.dependsOn && !getOptionByKey(opt.dependsOn)?.enabled)"
                     />
                     <span class="toggle-slider"></span>
                     <span class="toggle-label">{{ opt.name }}</span>

                     <!-- Tooltip -->
                     <Transition name="tooltip">
                        <div
                           v-if="activeTooltip === opt.name"
                           class="tooltip"
                           :class="[`tooltip-${tooltipDirection}`]"
                           :style="{ left: tooltipPosition.left, top: tooltipPosition.top }"
                        >
                           <div class="tooltip-content">
                              {{ opt.hint }}
                           </div>
                           <div class="tooltip-arrow"></div>
                        </div>
                     </Transition>
                  </label>
               </div>

               <!-- 动态输入框（用于需要用户自定义值的选项） -->
               <template v-for="opt in optionsWithInput" :key="opt.key + '-input'">
                  <div class="input-group">
                     <label class="input-label">{{ opt.inputLabel || opt.name }}</label>
                     <input
                        v-model="opt.currentValue"
                        type="text"
                        class="text-input"
                        :placeholder="opt.inputPlaceholder"
                        spellcheck="false"
                     />
                  </div>
               </template>

               <!-- 动态下拉选择（用于有多个选项的配置） -->
               <template v-for="opt in optionsWithSelect" :key="opt.key + '-select'">
                  <div class="input-group">
                     <label class="input-label">{{ opt.name }}</label>
                     <select v-model="opt.currentValue" class="select-input">
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

               <!-- 输出文件名 -->
               <div class="input-group">
                  <label class="input-label">输出文件名</label>
                  <div class="output-input-wrapper">
                     <input
                        v-model="outputFileName"
                        type="text"
                        class="text-input"
                        placeholder="hello"
                        spellcheck="false"
                     />
                     <span class="output-ext">{{
                        outputFormat === 'wasm-only' ? '.wasm' : '.js'
                     }}</span>
                  </div>
               </div>

               <!-- 优化级别 -->
               <div class="input-group">
                  <label class="input-label">优化级别</label>
                  <select v-model="options.optimizationLevel" class="select-input">
                     <option
                        v-for="level in optimizationLevels"
                        :key="level.value"
                        :value="level.value"
                     >
                        {{ level.label }}
                     </option>
                  </select>
               </div>
            </section>
         </div>

         <!-- 右侧：命令预览 -->
         <div class="preview-panel">
            <!-- 命令高亮显示 - 代码块风格 -->
            <div class="code-block">
               <div class="code-block-header">
                  <span class="code-lang">emcc</span>
                  <button class="copy-btn" @click="copyCommand" title="复制命令">📋</button>
               </div>
               <div class="code-block-content">
                  <div
                     v-for="(line, index) in commandLines"
                     :key="index"
                     class="command-line"
                     :class="[
                        `line-${index % 2 === 0 ? 'even' : 'odd'}`,
                        `line-type-${line.type}`,
                        { 'line-runtime-methods': line.isRuntimeMethods },
                        { 'line-custom': line.isCustom },
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
               :existing-commands="getAllExistingCommandNames"
               @handle-add="handleAddCompileOptions"
               @handle-revoke="handleRevokeCompileOptions"
            />
            <!-- 运行时方法 -->
            <section class="section methods-section">
               <h3 class="section-title">📦 导出运行时方法</h3>

               <!-- 运行时方法冲突警告 -->
               <Transition name="warning">
                  <div
                     v-if="outputFormat === 'wasm-only' && runtimeMethodsOpt.some(m => m.enabled)"
                     class="runtime-methods-warning"
                  >
                     <span class="warning-icon">ℹ️</span>
                     <div class="warning-content">
                        <div class="warning-title">运行时方法仅在 JS + WASM 模式下有效</div>
                        <div class="warning-reason">
                           纯 WASM 模式不生成 JS glue 代码，无法使用这些运行时方法
                        </div>
                     </div>
                  </div>
               </Transition>

               <div class="methods-grid">
                  <label
                     v-for="method in runtimeMethodsOpt"
                     :key="method.key"
                     class="method-chip"
                     :class="{
                        active: method.enabled,
                        conflicted: outputFormat === 'wasm-only',
                     }"
                     @mouseenter="showTooltip(method.name, $event)"
                     @mouseleave="hideTooltip"
                  >
                     <input
                        type="checkbox"
                        v-model="method.enabled"
                        :disabled="outputFormat === 'wasm-only'"
                     />
                     <span class="select-none">{{ method.name }}</span>

                     <!-- Tooltip -->
                     <Transition name="tooltip">
                        <div
                           v-if="activeTooltip === method.name"
                           class="tooltip"
                           :class="'tooltip-' + tooltipDirection"
                           :style="{ left: tooltipPosition.left, top: tooltipPosition.top }"
                        >
                           <div class="tooltip-content">{{ method.hint }}</div>
                           <div class="tooltip-arrow"></div>
                        </div>
                     </Transition>
                  </label>
               </div>
            </section>

            <!-- 执行按钮 -->
            <button
               class="execute-btn"
               @click="executeCommand"
               :disabled="!selectedFile || isExecuting"
            >
               <span class="btn-icon">{{ isExecuting ? '⏳' : '▶' }}</span>
               <span class="btn-text">{{ isExecuting ? '编译中...' : '执行编译' }}</span>
            </button>
         </div>
      </div>
   </div>
</template>

<style lang="scss" scoped>
.emcc-container {
   box-sizing: border-box;
   display: flex;
   flex-direction: column;
   height: 100%;
   padding: 20px;
   overflow-y: auto;
}

.main-content {
   display: grid;
   flex: 1;
   grid-template-columns: 1fr 1fr;
   gap: 20px;
   min-height: 0;

   @media (max-width: 900px) {
      grid-template-columns: 1fr;
   }
}

.config-panel {
   display: flex;
   flex-direction: column;
   gap: 16px;
   overflow-y: auto;
}

.preview-panel {
   display: flex;
   flex-direction: column;
   gap: 16px;
   min-height: 0; // 允许收缩
   overflow: hidden; // 防止内容溢出
}

.section {
   padding: 16px;
   background: var(--bg-secondary);
   border: 1px solid var(--border-color);
   border-radius: 12px;
}

.section-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   margin-bottom: 12px;
}

.section-title {
   margin: 0 0 12px;
   font-size: 1em;
   font-weight: 600;
   color: var(--text-primary);

   .section-header & {
      margin-bottom: 0;
   }
}

// 文件拖拽区域
.drop-zone {
   position: relative;
   padding: 24px;
   text-align: center;
   cursor: pointer;
   background: var(--bg-primary);
   border: 2px dashed var(--border-color);
   border-radius: 10px;
   transition: all 0.3s ease;

   &:hover,
   &.drag-over {
      background: color-mix(in srgb, var(--color-primary) 5%, var(--bg-primary));
      border-color: var(--color-primary);
   }

   &.has-file {
      border-color: var(--color-primary);
      border-style: solid;
   }
}

.drop-content {
   display: flex;
   flex-direction: column;
   gap: 6px;
   align-items: center;
}

.drop-icon {
   font-size: 2em;
   opacity: 0.6;
}

.drop-text {
   font-size: 1em;
   font-weight: 500;
   color: var(--text-primary);
}

.drop-hint {
   font-size: 0.8em;
   color: var(--text-secondary);
}

.file-icon {
   font-size: 1.8em;
}

.file-name {
   font-size: 1em;
   font-weight: 600;
   color: var(--color-primary);
}

.remove-btn {
   position: absolute;
   top: 8px;
   right: 8px;
   z-index: 10;
   display: flex;
   align-items: center;
   justify-content: center;
   width: 24px;
   height: 24px;
   padding: 0;
   font-size: 12px;
   border-radius: 50%;

   &:hover {
      color: white;
      background: var(--bg-button-hover-danger);
   }
}

// 输出格式选择
.format-options {
   display: flex;
   gap: 8px;
}

.format-option {
   display: flex;
   flex: 1;
   gap: 6px;
   align-items: center;
   justify-content: center;
   padding: 8px 12px;
   font-size: 0.85em;
   font-weight: 500;
   cursor: pointer;
   background: var(--bg-primary);
   border: 1px solid var(--border-color);
   border-radius: 6px;
   transition: all 0.2s;

   input {
      display: none;
   }

   &:hover {
      border-color: var(--color-primary);
   }

   &.active {
      color: white;
      background: var(--color-primary);
      border-color: var(--color-primary);
   }
}

// 输出文件名输入框
.output-input-wrapper {
   display: flex;
   align-items: center;
   overflow: hidden;
   background: var(--bg-input);
   border: 1px solid var(--border-color);
   border-radius: 8px;

   &:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
   }

   .text-input {
      flex: 1;
      border: none;
      border-radius: 0;

      &:focus {
         box-shadow: none;
      }
   }
}

.output-ext {
   padding: 10px 14px;
   font-family: 'SF Mono', 'Fira Code', monospace;
   font-size: 0.9em;
   color: var(--text-secondary);
   background: var(--bg-button);
   border-left: 1px solid var(--border-color);
}

// 输入框组
.input-group {
   margin-top: 12px;
}

.input-label {
   display: block;
   margin-bottom: 6px;
   font-size: 0.85em;
   font-weight: 500;
   color: var(--text-secondary);
}

.text-input,
.select-input {
   box-sizing: border-box;
   width: 100%;
   padding: 10px 14px;
   font-size: 0.9em;
   color: var(--text-primary);
   background: var(--bg-input);
   border: 1px solid var(--border-color);
   border-radius: 8px;
   transition:
      border-color 0.2s,
      box-shadow 0.2s;

   &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
   }
}

.select-input {
   cursor: pointer;
}

// 选项网格
.options-grid {
   display: flex;
   flex-wrap: wrap;
   gap: 6px;
}

// 开关选项
.toggle-option {
   position: relative;
   z-index: 1; // 默认层级
   display: flex;
   gap: 8px;
   align-items: center;
   padding: 6px 10px;
   cursor: pointer;
   background: var(--bg-primary);
   border: 1px solid var(--border-color);
   border-radius: 6px;
   transition: all 0.2s;

   // hover 时提升层级，确保 tooltip 不被遮挡
   &:hover {
      z-index: 100;
   }

   &:hover:not(.disabled) {
      border-color: var(--color-primary);
   }

   &.disabled {
      cursor: not-allowed;
      opacity: 0.5;

      .toggle-slider {
         background: var(--border-color) !important;

         &::after {
            transform: none !important;
         }
      }
   }

   input {
      display: none;
   }
}

.toggle-slider {
   position: relative;
   flex-shrink: 0;
   width: 32px;
   height: 18px;
   background: var(--border-color);
   border-radius: 9px;
   transition: background 0.3s;

   &::after {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 12px;
      height: 12px;
      content: '';
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
   }

   input:checked + & {
      background: var(--color-primary);

      &::after {
         transform: translateX(14px);
      }
   }
}

.toggle-label {
   font-family: 'SF Mono', 'Fira Code', monospace;
   font-size: 0.8em;
   font-weight: 500;
   color: var(--text-primary);
   white-space: nowrap;
   user-select: none;
}

// 冲突状态样式
.toggle-option.conflicted {
   background: color-mix(in srgb, #f59e0b 10%, var(--bg-primary));
   border-color: #f59e0b;

   .toggle-slider {
      background: #f59e0b !important;
   }

   .toggle-label {
      color: #d97706;
   }

   // 添加冲突图标
   &::after {
      position: absolute;
      top: 50%;
      right: 4px;
      font-size: 0.7em;
      content: '⚠️';
      transform: translateY(-50%);
   }
}

// 冲突警告框样式
.conflict-warning {
   display: flex;
   gap: 10px;
   padding: 12px;
   margin-bottom: 12px;
   background: color-mix(in srgb, #f59e0b 15%, var(--bg-secondary));
   border: 1px solid #f59e0b;
   border-radius: 8px;

   [theme='light'] & {
      background: color-mix(in srgb, #f59e0b 10%, #fff);
   }
}

.warning-icon {
   flex-shrink: 0;
   font-size: 1.2em;
}

.warning-content {
   flex: 1;
   min-width: 0;
}

.warning-title {
   margin-bottom: 6px;
   font-size: 0.9em;
   font-weight: 600;
   color: #d97706;

   [theme='light'] & {
      color: #b45309;
   }
}

.warning-list {
   display: flex;
   flex-direction: column;
   gap: 4px;
}

.warning-item {
   display: flex;
   flex-direction: column;
   gap: 2px;
   padding: 4px 8px;
   background: color-mix(in srgb, #f59e0b 10%, transparent);
   border-radius: 4px;
}

.warning-opt-name {
   font-family: 'SF Mono', 'Fira Code', monospace;
   font-size: 0.8em;
   font-weight: 600;
   color: #d97706;

   [theme='light'] & {
      color: #b45309;
   }
}

.warning-reason {
   font-size: 0.75em;
   color: var(--text-secondary);
}

// 警告过渡动画
.warning-enter-active,
.warning-leave-active {
   transition: all 0.3s ease;
}

.warning-enter-from,
.warning-leave-to {
   opacity: 0;
   transform: translateY(-10px);
}

// Tooltip 样式
.tooltip {
   position: fixed;
   z-index: 1000;
   pointer-events: none;

   .tooltip-arrow {
      left: 20px;
      border-right: 6px solid transparent;
      border-left: 6px solid transparent;
   }

   &.tooltip-down {
      .tooltip-arrow {
         top: -6px;
         border-bottom: 6px solid #fff;

         [theme='dark'] & {
            border-bottom-color: #2d3748;
         }
      }
   }

   &.tooltip-up {
      .tooltip-arrow {
         bottom: -6px;
         border-top: 6px solid #fff;

         [theme='dark'] & {
            border-top-color: #2d3748;
         }
      }
   }
}

.tooltip-content {
   padding: 8px 12px;
   font-size: 0.8em;
   line-height: 1.5;
   color: #333;
   white-space: nowrap;
   background: #fff;
   border: 1px solid #e8e8e8;
   border-radius: 8px;
   box-shadow:
      0 3px 6px -4px rgb(0 0 0 / 12%),
      0 6px 16px 0 rgb(0 0 0 / 8%),
      0 9px 28px 8px rgb(0 0 0 / 5%);

   [theme='dark'] & {
      color: #fff;
      background: #2d3748;
      border-color: #4a5568;
      box-shadow:
         0 4px 8px rgb(0 0 0 / 40%),
         0 8px 20px rgb(0 0 0 / 30%);
   }
}

.tooltip-arrow {
   position: absolute;
   width: 0;
   height: 0;
}

// Tooltip 动画
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

// 运行时方法
.methods-section {
   flex-shrink: 0; // 不收缩，保持固定高度
   padding: 12px;
}

.methods-grid {
   display: flex;
   flex-wrap: wrap;
   gap: 6px;
}

.method-chip {
   position: relative;
   display: inline-flex;
   align-items: center;
   padding: 5px 10px;
   font-family: 'SF Mono', 'Fira Code', monospace;
   font-size: 0.75em;
   cursor: pointer;
   background: var(--bg-primary);
   border: 1px solid var(--border-color);
   border-radius: 14px;
   transition: all 0.2s;

   input {
      display: none;
   }

   &:hover {
      border-color: var(--color-primary);
   }

   &.active {
      color: white;
      background: var(--color-primary);
      border-color: var(--color-primary);
   }

   // 冲突状态（纯 WASM 模式下）
   &.conflicted {
      cursor: not-allowed;
      border-color: var(--border-color);
      opacity: 0.5;

      &.active {
         color: var(--text-secondary);
         background: var(--bg-button);
         border-color: var(--border-color);
      }
   }
}

// 运行时方法警告样式
.runtime-methods-warning {
   display: flex;
   gap: 10px;
   padding: 10px 12px;
   margin-bottom: 12px;
   background: color-mix(in srgb, #3b82f6 10%, var(--bg-secondary));
   border: 1px solid #3b82f6;
   border-radius: 8px;

   [theme='light'] & {
      background: color-mix(in srgb, #3b82f6 8%, #fff);
   }
}

// 代码块风格
.code-block {
   display: flex;
   flex: 1; // 填满剩余空间
   flex-direction: column;
   min-height: 150px; // 最小高度
   overflow: hidden;
   background: #1e1e1e;
   border: 1px solid #333;
   border-radius: 8px;

   [theme='light'] & {
      background: #f6f8fa;
      border-color: var(--border-color);
   }
}

.code-block-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 6px 12px;
   background: rgb(255 255 255 / 5%);
   border-bottom: 1px solid #333;

   [theme='light'] & {
      background: rgb(0 0 0 / 3%);
      border-bottom-color: var(--border-color);
   }
}

.code-lang {
   font-size: 0.75em;
   font-weight: 600;
   color: #888;
   text-transform: uppercase;
   letter-spacing: 0.5px;

   [theme='light'] & {
      color: #666;
   }
}

.copy-btn {
   padding: 4px 8px;
   font-size: 0.75em;
   cursor: pointer;
   background: transparent;
   border: none;
   opacity: 0.6;
   transition: opacity 0.2s;

   &:hover {
      background: transparent;
      opacity: 1;
   }
}

.code-block-content {
   flex: 1;
   min-height: 0; // 确保 flex 子元素可以收缩
   padding: 12px;
   overflow: hidden auto; // 垂直滚动
   font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
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

   // 运行时方法行允许换行
   &.line-runtime-methods {
      white-space: normal;

      .line-name {
         white-space: nowrap;
      }
   }

   &:hover {
      background: rgb(255 255 255 / 8%);

      [theme='light'] & {
         background: rgb(0 0 0 / 5%);
      }
   }

   // 交替行不同颜色边框
   &.line-even {
      background: rgb(255 255 255 / 2%);
      border-left-color: #4fc3f7;

      [theme='light'] & {
         background: rgb(0 0 0 / 1.5%);
         border-left-color: #0288d1;
      }
   }

   &.line-odd {
      border-left-color: #81c784;

      [theme='light'] & {
         border-left-color: #388e3c;
      }
   }

   // emcc 命令行
   &.line-type-command {
      border-left-color: #ff79c6 !important;

      .line-name {
         font-weight: 700;
         color: #ff79c6;

         [theme='light'] & {
            color: #d63384;
         }
      }

      .line-value {
         color: #8be9fd;

         [theme='light'] & {
            color: #0d6efd;
         }
      }
   }

   // 输出行
   &.line-type-output {
      padding-left: 20px;
      border-left-color: #50fa7b !important;

      .line-name {
         color: #50fa7b;

         [theme='light'] & {
            color: #198754;
         }
      }

      .line-value {
         color: #f1fa8c;

         [theme='light'] & {
            color: #6f42c1;
         }
      }
   }

   // flag 行
   &.line-type-flag {
      padding-left: 20px;

      .line-name {
         color: #bd93f9;

         [theme='light'] & {
            color: #6610f2;
         }
      }
   }

   // 用户手动添加的自定义命令
   &.line-custom {
      background: rgb(245 158 11 / 8%);
      border-left-color: #f59e0b !important;

      [theme='light'] & {
         background: rgb(245 158 11 / 6%);
      }

      .line-name {
         color: #f59e0b;

         [theme='light'] & {
            color: #d97706;
         }
      }

      .line-value {
         color: #fbbf24;

         [theme='light'] & {
            color: #b45309;
         }
      }
   }
}

.line-name {
   font-weight: 500;
   color: #bd93f9;

   [theme='light'] & {
      color: #6610f2;
   }
}

.line-eq,
.line-space {
   color: #888;
   white-space: pre;
}

.line-value {
   font-weight: 500;
   color: #f38ba8;

   [theme='light'] & {
      color: #c2185b;
   }
}

// 运行时方法特殊样式
.line-runtime-methods {
   flex-wrap: wrap;

   .methods-value {
      display: inline-block;
      max-width: 100%;
      overflow-wrap: break-word;

      .method-item {
         font-weight: 600;
         color: #50fa7b;

         [theme='light'] & {
            color: #198754;
         }
      }
   }
}

// 执行按钮
.execute-btn {
   display: flex;
   flex-shrink: 0; // 不收缩，保持固定高度
   gap: 8px;
   align-items: center;
   justify-content: center;
   width: 100%;
   padding: 14px 20px;
   font-size: 1em;
   font-weight: 600;
   color: white;
   cursor: pointer;
   background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
   border: none;
   border-radius: 10px;
   box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent);
   transition: all 0.3s;

   &:hover:not(:disabled) {
      box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary) 45%, transparent);
      transform: translateY(-2px);
   }

   &:active:not(:disabled) {
      transform: translateY(0);
   }

   &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
   }

   .btn-icon {
      font-size: 1.1em;
   }
}

.link-span {
   color: var(--color-primary);
   text-decoration: underline;
   text-decoration-thickness: 1px;
   text-decoration-color: var(--color-primary);
   text-underline-offset: 2px;
   cursor: pointer;
   user-select: none;
   transition: color 0.2s ease;

   &:hover {
      color: var(--color-primary-hover);
      text-decoration-color: var(--color-primary-hover);
   }

   &:focus,
   &:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
      outline-offset: 2px;
   }

   // 可选：点击时下划线稍粗（增强交互反馈）
   &:active {
      text-decoration-thickness: 1.5px;
   }
}
</style>
