import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

// 手动创建 latest.yml（需要你从 GitHub Release 获取实际的文件名和 SHA512）
const yml = `version: ${version}
files:
  - url: emccgui-${version}-Setup.exe
    sha512: YOUR_SHA512_HASH_HERE
    size: YOUR_FILE_SIZE_HERE
path: emccgui-${version}-Setup.exe
sha512: YOUR_SHA512_HASH_HERE
releaseDate: ${new Date().toISOString()}
`;

const outputPath = join(rootDir, 'latest.yml');
writeFileSync(outputPath, yml, 'utf-8');

console.log('✅ latest.yml 模板生成成功:', outputPath);
console.log('\n⚠️  请注意：');
console.log('1. 你需要从 GitHub Release 下载实际的安装包');
console.log('2. 计算 SHA512 哈希值');
console.log('3. 替换 YOUR_SHA512_HASH_HERE 和 YOUR_FILE_SIZE_HERE');
console.log('4. 将修改后的 latest.yml 上传到 GitHub Release v1.0.3');
