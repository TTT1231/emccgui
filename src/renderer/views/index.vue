<script lang="ts" setup>
import EmccCoding from '../components/EmccCoding/index.vue';
import TitleBar from '../components/TitleBar.vue';
</script>
<template>
   <div class="app-container">
      <!-- 标题栏 -->
      <TitleBar />
      <!-- 主要内容区 -->
      <EmccCoding />
   </div>
</template>

<style lang="scss" scoped>
.app-container {
   width: 100%;
   height: 100vh;
   display: flex;
   flex-direction: column;
   overflow: hidden;
}
</style>
