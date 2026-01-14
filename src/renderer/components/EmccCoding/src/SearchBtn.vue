<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';

import optionsData from './options.json';

interface Option {
   option: string;
   descri: string;
   defaultVal: string;
   defaultValDescri: string;
}

// 接收已存在的自定义命令列表
const props = defineProps<{
   existingCommands?: string[];
}>();

const emit = defineEmits({
   handleAdd: value => typeof value === 'string',
   handleRevoke: () => void 0,
});

const searchValue = ref('');
const inputRef = ref<HTMLInputElement>();
const inputWrapperRef = ref<HTMLDivElement>();
const showSuggestions = ref(false);
const activeIndex = ref(0);
const triggerChar = '@'; // 触发字符

// 建议列表显示位置（向上或向下）
const dropdownDirection = ref<'up' | 'down'>('down');

// 从 options.json 加载选项数据
const allOptions = ref<Option[]>(optionsData as Option[]);

// 提取命令名称（去除等号及后面的值）
const extractCommandName = (command: string): string => {
   const eqIndex = command.indexOf('=');
   return eqIndex > 0 ? command.substring(0, eqIndex) : command;
};

// 检查命令是否已存在
const isCommandDuplicate = (newCommand: string): boolean => {
   if (!props.existingCommands || props.existingCommands.length === 0) {
      return false;
   }

   const newCommandName = extractCommandName(newCommand);

   // 检查是否与已存在的命令重复
   return props.existingCommands.some(existingCmd => {
      const existingCommandName = extractCommandName(existingCmd);
      return existingCommandName === newCommandName;
   });
};

// 过滤匹配的选项（基于当前输入的触发字符后的内容）
const filteredOptions = computed(() => {
   // 检查是否有触发字符
   const triggerIndex = searchValue.value.lastIndexOf(triggerChar);

   if (triggerIndex === -1) {
      return [];
   }

   // 获取触发字符后的搜索关键词
   const searchTerm = searchValue.value
      .slice(triggerIndex + 1)
      .toLowerCase()
      .trim();

   if (!searchTerm) {
      // 如果没有搜索词，显示所有选项
      return allOptions.value;
   }

   // 使用正则进行模糊匹配
   const regex = new RegExp(searchTerm.split('').join('.*'), 'i');

   return allOptions.value.filter(opt => {
      // 在选项名和说明中搜索
      return regex.test(opt.option) || regex.test(opt.descri);
   });
});

// 检查是否应该显示建议列表
const shouldShowSuggestions = computed(() => {
   return showSuggestions.value && filteredOptions.value.length > 0;
});

// 计算下拉列表应该显示的方向
const calculateDropdownDirection = () => {
   nextTick(() => {
      if (!inputWrapperRef.value) return;

      const rect = inputWrapperRef.value.getBoundingClientRect();
      const dropdownHeight = 320; // 预估下拉列表最大高度
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 如果下方空间不足，且上方空间更充足，则向上显示
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
         dropdownDirection.value = 'up';
      } else {
         dropdownDirection.value = 'down';
      }
   });
};

// 添加选项
const handleAdd = () => {
   if (!searchValue.value.trim()) {
      return;
   }

   const commandToAdd = searchValue.value.trim();

   // 检查是否重复
   if (isCommandDuplicate(commandToAdd)) {
      const commandName = extractCommandName(commandToAdd);
      message.warning(`命令 "${commandName}" 已存在，请勿重复添加`);
      return;
   }

   emit('handleAdd', commandToAdd);
   searchValue.value = ''; // 清空输入框
   showSuggestions.value = false;
};

// 撤销
const handleUndo = () => {
   emit('handleRevoke');
};

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Enter') {
      // 如果建议列表打开且选中了选项，则应用选中的选项
      if (shouldShowSuggestions.value && filteredOptions.value[activeIndex.value]) {
         e.preventDefault();
         const selectedOption = filteredOptions.value[activeIndex.value];
         if (selectedOption) {
            // 如果默认值不是 "-"（无），则应用选项 + 默认值
            if (selectedOption.defaultVal !== '-') {
               applySuggestion(`${selectedOption.option}=${selectedOption.defaultVal}`);
            } else {
               // 否则只应用选项名
               applySuggestion(selectedOption.option);
            }
         }
      } else {
         handleAdd();
      }
      return;
   }

   // Ctrl+Z 撤销
   if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      handleUndo();
      return;
   }

   // 上下键选择建议
   if (shouldShowSuggestions.value) {
      if (e.key === 'ArrowDown') {
         e.preventDefault();
         activeIndex.value = (activeIndex.value + 1) % filteredOptions.value.length;
         scrollToActiveItem();
      } else if (e.key === 'ArrowUp') {
         e.preventDefault();
         activeIndex.value =
            (activeIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length;
         scrollToActiveItem();
      } else if (e.key === 'Escape') {
         e.preventDefault();
         showSuggestions.value = false;
         activeIndex.value = 0;
      }
   }
};

// 应用选中的建议
const applySuggestion = (option: string) => {
   const triggerIndex = searchValue.value.lastIndexOf(triggerChar);

   if (triggerIndex !== -1) {
      // 替换触发字符及之后的内容为选中的选项
      const before = searchValue.value.slice(0, triggerIndex);
      searchValue.value = before + option;
   } else {
      searchValue.value = option;
   }

   showSuggestions.value = false;
   activeIndex.value = 0;

   // 聚焦回输入框并将光标移到末尾
   nextTick(() => {
      inputRef.value?.focus();
      const length = searchValue.value.length;
      inputRef.value?.setSelectionRange(length, length);
   });
};

// 点击建议项
const handleSuggestionClick = (option: Option) => {
   // 如果默认值不是 "-"（无），则应用选项 + 默认值
   if (option.defaultVal !== '-') {
      applySuggestion(`${option.option}=${option.defaultVal}`);
   } else {
      // 否则只应用选项名
      applySuggestion(option.option);
   }
};

// 滚动到活动项
const scrollToActiveItem = () => {
   nextTick(() => {
      const activeElement = document.querySelector('.suggestion-item.active') as HTMLElement;
      if (activeElement) {
         activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
   });
};

// 监听输入变化，触发正则匹配
watch(searchValue, newValue => {
   // 检查是否有触发字符
   const hasTrigger = newValue.includes(triggerChar);

   if (hasTrigger) {
      showSuggestions.value = true;
      activeIndex.value = 0;
      calculateDropdownDirection(); // 计算显示方向
   } else {
      showSuggestions.value = false;
   }
});

// 处理输入框失焦
const handleBlur = () => {
   // 延迟关闭，以便点击建议项能够生效
   setTimeout(() => {
      showSuggestions.value = false;
   }, 200);
};

// 处理输入框聚焦
const handleFocus = () => {
   const hasTrigger = searchValue.value.includes(triggerChar);
   if (hasTrigger) {
      showSuggestions.value = true;
      calculateDropdownDirection(); // 计算显示方向
   }
};
</script>

<template>
   <div class="search-btn-container">
      <div ref="inputWrapperRef" class="input-wrapper">
         <span class="input-icon">⚡</span>
         <input
            ref="inputRef"
            v-model="searchValue"
            type="text"
            class="search-input"
            placeholder="输入 @ 触发选项搜索，或直接输入命令"
            @keydown="handleKeyDown"
            @blur="handleBlur"
            @focus="handleFocus"
         />
         <!-- 建议列表 -->
         <Transition name="suggestions">
            <div
               v-if="shouldShowSuggestions"
               class="suggestions-dropdown"
               :class="`dropdown-${dropdownDirection}`"
            >
               <div class="suggestions-header">
                  <span class="suggestions-count">{{ filteredOptions.length }} 个选项</span>
                  <span class="suggestions-hint">↑↓ 选择 Enter 确认</span>
               </div>
               <div class="suggestions-list">
                  <div
                     v-for="(option, index) in filteredOptions"
                     :key="option.option"
                     class="suggestion-item"
                     :class="{ active: index === activeIndex }"
                     @click="handleSuggestionClick(option)"
                     @mouseenter="activeIndex = index"
                  >
                     <div class="suggestion-content">
                        <div class="suggestion-left">
                           <div class="suggestion-option">
                              <span class="option-name">{{ option.option }}</span>
                           </div>
                           <div class="suggestion-desc">{{ option.descri }}</div>
                        </div>
                        <div class="suggestion-right">
                           <span class="default-value">{{
                              option.defaultValDescri === '-' ? '无' : option.defaultValDescri
                           }}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </Transition>
      </div>
      <button class="add-btn" @click="handleAdd" :disabled="!searchValue.trim()" title="添加命令">
         <span class="btn-icon">+</span>
         <span class="btn-text">添加</span>
      </button>
      <button class="undo-btn" @click="handleUndo" title="撤销上一个 (Ctrl+Z)">
         <span class="btn-icon">↩</span>
      </button>
   </div>
</template>

<style lang="scss" scoped>
.search-btn-container {
   position: relative;
   display: flex;
   gap: 10px;
   align-items: stretch;
}

.input-wrapper {
   position: relative;
   display: flex;
   flex: 1;
   align-items: center;
   overflow: visible;
   background: var(--bg-input);
   border: 1px solid var(--border-color);
   border-radius: 8px;
   transition: all 0.2s ease;

   &:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
   }
}

.input-icon {
   padding: 0 12px;
   font-size: 1em;
   pointer-events: none;
   user-select: none;
   opacity: 0.5;
}

.search-input {
   flex: 1;
   padding: 10px 12px 10px 0;
   font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
   font-size: 0.9em;
   color: var(--text-primary);
   outline: none;
   background: transparent;
   border: none;

   &::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
   }

   &:focus {
      border: none;
      box-shadow: none;
   }
}

// 建议下拉列表
.suggestions-dropdown {
   position: absolute;
   right: 0;
   left: 0;
   z-index: 1000;
   display: flex;
   flex-direction: column;
   max-height: 320px;
   overflow: hidden;
   background: var(--bg-primary);
   border: 1px solid var(--border-color);
   border-radius: 8px;
   box-shadow:
      0 4px 12px var(--shadow-color),
      0 8px 24px color-mix(in srgb, var(--shadow-color) 50%, transparent);

   // 向下显示（默认）
   &.dropdown-down {
      top: calc(100% + 8px);
      transform-origin: top center;
   }

   // 向上显示
   &.dropdown-up {
      bottom: calc(100% + 8px);
      transform-origin: bottom center;
   }
}

.suggestions-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 8px 12px;
   font-size: 0.75em;
   background: var(--bg-secondary);
   border-bottom: 1px solid var(--border-color);
}

.suggestions-count {
   font-weight: 600;
   color: var(--text-primary);
}

.suggestions-hint {
   font-size: 0.9em;
   color: var(--text-secondary);
   opacity: 0.8;
}

.suggestions-list {
   max-height: 280px;
   padding: 4px;
   overflow-y: auto;

   // 自定义滚动条
   &::-webkit-scrollbar {
      width: 6px;
   }

   &::-webkit-scrollbar-track {
      background: transparent;
   }

   &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;

      &:hover {
         background: var(--text-secondary);
      }
   }
}

.suggestion-item {
   padding: 10px 12px;
   margin-bottom: 2px;
   cursor: pointer;
   border-radius: 6px;
   transition: all 0.15s ease;

   &:hover {
      background: color-mix(in srgb, var(--color-primary) 10%, var(--bg-primary));
   }

   &.active {
      background: var(--color-primary);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent);

      .option-name,
      .suggestion-desc {
         color: white;
      }

      .default-value {
         font-weight: 600;
         color: var(--color-primary);
         background: white;
         border-color: white;
         opacity: 1;
      }
   }
}

.suggestion-content {
   display: flex;
   gap: 12px;
   align-items: flex-start;
   justify-content: space-between;
}

.suggestion-left {
   flex: 1;
   min-width: 0; // 允许文本截断
}

.suggestion-right {
   display: flex;
   flex-shrink: 0;
   align-items: center;
}

.suggestion-option {
   display: flex;
   gap: 8px;
   align-items: center;
   margin-bottom: 4px;
}

.option-name {
   font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
   font-size: 0.85em;
   font-weight: 600;
   color: var(--color-primary);
   word-break: break-all;
}

.suggestion-desc {
   font-size: 0.8em;
   line-height: 1.4;
   color: var(--text-secondary);
   opacity: 0.9;
}

.default-value {
   padding: 2px 8px;
   font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
   font-size: 0.75em;
   color: var(--text-secondary);
   white-space: nowrap;
   background: var(--bg-secondary);
   border: 1px solid var(--border-color);
   border-radius: 4px;
   opacity: 0.8;
   transition: all 0.15s ease;
}

.add-btn {
   display: flex;
   gap: 6px;
   align-items: center;
   justify-content: center;
   padding: 10px 16px;
   font-size: 0.9em;
   font-weight: 600;
   color: white;
   white-space: nowrap;
   cursor: pointer;
   background: var(--color-primary);
   border: none;
   border-radius: 8px;
   box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent);
   transition: all 0.2s ease;

   &:hover:not(:disabled) {
      background: var(--color-primary-hover);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
      transform: translateY(-1px);
   }

   &:active:not(:disabled) {
      transform: translateY(0);
   }

   &:disabled {
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.5;
   }

   .btn-icon {
      font-size: 1.1em;
      line-height: 1;
   }

   .btn-text {
      line-height: 1;
   }
}

.undo-btn {
   display: flex;
   align-items: center;
   justify-content: center;
   padding: 10px 12px;
   font-size: 0.9em;
   color: var(--text-primary);
   cursor: pointer;
   background: var(--bg-button);
   border: 1px solid var(--border-color);
   border-radius: 8px;
   transition: all 0.2s ease;

   &:hover {
      background: var(--bg-button-hover);
      border-color: var(--color-primary);
   }

   &:active {
      transform: scale(0.95);
   }

   .btn-icon {
      font-size: 1.1em;
      line-height: 1;
   }
}

// 建议列表动画
.suggestions-enter-active,
.suggestions-leave-active {
   transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.suggestions-enter-from,
.suggestions-leave-to {
   opacity: 0;

   // 向下显示时的动画
   .dropdown-down & {
      transform: scaleY(0.95) translateY(-8px);
   }

   // 向上显示时的动画
   .dropdown-up & {
      transform: scaleY(0.95) translateY(8px);
   }
}
</style>
