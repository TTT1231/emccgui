import { writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

// 查找 out/make 目录下的安装包
const makeDir = join(rootDir, 'out', 'make');

function findInstaller() {
   try {
      const squirrelDir = join(makeDir, 'squirrel.windows', 'x64');
      const files = readdirSync(squirrelDir);

      // 查找 .exe 安装包（不是 Setup.exe）
      const installer = files.find(f => f.endsWith('.exe') && !f.includes('Setup'));

      if (!installer) {
         throw new Error('找不到安装包文件');
      }

      const installerPath = join(squirrelDir, installer);
      const stats = statSync(installerPath);

      // 计算 SHA512
      const fileBuffer = readFileSync(installerPath);
      const hash = createHash('sha512').update(fileBuffer).digest('base64');

      return {
         name: installer,
         size: stats.size,
         sha512: hash,
      };
   } catch (error) {
      console.error('查找安装包失败:', error.message);
      return null;
   }
}

function generateYml() {
   const installer = findInstaller();

   if (!installer) {
      console.error('❌ 无法生成 latest.yml：找不到安装包');
      process.exit(1);
   }

   const yml = `version: ${version}
files:
  - url: ${installer.name}
    sha512: ${installer.sha512}
    size: ${installer.size}
path: ${installer.name}
sha512: ${installer.sha512}
releaseDate: ${new Date().toISOString()}
`;

   // 保存到 out/make/squirrel.windows/x64 目录
   const outputPath = join(makeDir, 'squirrel.windows', 'x64', 'latest.yml');
   writeFileSync(outputPath, yml, 'utf-8');

   console.log('✅ latest.yml 生成成功:', outputPath);
   console.log('\n内容:');
   console.log(yml);
}

generateYml();
