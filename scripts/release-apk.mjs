import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = 'Ha1358/amoozeshyar';
const TARGET_BRANCH = 'main';
const cwd = process.cwd();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldRecreate = args.includes('--recreate');
const customApkArg = args.find((arg) => !arg.startsWith('--'));

const versionCandidates = [
  path.join(cwd, 'public', 'version.json'),
  'F:\\Amozeshyar\\amoozeshyar-git\\public\\version.json',
  'F:\\Amozeshyar\\Doroos8-v5\\public\\version.json',
];

const versionPath = versionCandidates.find((p) => fs.existsSync(p));
if (!versionPath) {
  console.error('فایل public/version.json یافت نشد. دستور را داخل پوشه پروژه اجرا کنید.');
  process.exit(1);
}

let versionInfo;
try {
  versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
} catch (err) {
  console.error(`خطا در خواندن فایل ${versionPath}:`, err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const rawVersion = String(versionInfo.version || '').trim();
const version = rawVersion.replace(/^v/i, '');
if (!version) {
  console.error('مقدار version در فایل public/version.json خالی است.');
  process.exit(1);
}

const versionCode = Number(versionInfo.versionCode);
if (!Number.isInteger(versionCode) || versionCode <= 0) {
  console.error('مقدار versionCode در فایل public/version.json معتبر نیست (باید یک عدد صحیح مثبت باشد).');
  process.exit(1);
}

const projectRoot = path.dirname(path.dirname(versionPath));
const pkgJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(pkgJsonPath)) {
  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (pkgJson.version && String(pkgJson.version).trim() !== version) {
      console.warn(
        `هشدار: نسخه package.json (${pkgJson.version}) با نسخه public/version.json (${version}) یکسان نیست.`
      );
    }
  } catch {
    // Ignore optional package.json warning if unreadable
  }
}

const appName = String(versionInfo.appName || 'آموزش یار').trim();
const releaseDate = String(versionInfo.releaseDate || new Date().toISOString().slice(0, 10)).trim();
const tag = `v${version}`;
const title = `${appName} نسخه ${version} (کد ساخت ${versionCode})`;

const rawNotes = String(versionInfo.notes || '').trim();
const notes = [
  `نسخه: ${version}`,
  `کد ساخت (versionCode): ${versionCode}`,
  `تاریخ انتشار: ${releaseDate}`,
  rawNotes ? `\nتغییرات این نسخه:\n${rawNotes}` : '',
]
  .filter(Boolean)
  .join('\n');

const apkCandidates = [
  customApkArg,
  'F:\\Amozeshyar\\APK\\release\\amoozeshyar.apk',
  path.join(cwd, 'APK', 'release', 'amoozeshyar.apk'),
  path.join(cwd, 'amoozeshyar.apk'),
  path.join(projectRoot, 'android', 'app', 'release', 'app-release.apk'),
].filter(Boolean);

const apkPath = apkCandidates.find((p) => fs.existsSync(p));
if (!apkPath) {
  console.error(
    'فایل APK در مسیر F:\\Amozeshyar\\APK\\release\\amoozeshyar.apk یا خروجی اندروید استودیو پیدا نشد.'
  );
  process.exit(1);
}

const sizeMb = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(2);
console.log(`Repo:        ${REPO}`);
console.log(`VersionJson: ${versionPath}`);
console.log(`Version:     ${version}`);
console.log(`VersionCode: ${versionCode}`);
console.log(`ReleaseDate: ${releaseDate}`);
console.log(`Tag:         ${tag}`);
console.log(`Title:       ${title}`);
console.log(`APK:         ${apkPath} (${sizeMb} MB)`);

if (isDryRun) {
  console.log('\n--- Release Notes Preview ---');
  console.log(notes);
  console.log('-----------------------------\nDry run completed. No changes pushed to GitHub.');
  process.exit(0);
}

const ghVersionCheck = spawnSync('gh', ['--version'], { stdio: 'ignore' });
if (ghVersionCheck.status !== 0) {
  console.error('ابزار GitHub CLI (gh) نصب نیست یا در PATH سیستم قرار ندارد.');
  process.exit(1);
}

const ghAuthCheck = spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' });
if (ghAuthCheck.status !== 0) {
  console.error('حساب گیت‌هاب در ابزار gh وارد نشده است. ابتدا دستور زیر را اجرا کنید:\ngh auth login');
  process.exit(1);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amoozeshyar-release-'));
const notesFile = path.join(tempDir, 'release-notes.md');
fs.writeFileSync(notesFile, notes, 'utf8');

let uploadApkPath = apkPath;
if (path.basename(apkPath) !== 'amoozeshyar.apk') {
  uploadApkPath = path.join(tempDir, 'amoozeshyar.apk');
  fs.copyFileSync(apkPath, uploadApkPath);
}

try {
  const check = spawnSync('gh', ['release', 'view', tag, '--repo', REPO], {
    stdio: 'ignore',
  });

  if (check.status === 0) {
    if (shouldRecreate) {
      console.log(`Deleting existing release ${tag} and recreating it...`);
      execFileSync(
        'gh',
        ['release', 'delete', tag, '--repo', REPO, '--yes', '--cleanup-tag'],
        { stdio: 'inherit' }
      );
      execFileSync(
        'gh',
        [
          'release',
          'create',
          tag,
          uploadApkPath,
          '--repo',
          REPO,
          '--target',
          TARGET_BRANCH,
          '--latest',
          '--title',
          title,
          '--notes-file',
          notesFile,
        ],
        { stdio: 'inherit' }
      );
    } else {
      console.log(`Release ${tag} already exists. Updating metadata (versionCode ${versionCode}) and replacing APK...`);
      execFileSync(
        'gh',
        [
          'release',
          'edit',
          tag,
          '--repo',
          REPO,
          '--latest',
          '--title',
          title,
          '--notes-file',
          notesFile,
        ],
        { stdio: 'inherit' }
      );
      execFileSync(
        'gh',
        ['release', 'upload', tag, uploadApkPath, '--repo', REPO, '--clobber'],
        { stdio: 'inherit' }
      );
    }
  } else {
    console.log(`Creating new release ${tag} (version ${version}, versionCode ${versionCode}) and uploading APK...`);
    execFileSync(
      'gh',
      [
        'release',
        'create',
        tag,
        uploadApkPath,
        '--repo',
        REPO,
        '--target',
        TARGET_BRANCH,
        '--latest',
        '--title',
        title,
        '--notes-file',
        notesFile,
      ],
      { stdio: 'inherit' }
    );
  }

  console.log(`Done! Published: https://github.com/${REPO}/releases/tag/${tag}`);
  console.log(`Direct APK URL:  https://github.com/${REPO}/releases/latest/download/amoozeshyar.apk`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
