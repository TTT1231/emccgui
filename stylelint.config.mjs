/** @type {import("stylelint").Config} */
export default {
   extends: ['stylelint-config-standard'],
   ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.json', '**/*.md'],
   reportDescriptionlessDisables: true, //禁用规则必须有描述
   reportInvalidScopeDisables: true, //禁用规则必须在有效范围内
   reportNeedlessDisables: true, //报告不必要的禁用
   //vue和scss配置
   overrides: [
      {
         customSyntax: 'postcss-html',
         files: ['*.(html|vue)', '**/*.(html|vue)'],
         rules: {
            //禁止使用未知的伪类选择器
            'selector-pseudo-class-no-unknown': [
               true,
               {
                  ignorePseudoClasses: ['global', 'deep'],
               },
            ],
            //禁止使用未知的伪元素选择器
            'selector-pseudo-element-no-unknown': [
               true,
               {
                  ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'],
               },
            ],
         },
      },
      {
         customSyntax: 'postcss-scss',
         extends: ['stylelint-config-recommended-scss', 'stylelint-config-recommended-vue/scss'],
         files: ['*.scss', '**/*.scss'],
      },
   ],
   plugins: [
      //css排序
      'stylelint-order',
      //scss预处理器支持
      'stylelint-scss',
      //css风格校验
      '@stylistic/stylelint-plugin',
      //css与prettier集成
      'stylelint-prettier',
   ],
   rules: {
      'at-rule-no-deprecated': null, //禁止使用过时的css@规则
      'at-rule-no-unknown': [
         true,
         {
            ignoreAtRules: [
               'extends',
               'ignores',
               'include',
               'mixin',
               'if',
               'else',
               'media',
               'for',
               'at-root',
               'tailwind',
               'apply',
               'variants',
               'responsive',
               'screen',
               'function',
               'each',
               'use',
               'forward',
               'return',
            ], //禁止使用未知的@规则，同时配置scss语法@规则支持
         },
      ],
      'font-family-no-missing-generic-family-keyword': null, //强制要求font-family的属性必须包含通用字体族
      'function-no-unknown': null, //禁止使用未知的函数
      'import-notation': 'string', //强制使用字符串引入
      'media-feature-range-notation': null, //规范媒体特性范围的表示法
      'named-grid-areas-no-invalid': null, //检查命名网格区域是否无效
      'no-descending-specificity': null, //禁止低优先级覆盖高优先级
      'no-empty-source': null, //禁止空的样式,例如空文件等
      //stylelint-order插件，强制按照特定顺序书写css属性
      'order/order': [
         [
            'dollar-variables', //scss变量
            'custom-properties', //css属性
            'at-rules', //@规则,例如@import等//!这里属于大规则，如果与小规则冲突，会被小规则覆盖
            'declarations', //css
            {
               //supports规则
               name: 'supports',
               type: 'at-rule',
            },
            {
               //media规则
               name: 'media',
               type: 'at-rule',
            },
            {
               //import规则，小分类覆盖大分类中import规则
               name: 'import',
               type: 'at-rule',
            },
            'rules', //嵌套规则，例如 &__icon、&:hover、.u-btn--primary等
         ],
         { severity: 'warning' }, //违反规则为警告级别
      ],
      'prettier/prettier': true, //stylelint复用prettier规则
      //声明块前必须加一个空行
      'rule-empty-line-before': [
         'always',
         {
            ignore: ['after-comment', 'first-nested'], //忽略注释后和第一个嵌套规则前
         },
      ],
      //stylelint-scss插件，验证scss中@开头的语句是否合法
      'scss/at-rule-no-unknown': [
         true,
         {
            ignoreAtRules: [
               'extends',
               'ignores',
               'include',
               'mixin',
               'if',
               'else',
               'media',
               'for',
               'at-root',
               'tailwind',
               'apply',
               'variants',
               'responsive',
               'screen',
               'function',
               'each',
               'use',
               'forward',
               'return',
            ], //忽略scss语法@规则
         },
      ],
      /**
       * BEM 变体类名规范
       * [可选前缀] - 块名 __ [元素名] -- [修饰符]
       * !元素用__连接，修饰符用--连接(这里修饰符大多指状态，例如active、disabled等)
       * - 块名--修饰符
       * - 块名__元素名--修饰符
       * - 块名__元素名
       * !常用前缀(c-,u-,js-) 表示组件(有业务语义，一般都是特定组件可用)、工具(无业务语义可复用)、js(js专用)
       * @usage @example
       * .c-btn--primary {}   //按钮组件primary
       * .c-card__header {}   //卡片组件的header元素
       * .u-hidden {}         //通用隐藏类
       * .is-active {}        //状态类
       * .u-mt-15 {}          //工具类，表示margin-top:15px
       * .js-modal {}         //js操作，表示某个modal组件样式
       * .js-modal--active {} //js操作，表示某个modal组件的active状态样式
       */
      'selector-class-pattern':
         '^(?:(?:o|c|u|t|s|is|has|_|js|qa)-)?[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:[.+])?$',

      'selector-not-notation': 'complex', //规范:not()为现代表示法
      'scss/operator-no-newline-before': null, //scss操作符可以换行
   },
};
