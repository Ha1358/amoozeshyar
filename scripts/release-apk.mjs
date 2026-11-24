import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'Ha1358/amoozeshyar';
const cwd = process.cwd();

const versionCandidates = [
  path.join(cwd, 'public', 'version.json'),
  'F:\\Amozeshyar\\Doroos8-v5\\public\\version.json',
  'F:\\Amozeshyar\\amoozeshyar-git\\public\\version.json',
];

const versionPath = versionCandidates.find((p) => fs.existsSync(p));
if (!versionPath) {
  console.error('فایل version.json یافت نشد. دستور را داخل پوشه پروژه اجرا کنید.');
  process.exit(1);
}

const versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const version = String(versionInfo.version || '').trim();
if (!version) {
  console.error('مقدار version در فایل version.json خالی است.');
  process.exit(1);
}

const tag = version.startsWith('v') ? version : `v${version}`;
const title = `${versionInfo.appName || 'آموزش یار'} نسخه ${version}`;
const notes = String(versionInfo.notes || title).trim();

const apkCandidates = [
  process.argv[2],
  'F:\\Amozeshyar\\APK\\release\\amoozeshyar.apk',
  path.join(cwd, 'APK', 'release', 'amoozeshyar.apk'),
  path.join(cwd, 'amoozeshyar.apk'),
].filter(Boolean);

const apkPath = apkCandidates.find((p) => fs.existsSync(p));
if (!apkPath) {
  console.error('فایل APK در مسیر F:\\Amozeshyar\\APK\\release\\amoozeshyar.apk پیدا نشد.');
  process.exit(1);
}

const sizeMb = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(2);
console.log(`Repo:    ${REPO}`);
console.log(`Tag:     ${tag}`);
console.log(`Title:   ${title}`);
console.log(`APK:     ${apkPath} (${sizeMb} MB)`);

const check = spawnSync('gh', ['release', 'view', tag, '--repo', REPO], {
  stdio: 'ignore',
});

if (check.status === 0) {
  console.log(`Updating existing release ${tag} and replacing APK...`);
  execFileSync('gh', ['release', 'edit', tag, '--repo', REPO, '--title', title, '--notes', notes], {
    stdio: 'inherit',
  });
  execFileSync('gh', ['release', 'upload', tag, apkPath, '--repo', REPO, '--clobber'], {
    stdio: 'inherit',
  });
} else {
  console.log(`Creating new release ${tag} and uploading APK...`);
  execFileSync(
    'gh',
    ['release', 'create', tag, apkPath, '--repo', REPO, '--title', title, '--notes', notes],
    { stdio: 'inherit' }
  );
}

console.log(`Done! Published: https://github.com/${REPO}/releases/tag/${tag}`);
