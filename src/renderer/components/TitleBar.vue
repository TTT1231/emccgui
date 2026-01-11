<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

import Logo from '@resources/shared/logo.png';
import MinimizeIcon from '@resources/public/icons/minimize.svg';
import MaximizeIcon from '@resources/public/icons/maximize.svg';
import CloseIcon from '@resources/public/icons/close.svg';
import Sun from '@resources/public/icons/sun.svg';
import Moon from '@resources/public/icons/moon.svg';

import { useTheme } from '../hooks/useTheme';

// 菜单配置
interface MenuItem {
   label: string;
   action?: () => void;
   shortcut?: string;
   divider?: boolean;
}

interface MenuConfig {
   label: string;
   items: MenuItem[];
}

const menuList: MenuConfig[] = [
   {
      label: '菜单',
      items: [
         {
            label: '调试控制台',
            shortcut: 'Ctrl+Shift+I',
            action: () => handleWindowControl('openDevTools'),
         },
         { divider: true, label: '' },
         { label: '退出', shortcut: 'Alt+F4', action: () => handleWindowControl('close') },
      ],
   },
   {
      label: '帮助',
      items: [
         {
            label: '检查更新...',
            action: () => window.electronApi.InternalElectron.checkUpdate(),
         },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
         { label: '关于', action: () => window.electronApi.InternalElectron.showVersionInfo() },
      ],
   },
];

// 菜单状态
const activeMenuIndex = ref<number | null>(null);
const isMenuBarActive = ref(false);

const openMenu = (index: number) => {
   activeMenuIndex.value = index;
   isMenuBarActive.value = true;
};

const closeMenu = () => {
   activeMenuIndex.value = null;
   isMenuBarActive.value = false;
};

const toggleMenu = (index: number) => {
   if (activeMenuIndex.value === index) {
      closeMenu();
   } else {
      openMenu(index);
   }
};

const handleMenuHover = (index: number) => {
   // 只有在菜单栏激活时，悬停才切换菜单
   if (isMenuBarActive.value) {
      activeMenuIndex.value = index;
   }
};

const handleMenuItemClick = (item: MenuItem) => {
   if (item.divider) return;
   item.action?.();
   closeMenu();
};

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
   const target = event.target as HTMLElement;
   if (!target.closest('.title-bar-menu-wrapper')) {
      closeMenu();
   }
};

onMounted(() => {
   document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
   document.removeEventListener('click', handleClickOutside);
});

const minMaxBtnIcons = [MinimizeIcon, MaximizeIcon, CloseIcon] as string[];
const currentThemeIcon = ref<string>(Sun);
const { currentTheme, toggleTheme } = useTheme();
const handleWindowControl = (behavior: 'maximize' | 'minimize' | 'close' | 'openDevTools') => {
   switch (behavior) {
      case 'minimize':
         window.electronApi.WindowControl.minimize();
         break;
      case 'maximize':
         window.electronApi.WindowControl.maximize();
         break;
      case 'close':
         window.electronApi.WindowControl.close();
         break;
      case 'openDevTools':
         window.electronApi.WindowControl.openDevTools();
         break;
      default:
         break;
   }
};

watch(
   () => currentTheme.value,
   newVal => {
      if (newVal === 'light') {
         currentThemeIcon.value = Sun;
      } else {
         currentThemeIcon.value = Moon;
      }
   },
   {
      immediate: true,
   },
);
</script>
<template>
   <div class="title-bar">
      <div class="title-bar-left">
         <div class="flex justify-center items-center h-full w-12">
            <img :src="Logo" alt="Logo" />
         </div>
         <!-- 菜单栏 -->
         <div class="title-bar-menu-wrapper">
            <div
               v-for="(menu, index) in menuList"
               :key="menu.label"
               class="title-bar-menu-container"
               :class="{ active: activeMenuIndex === index }"
               @click.stop="toggleMenu(index)"
               @mouseenter="handleMenuHover(index)"
            >
               {{ menu.label }}
               <!-- 下拉菜单 -->
               <Transition name="menu-fade">
                  <div v-if="activeMenuIndex === index" class="title-bar-menu" @click.stop>
                     <div
                        v-for="(item, itemIndex) in menu.items"
                        :key="itemIndex"
                        :class="['menu-item', { divider: item.divider }]"
                        @click="handleMenuItemClick(item)"
                     >
                        <template v-if="!item.divider">
                           <span class="menu-item-label">{{ item.label }}</span>
                           <span v-if="item.shortcut" class="menu-item-shortcut">{{
                              item.shortcut
                           }}</span>
                        </template>
                     </div>
                  </div>
               </Transition>
            </div>
         </div>
      </div>

      <!-- 中间区域可以放标题或其他内容 -->
      <div class="title-bar-center"></div>

      <div class="title-bar-right">
         <div class="control-btn-theme" @click="toggleTheme()">
            <img :src="currentThemeIcon" alt="Theme Toggle" />
         </div>
         <div class="control-btn-minimize" @click="handleWindowControl('minimize')">
            <img :src="minMaxBtnIcons[0]" alt="Minimize" />
         </div>
         <div class="control-btn-maximize" @click="handleWindowControl('maximize')">
            <img :src="minMaxBtnIcons[1]" alt="Maximize" />
         </div>
         <div class="control-btn-close" @click="handleWindowControl('close')">
            <img :src="minMaxBtnIcons[2]" alt="Close" />
         </div>
      </div>
   </div>
</template>

<style lang="scss" scoped>
$control-btn-list: 'minimize', 'maximize', 'close', 'theme';

@mixin titleBarBtnBaseStyle {
   position: relative;
   width: 40px;
   -webkit-app-region: no-drag;
   app-region: no-drag;
   cursor: pointer;
   display: flex;
   align-items: center;
   justify-content: center;
   height: 100%;
   transition: background-color 0.15s;
}

@mixin titleBarBtnAfterHoverStyle {
   position: absolute;
   top: 100%;
   right: 0;
   margin-top: 4px;
   padding: 4px 8px;
   font-size: 12px;
   white-space: nowrap;
   border: 2px solid var(--border-color);
   background-color: var(--bg-secondary);
   border-radius: 4px;
   box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
   z-index: 1000;
}

@each $btn-name in $control-btn-list {
   .control-btn-#{$btn-name} {
      @include titleBarBtnBaseStyle();

      @if $btn-name == 'minimize' {
         &:hover {
            background-color: var(--bg-button-hover);

            &::after {
               @include titleBarBtnAfterHoverStyle();

               content: '最小化';
            }
         }
      } /* stylelint-disable-next-line at-rule-empty-line-before -- prettier格式化要求 */
      @else if $btn-name == 'maximize' {
         &:hover {
            background-color: var(--bg-button-hover);

            &::after {
               @include titleBarBtnAfterHoverStyle();

               content: '最大化';
            }
         }
      } /* stylelint-disable-next-line at-rule-empty-line-before -- prettier格式化要求 */
      @else if $btn-name == 'close' {
         width: 50px;

         &:hover {
            background-color: var(--bg-button-hover-danger);

            &::after {
               @include titleBarBtnAfterHoverStyle();

               content: '关闭';
            }
         }
      } /* stylelint-disable-next-line at-rule-empty-line-before -- prettier格式化要求 */
      @else if $btn-name == 'theme' {
         &:hover {
            background-color: var(--bg-button-hover);

            &::after {
               @include titleBarBtnAfterHoverStyle();

               content: '主题';
            }
         }
      }
   }
}

.title-bar-menu-wrapper {
   display: flex;
   align-items: center;
   height: 100%;
   -webkit-app-region: no-drag;
   app-region: no-drag;
}

.title-bar-menu-container {
   @include titleBarBtnBaseStyle();

   height: 60%;
   padding: 0 8px;
   font-size: 13px;
   border-radius: 0.25rem;

   &:hover,
   &.active {
      background-color: var(--bg-button-hover);
   }
}

.title-bar-menu {
   position: absolute;
   min-width: 200px;
   top: calc(100% + 4px);
   left: 0;
   border-radius: 0.375rem;
   background-color: var(--bg-secondary);
   border: 1px solid var(--border-color);
   box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
   padding: 4px 0;
   z-index: 1000;
}

.menu-item {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 6px 12px;
   margin: 0 4px;
   font-size: 13px;
   cursor: pointer;
   color: var(--text-primary);
   transition: background-color 0.1s;
   border-radius: 4px;
   white-space: nowrap;

   &:hover:not(.divider) {
      background-color: var(--bg-button-hover);
   }

   &.divider {
      height: 1px;
      padding: 0;
      margin: 4px 8px;
      background-color: var(--border-color);
      cursor: default;
   }
}

.menu-item-label {
   flex: 1;
}

.menu-item-shortcut {
   margin-left: 24px;
   font-size: 12px;
   color: var(--text-secondary);
   opacity: 0.7;
}

/* 菜单动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
   transition:
      opacity 0.15s ease,
      transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
   opacity: 0;
   transform: translateY(-4px);
}

.title-bar {
   height: 44px;
   background-color: var(--bg-secondary);
   border-bottom: 1px solid var(--border-color);
   box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 0;

   /* 关键：允许拖拽窗口 */
   -webkit-app-region: drag;

   /* 防止文本被选中 */
   user-select: none;
   width: 100%;
   box-sizing: border-box;
}

.title-bar-left {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   height: 100%;
   gap: 8px;
   font-size: 12px;
}

.title-bar-center {
   flex: 1;
   text-align: center;
   font-size: 12px;
}

.title-bar-right {
   display: flex;
   align-items: center;
   gap: 0;
   height: 100%;

   img {
      width: 16px;
      height: 16px;
      display: block;
   }
}
</style>
