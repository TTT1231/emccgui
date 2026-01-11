import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const env = loadEnv();
const GITHUB_TOKEN = env.GITHUB_TOKEN;
const OWNER = 'TTT1231';
const REPO = 'emccgui';

// 读取版本号
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

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
            if (key === 'GITHUB_TOKEN') {
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
function httpsRequest(options, body = null) {
   return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
         let data = '';
         res.on('data', chunk => (data += chunk));
         res.on('end', () => {
            try {
               resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
            } catch {
               resolve({ status: res.statusCode, data });
            }
         });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
   });
}

async function getReleaseByTag(tag) {
   const res = await httpsRequest({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases/tags/${tag}`,
      method: 'GET',
      headers: {
         'User-Agent': 'emccgui-publisher',
         Authorization: `token ${GITHUB_TOKEN}`,
         Accept: 'application/vnd.github.v3+json',
      },
   });
   return res.status === 200 ? res.data : null;
}

async function deleteAsset(assetId) {
   const res = await httpsRequest({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases/assets/${assetId}`,
      method: 'DELETE',
      headers: {
         'User-Agent': 'emccgui-publisher',
         Authorization: `token ${GITHUB_TOKEN}`,
         Accept: 'application/vnd.github.v3+json',
      },
   });
   return res.status === 204;
}

async function findAssetByName(release, fileName) {
   if (!release.assets || release.assets.length === 0) {
      return null;
   }
   return release.assets.find(asset => asset.name === fileName);
}

async function uploadAsset(uploadUrl, filePath, fileName) {
   const fileContent = readFileSync(filePath);
   const url = new URL(uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`));

   const res = await httpsRequest(
      {
         hostname: url.hostname,
         path: url.pathname + url.search,
         method: 'POST',
         headers: {
            'User-Agent': 'emccgui-publisher',
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'text/yaml',
            'Content-Length': fileContent.length,
         },
      },
      fileContent,
   );

   return res.status === 201;
}

async function main() {
   if (!GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN 未设置');
      process.exit(1);
   }

   const tag = `v${version}`;

   const release = await getReleaseByTag(tag);
   if (!release) {
      console.error(`❌ 找不到 Release: ${tag}`);
      process.exit(1);
   }

   // 检查是否已存在 latest.yml
   const existingAsset = await findAssetByName(release, 'latest.yml');
   if (existingAsset) {
      const deleted = await deleteAsset(existingAsset.id);
      if (deleted) {
         //已删除旧的 latest.yml
      } else {
         //删除旧文件失败，但将继续尝试上传
      }
   }

   const ymlPath = join(rootDir, 'out', 'make', 'squirrel.windows', 'x64', 'latest.yml');

   const success = await uploadAsset(release.upload_url, ymlPath, 'latest.yml');
   if (!success) {
      throw new Error('❌ 上传 latest.yml 失败');
   }
}

main().catch(err => {
   console.error('❌ latest.yml上传失败:', err.message);
   process.exit(1);
});
