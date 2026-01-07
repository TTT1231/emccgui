<script lang="ts" setup>
import { ref } from 'vue';
const emit = defineEmits({
   handleAdd: value => typeof value === 'string',
   handleRevoke: () => void 0,
});

const searchValue = ref('');

const handleAdd = () => {
   if (!searchValue.value.trim()) {
      return;
   }
   emit('handleAdd', searchValue.value.trim());
   searchValue.value = ''; // 清空输入框
};
const handleUndo = () => {
   emit('handleRevoke');
};
const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Enter') {
      handleAdd();
   }
   if (e.ctrlKey && e.key === 'z') {
      // 阻止浏览器默认的 Ctrl+Z 行为（比如页面回退、输入框撤销，按需开启）
      e.preventDefault();
      handleUndo();
   }
};
</script>

<template>
   <div class="search-btn-container">
      <div class="input-wrapper">
         <span class="input-icon">⚡</span>
         <input
            v-model="searchValue"
            type="text"
            class="search-input"
            placeholder="输入要编译选项，如 -sSTACK_SIZE=1048576"
            @keydown="handleKeyDown"
         />
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
   display: flex;
   gap: 10px;
   align-items: stretch;
}

.input-wrapper {
   flex: 1;
   position: relative;
   display: flex;
   align-items: center;
   background: var(--bg-input);
   border: 1px solid var(--border-color);
   border-radius: 8px;
   overflow: hidden;
   transition: all 0.2s ease;

   &:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
   }
}

.input-icon {
   padding: 0 12px;
   font-size: 1em;
   opacity: 0.5;
   user-select: none;
   pointer-events: none;
}

.search-input {
   flex: 1;
   border: none;
   background: transparent;
   padding: 10px 12px 10px 0;
   font-size: 0.9em;
   color: var(--text-primary);
   outline: none;
   font-family: inherit;

   &::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
   }

   &:focus {
      border: none;
      box-shadow: none;
   }
}

.add-btn {
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 6px;
   padding: 10px 16px;
   background: var(--color-primary);
   color: white;
   border: none;
   border-radius: 8px;
   font-size: 0.9em;
   font-weight: 600;
   cursor: pointer;
   transition: all 0.2s ease;
   white-space: nowrap;
   box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent);

   &:hover:not(:disabled) {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
   }

   &:active:not(:disabled) {
      transform: translateY(0);
   }

   &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
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
   background: var(--bg-button);
   color: var(--text-primary);
   border: 1px solid var(--border-color);
   border-radius: 8px;
   font-size: 0.9em;
   cursor: pointer;
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
</style>
