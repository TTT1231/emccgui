import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'TTT1231';
const REPO = 'emccgui';

// 读取版本号
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

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
   console.log(`🔍 查找 Release: ${tag}`);

   const release = await getReleaseByTag(tag);
   if (!release) {
      console.error(`❌ 找不到 Release: ${tag}`);
      process.exit(1);
   }

   console.log(`✅ 找到 Release: ${release.name}`);

   const ymlPath = join(rootDir, 'out', 'make', 'squirrel.windows', 'x64', 'latest.yml');
   console.log(`📤 上传 latest.yml...`);

   const success = await uploadAsset(release.upload_url, ymlPath, 'latest.yml');
   if (success) {
      console.log('✅ latest.yml 上传成功！');
   } else {
      console.error('❌ latest.yml 上传失败');
      process.exit(1);
   }
}

main().catch(err => {
   console.error('❌ 上传失败:', err.message);
   process.exit(1);
});
