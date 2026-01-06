<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
function bootstrapAfterLoad() {
   settingThemeAttr();
}

//设置主题属性防止遗漏
function settingThemeAttr() {
   const projectThemeSetting = document.documentElement.getAttribute('theme');
   if (projectThemeSetting === null) {
      document.documentElement.setAttribute('theme', 'light');
   }
}

onMounted(() => {
   bootstrapAfterLoad();
});
</script>

<template>
   <div><RouterView /></div>
</template>
