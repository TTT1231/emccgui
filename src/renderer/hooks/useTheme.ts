import { ref } from 'vue';

const projectThemeSetting = document.documentElement.getAttribute('theme')! as 'light' | 'dark';

const currentTheme = ref<'light' | 'dark'>(projectThemeSetting);

function toggleTheme() {
   const targetTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
   document.documentElement.setAttribute('theme', targetTheme);
   currentTheme.value = targetTheme;
}

export function useTheme() {
   return {
      currentTheme,
      toggleTheme,
   };
}
