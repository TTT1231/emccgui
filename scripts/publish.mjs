import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const mustRequireGithubToken = 'GITHUB_TOKEN';

//执行命令
function spawnAsync(command, args, options) {
   return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { ...options, stdio: 'inherit', shell: true });
      proc.on('close', code => {
         if (code !== 0) {
            reject(new Error(`Command exited with code ${code}`));
         } else {
            resolve();
         }
      });
      proc.on('error', reject);
   });
}

//加载环境变量
function loadEnv() {
   try {
      const envPath = join(rootDir, '.env');
      const envContent = readFileSync(envPath, 'utf-8');
      const env = {};

      envContent.split('\n').forEach(line => {
         const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*)$/);
         if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            // 只加载 GITHUB_TOKEN
            if (key === mustRequireGithubToken) {
               env[key] = value;
            }
         }
      });

      return env;
   } catch (err) {
      console.error(`❌ Error: Failed to load .env file: ${err.message}`);
      return {};
   }
}

// 验证必要环境变量
function validateEnv(env) {
   if (!env.GITHUB_TOKEN) {
      console.error(`❌ Error: Missing required environment variable: ${mustRequireGithubToken}`);
      process.exit(1);
   }
}

async function main() {
   const env = loadEnv();
   validateEnv(env);

   const command = `set GITHUB_TOKEN=${env.GITHUB_TOKEN} && electron-forge publish`;
   await spawnAsync(command, [], { shell: true });

   console.log('📝 生成 latest.yml并上传到Github Release...');
   await spawnAsync('node scripts/generate-update-yml.mjs', [], { shell: true });

   await spawnAsync(
      `set GITHUB_TOKEN=${env.GITHUB_TOKEN} && node scripts/upload-latest-yml.mjs`,
      [],
      { shell: true },
   );

   console.log('✅ 发布完成');
}

main().catch(err => {
   console.error('❌ Publish failed:', err.message);
   process.exit(1);
});
