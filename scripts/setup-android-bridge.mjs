import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidDir = path.join(root, 'android');

if (!fs.existsSync(androidDir)) {
  console.log('[android-bridge] پوشه android در این محیط یافت نشد (تغییرات فقط هنگام اجرا کنار پروژه اندروید اعمال می‌شود).');
  process.exit(0);
}

const pkgJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const versionJsonPath = path.join(root, 'public', 'version.json');
const versionJson = fs.existsSync(versionJsonPath)
  ? JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'))
  : {};

const appVersion = String(pkgJson.version || versionJson.version || '2.3.13');
const appVersionCode = Number(versionJson.versionCode || 36);

function findFileRecursive(dir, targetNames) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFileRecursive(full, targetNames);
      if (found) return found;
    } else if (targetNames.includes(entry.name)) {
      return full;
    }
  }
  return null;
}

// 1) Update android/app/build.gradle (or build.gradle.kts)
const gradleGroovy = path.join(androidDir, 'app', 'build.gradle');
const gradleKts = path.join(androidDir, 'app', 'build.gradle.kts');
if (fs.existsSync(gradleGroovy)) {
  let content = fs.readFileSync(gradleGroovy, 'utf8');
  content = content.replace(/\bversionCode\s+\d+/, `versionCode ${appVersionCode}`);
  content = content.replace(/\bversionName\s+"[^"]*"/, `versionName "${appVersion}"`);
  fs.writeFileSync(gradleGroovy, content, 'utf8');
  console.log(`[android-bridge] Updated build.gradle -> versionName "${appVersion}", versionCode ${appVersionCode}`);
} else if (fs.existsSync(gradleKts)) {
  let content = fs.readFileSync(gradleKts, 'utf8');
  content = content.replace(/\bversionCode\s*=\s*\d+/, `versionCode = ${appVersionCode}`);
  content = content.replace(/\bversionName\s*=\s*"[^"]*"/, `versionName = "${appVersion}"`);
  fs.writeFileSync(gradleKts, content, 'utf8');
  console.log(`[android-bridge] Updated build.gradle.kts -> versionName "${appVersion}", versionCode ${appVersionCode}`);
}

// 1b) Sync AGP version & Maven repository mirrors from android/build.gradle into @capacitor/android
const rootBuildGradle = path.join(androidDir, 'build.gradle');
const capAndroidGradle = path.join(root, 'node_modules', '@capacitor', 'android', 'capacitor', 'build.gradle');
if (fs.existsSync(rootBuildGradle) && fs.existsSync(capAndroidGradle)) {
  const rootGradleText = fs.readFileSync(rootBuildGradle, 'utf8');
  const agpMatch = rootGradleText.match(/com\.android\.tools\.build:gradle:([0-9.]+)/);
  let capGradleText = fs.readFileSync(capAndroidGradle, 'utf8');
  let capChanged = false;

  if (agpMatch?.[1]) {
    const targetAgp = agpMatch[1];
    const updatedAgp = capGradleText.replace(
      /com\.android\.tools\.build:gradle:[0-9.]+/g,
      `com.android.tools.build:gradle:${targetAgp}`
    );
    if (updatedAgp !== capGradleText) {
      capGradleText = updatedAgp;
      capChanged = true;
      console.log(`[android-bridge] Synced @capacitor/android AGP version -> ${targetAgp}`);
    }
  }

  if (rootGradleText.includes('maven.myket.ir') && !capGradleText.includes('maven.myket.ir')) {
    const updatedRepos = capGradleText.replace(
      /(repositories\s*\{\s*\r?\n)/g,
      "$1        maven { url 'https://maven.myket.ir' }\n"
    );
    if (updatedRepos !== capGradleText) {
      capGradleText = updatedRepos;
      capChanged = true;
      console.log('[android-bridge] Added maven.myket.ir repository to @capacitor/android');
    }
  }

  if (capChanged) {
    fs.writeFileSync(capAndroidGradle, capGradleText, 'utf8');
  }
}

// 2) Update android/app/src/main/AndroidManifest.xml
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')) {
    manifest = manifest.replace(
      /<application\b/,
      '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n\n    <application'
    );
  }
  if (!manifest.includes('androidx.core.content.FileProvider')) {
    manifest = manifest.replace(
      /<\/application>/,
      `        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>`
    );
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('[android-bridge] Verified REQUEST_INSTALL_PACKAGES & FileProvider in AndroidManifest.xml');
}

// 3) Update android/app/src/main/res/xml/file_paths.xml
const xmlDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');
const filePathsXml = path.join(xmlDir, 'file_paths.xml');
fs.mkdirSync(xmlDir, { recursive: true });
if (fs.existsSync(filePathsXml)) {
  let xml = fs.readFileSync(filePathsXml, 'utf8');
  let additions = '';
  if (!xml.includes('name="apk_updates"')) {
    additions += '    <external-files-path name="apk_updates" path="." />\n';
  }
  if (!xml.includes('name="apk_cache"')) {
    additions += '    <cache-path name="apk_cache" path="." />\n';
  }
  if (additions) {
    xml = xml.replace(/<\/paths>/, `${additions}</paths>`);
    fs.writeFileSync(filePathsXml, xml, 'utf8');
  }
} else {
  fs.writeFileSync(
    filePathsXml,
    `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="Pictures" />
    <external-files-path name="apk_updates" path="." />
    <cache-path name="apk_cache" path="." />
</paths>
`,
    'utf8'
  );
}
console.log('[android-bridge] Verified res/xml/file_paths.xml');

// 4) Patch MainActivity.java or MainActivity.kt
const javaRoot = path.join(androidDir, 'app', 'src', 'main', 'java');
const mainActivityPath = findFileRecursive(javaRoot, ['MainActivity.java', 'MainActivity.kt']);

if (!mainActivityPath) {
  console.warn('[android-bridge] MainActivity.java / MainActivity.kt not found under android/app/src/main/java');
  process.exit(0);
}

const existingMain = fs.readFileSync(mainActivityPath, 'utf8');
const pkgMatch = existingMain.match(/^\s*package\s+([A-Za-z0-9_.]+)\s*;?/m);
const packageName = pkgMatch ? pkgMatch[1] : 'com.amoozeshyar.app';

if (mainActivityPath.endsWith('.java')) {
  const javaCode = `package ${packageName};

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

public class MainActivity extends BridgeActivity {
    private boolean bridgeAttached = false;
    private boolean versionChangedThisBoot = false;
    private String installAction;
    private final String installToken = UUID.randomUUID().toString();
    private final AtomicBoolean isDownloading = new AtomicBoolean(false);
    private final AtomicBoolean cancelRequested = new AtomicBoolean(false);
    private boolean receiverRegistered = false;

    private final BroadcastReceiver installReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || !installToken.equals(intent.getStringExtra("amoozeshyar_token"))) {
                return;
            }
            int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            switch (status) {
                case PackageInstaller.STATUS_PENDING_USER_ACTION: {
                    Intent confirmIntent = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                        ? intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent.class)
                        : intent.getParcelableExtra(Intent.EXTRA_INTENT);
                    if (confirmIntent != null) {
                        emitProgress(100, "پنجره تایید نصب سیستم باز شد؛ برای تکمیل روی Update / نصب بزنید.", true, false);
                        confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        try {
                            startActivity(confirmIntent);
                        } catch (Exception e) {
                            emitProgress(0, "باز کردن پنجره تایید نصب با خطا مواجه شد.", false, true);
                        }
                    } else {
                        emitProgress(0, "سیستم نتوانست پنجره تایید نصب را آماده کند.", false, true);
                    }
                    break;
                }
                case PackageInstaller.STATUS_SUCCESS:
                    emitProgress(100, "بروزرسانی با موفقیت نصب شد!", true, false);
                    break;
                case PackageInstaller.STATUS_FAILURE_ABORTED:
                    emitProgress(100, "نصب لغو شد. فایل دانلودشده ذخیره است و با کلیک مجدد بدون دانلود دوباره نصب می‌شود.", true, false);
                    break;
                case PackageInstaller.STATUS_FAILURE_CONFLICT:
                    emitProgress(0, "تداخل امضای فایل نصبی: لطفاً از داده‌ها پشتیبان بگیرید، نسخه فعلی را حذف و نسخه جدید را نصب کنید.", false, true);
                    break;
                case PackageInstaller.STATUS_FAILURE_STORAGE:
                    emitProgress(0, "فضای آزاد گوشی برای نصب بروزرسانی کافی نیست.", false, true);
                    break;
                default:
                    emitProgress(0, "نصب بروزرسانی انجام نشد" + (message != null && !message.isEmpty() ? " (" + message + ")" : "."), false, true);
                    break;
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        clearStaleWebViewCacheOnUpgrade();
        super.onCreate(savedInstanceState);

        installAction = getPackageName() + ".INSTALL_RESULT";
        IntentFilter filter = new IntentFilter(installAction);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(installReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(installReceiver, filter);
        }
        receiverRegistered = true;

        attachBridgeIfReady();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                if (wv == null) {
                    finish();
                    return;
                }
                wv.evaluateJavascript(
                    "(window.__amoozeshyarHandleBack ? window.__amoozeshyarHandleBack() : false)",
                    result -> {
                        if (!"true".equals(result)) {
                            runOnUiThread(() -> finish());
                        }
                    }
                );
            }
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        attachBridgeIfReady();
    }

    @Override
    public void onDestroy() {
        if (receiverRegistered) {
            try {
                unregisterReceiver(installReceiver);
            } catch (Exception ignored) {
            }
            receiverRegistered = false;
        }
        super.onDestroy();
    }

    private long getCurrentInstalledVersionCode() {
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? pInfo.getLongVersionCode()
                : pInfo.versionCode;
        } catch (Exception e) {
            return 0L;
        }
    }

    private void clearStaleWebViewCacheOnUpgrade() {
        long currentCode = getCurrentInstalledVersionCode();
        if (currentCode <= 0L) return;
        SharedPreferences prefs = getSharedPreferences("amoozeshyar_native_prefs", MODE_PRIVATE);
        long savedCode = prefs.getLong("last_webview_version_code", -1L);
        if (savedCode != currentCode) {
            versionChangedThisBoot = true;
            String dataDir = getApplicationInfo().dataDir;
            if (dataDir != null) {
                File webviewRoot = new File(dataDir, "app_webview");
                deleteDirRecursive(new File(webviewRoot, "Default/Service Worker"));
                deleteDirRecursive(new File(webviewRoot, "Default/Cache"));
                deleteDirRecursive(new File(webviewRoot, "Default/Code Cache"));
                deleteDirRecursive(new File(webviewRoot, "Service Worker"));
                deleteDirRecursive(new File(webviewRoot, "Cache"));
                deleteDirRecursive(new File(webviewRoot, "Code Cache"));
            }
            prefs.edit().putLong("last_webview_version_code", currentCode).apply();
        }
    }

    private void deleteDirRecursive(File target) {
        if (target == null || !target.exists()) return;
        if (target.isDirectory()) {
            File[] children = target.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteDirRecursive(child);
                }
            }
        }
        try {
            target.delete();
        } catch (Exception ignored) {
        }
    }

    private void attachBridgeIfReady() {
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv == null) return;
        if (versionChangedThisBoot) {
            versionChangedThisBoot = false;
            wv.clearCache(true);
        }
        if (!bridgeAttached) {
            wv.addJavascriptInterface(new AmoozeshyarBridge(), "AmoozeshyarAndroid");
            bridgeAttached = true;
        }
    }

    private void emitProgress(int percent, String status, boolean done, boolean error) {
        String safeStatus = status.replace("\\\\", "\\\\\\\\").replace("'", "\\\\'");
        String js = "window.dispatchEvent(new CustomEvent('amoozeshyar-apk-progress', { detail: {"
            + " percent: " + percent + ","
            + " status: '" + safeStatus + "',"
            + " done: " + done + ","
            + " error: " + error
            + " } }));";
        runOnUiThread(() -> {
            WebView wv = getBridge() != null ? getBridge().getWebView() : null;
            if (wv != null) {
                wv.evaluateJavascript(js, null);
            }
        });
    }

    private File getUpdateDir() {
        File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = getCacheDir();
        if (!dir.exists()) dir.mkdirs();
        return dir;
    }

    private String[] readMetaFile(File metaFile) {
        if (!metaFile.exists()) return null;
        try (FileInputStream fis = new FileInputStream(metaFile)) {
            byte[] data = new byte[(int) Math.min(metaFile.length(), 8192)];
            int read = fis.read(data);
            if (read <= 0) return null;
            String text = new String(data, 0, read, StandardCharsets.UTF_8);
            String[] lines = text.split("\\n", -1);
            return lines.length >= 4 ? lines : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void writeMetaFile(File metaFile, String apkUrl, long totalBytes, long targetVersionCode, String etag) {
        String content = apkUrl + "\\n" + totalBytes + "\\n" + targetVersionCode + "\\n" + (etag != null ? etag : "");
        try (FileOutputStream fos = new FileOutputStream(metaFile)) {
            fos.write(content.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {
        }
    }

    private long parseLongSafe(String raw, long fallback) {
        try {
            return Long.parseLong(raw.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private boolean isCachedApkReady(String apkUrl, long targetVersionCode) {
        if (apkUrl == null || apkUrl.trim().isEmpty()) return false;
        File dir = getUpdateDir();
        File apkFile = new File(dir, "amoozeshyar-update.apk");
        File metaFile = new File(dir, "amoozeshyar-update.meta");
        if (!apkFile.exists() || apkFile.length() < 100_000L) return false;

        String[] meta = readMetaFile(metaFile);
        if (meta == null || !apkUrl.trim().equals(meta[0].trim())) return false;

        long metaTotal = parseLongSafe(meta[1], -1L);
        if (metaTotal > 0 && apkFile.length() != metaTotal) return false;

        PackageInfo archiveInfo = getPackageManager().getPackageArchiveInfo(apkFile.getAbsolutePath(), 0);
        if (archiveInfo == null || !getPackageName().equals(archiveInfo.packageName)) return false;

        long archiveCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
            ? archiveInfo.getLongVersionCode()
            : archiveInfo.versionCode;
        long installedCode = getCurrentInstalledVersionCode();
        if (archiveCode <= installedCode) return false;
        if (targetVersionCode > 0 && archiveCode < targetVersionCode) return false;
        return true;
    }

    private void installApkFile(File apkFile) {
        try {
            installWithPackageInstaller(apkFile);
        } catch (Exception e) {
            fallbackIntentInstall(apkFile);
        }
    }

    private void installWithPackageInstaller(File apkFile) throws Exception {
        PackageInstaller packageInstaller = getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(
            PackageInstaller.SessionParams.MODE_FULL_INSTALL
        );
        params.setSize(apkFile.length());
        int sessionId = packageInstaller.createSession(params);
        try (PackageInstaller.Session session = packageInstaller.openSession(sessionId)) {
            try (OutputStream out = session.openWrite("base.apk", 0, apkFile.length());
                 BufferedInputStream in = new BufferedInputStream(new FileInputStream(apkFile), 65536)) {
                byte[] buf = new byte[65536];
                int read;
                while ((read = in.read(buf)) != -1) {
                    out.write(buf, 0, read);
                }
                session.fsync(out);
            }

            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                piFlags |= PendingIntent.FLAG_MUTABLE;
            }
            Intent callbackIntent = new Intent(installAction);
            callbackIntent.setPackage(getPackageName());
            callbackIntent.putExtra("amoozeshyar_token", installToken);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                MainActivity.this,
                sessionId,
                callbackIntent,
                piFlags
            );
            session.commit(pendingIntent.getIntentSender());
        }
    }

    private void fallbackIntentInstall(File apkFile) {
        runOnUiThread(() -> {
            try {
                Uri apkUri = FileProvider.getUriForFile(
                    MainActivity.this,
                    getPackageName() + ".fileprovider",
                    apkFile
                );
                String[] systemInstallers = new String[] {
                    "com.google.android.packageinstaller",
                    "com.android.packageinstaller",
                    "com.miui.packageinstaller",
                    "com.samsung.android.packageinstaller"
                };
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                PackageManager pm = getPackageManager();
                for (String pkg : systemInstallers) {
                    Intent targeted = new Intent(installIntent);
                    targeted.setPackage(pkg);
                    ResolveInfo info = pm.resolveActivity(targeted, 0);
                    if (info != null) {
                        installIntent.setPackage(pkg);
                        break;
                    }
                }
                emitProgress(100, "پنجره نصب باز شد.", true, false);
                startActivity(installIntent);
            } catch (Exception err) {
                emitProgress(0, "باز کردن پنجره نصب اندروید ناموفق بود.", false, true);
            }
        });
    }

    public class AmoozeshyarBridge {
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> finishAffinity());
        }

        @JavascriptInterface
        public long getInstalledVersionCode() {
            return getCurrentInstalledVersionCode();
        }

        @JavascriptInterface
        public boolean hasCachedApkUpdate(String apkUrl) {
            return isCachedApkReady(apkUrl, 0L);
        }

        @JavascriptInterface
        public boolean hasCachedApkUpdateForVersion(String apkUrl, int targetVersionCode) {
            return isCachedApkReady(apkUrl, targetVersionCode);
        }

        @JavascriptInterface
        public String saveTextFile(String fileName, String content, String mimeType) {
            if (fileName == null || content == null) return "";
            String safeName = fileName.trim().replaceAll("[/\\\\?%*:|<>]", "_").replace('"', '_');
            if (safeName.isEmpty()) safeName = "amoozeshyar-file.json";
            String cleanMime = (mimeType != null && !mimeType.trim().isEmpty())
                ? mimeType.split(";")[0].trim()
                : "application/json";
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Downloads.MIME_TYPE, cleanMime);
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Amoozeshyar");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                            if (out != null) {
                                out.write(bytes);
                                out.flush();
                                return "Download/Amoozeshyar/" + safeName;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            try {
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) dir = getCacheDir();
                if (!dir.exists()) dir.mkdirs();
                File outFile = new File(dir, safeName);
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(bytes);
                    fos.flush();
                }
                return outFile.getAbsolutePath();
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean openExternalUrl(String targetUrl) {
            if (targetUrl == null || targetUrl.trim().isEmpty()) return false;
            final String clean = targetUrl.trim();
            runOnUiThread(() -> {
                try {
                    Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(clean));
                    viewIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(viewIntent);
                } catch (Exception ignored) {
                }
            });
            return true;
        }

        @JavascriptInterface
        public void cancelApkDownload() {
            cancelRequested.set(true);
        }

        @JavascriptInterface
        public boolean installApkUpdate(String apkUrl) {
            return installApkUpdateForVersion(apkUrl, 0);
        }

        private HttpURLConnection openHttpWithRedirects(String startUrl, String rangeHeader, int connectMs, int readMs) throws Exception {
            String currentUrl = startUrl;
            for (int hop = 0; hop < 8; hop++) {
                URL url = new URL(currentUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(false);
                conn.setUseCaches(false);
                conn.setConnectTimeout(connectMs);
                conn.setReadTimeout(readMs);
                conn.setRequestProperty("User-Agent", "Amoozeshyar-Android");
                conn.setRequestProperty("Accept-Encoding", "identity");
                conn.setRequestProperty("Connection", "keep-alive");
                if (rangeHeader != null && !rangeHeader.isEmpty()) {
                    conn.setRequestProperty("Range", rangeHeader);
                }
                int code = conn.getResponseCode();
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    String next = conn.getHeaderField("Location");
                    conn.disconnect();
                    if (next == null || next.isEmpty()) return null;
                    currentUrl = new URL(url, next).toString();
                    continue;
                }
                return conn;
            }
            return null;
        }

        private String formatDownloadStatus(int pct, long downloaded, long total, long bytesPerSec) {
            StringBuilder sb = new StringBuilder();
            sb.append("در حال دریافت نسخه جدید: ").append(pct).append("٪");
            if (total > 0) {
                double dlMb = downloaded / (1024.0 * 1024.0);
                double totMb = total / (1024.0 * 1024.0);
                sb.append(String.format(Locale.US, " (%.1f از %.1f مگابایت", dlMb, totMb));
                if (bytesPerSec > 0) {
                    if (bytesPerSec >= 1024L * 1024L) {
                        sb.append(String.format(Locale.US, " · %.1f مگابایت/ثانیه", bytesPerSec / (1024.0 * 1024.0)));
                    } else {
                        sb.append(String.format(Locale.US, " · %d کیلوبایت/ثانیه", Math.max(1L, bytesPerSec / 1024L)));
                    }
                }
                sb.append(")");
            }
            return sb.toString();
        }

        private void deleteChunkFiles(File dir) {
            for (int i = 0; i < 8; i++) {
                File cf = new File(dir, "amoozeshyar-update.seg" + i);
                if (cf.exists()) cf.delete();
            }
            File cMeta = new File(dir, "amoozeshyar-update.chunks.meta");
            if (cMeta.exists()) cMeta.delete();
        }

        @JavascriptInterface
        public boolean installApkUpdateForVersion(String apkUrl, int targetVersionCode) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && !getPackageManager().canRequestPackageInstalls()) {
                emitProgress(0, "لطفاً مجوز نصب از این برنامه را فعال کرده و دوباره دکمه بروزرسانی را بزنید.", false, true);
                runOnUiThread(() -> {
                    Intent permIntent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())
                    );
                    startActivity(permIntent);
                });
                return false;
            }

            if (isCachedApkReady(apkUrl, targetVersionCode)) {
                File cachedApk = new File(getUpdateDir(), "amoozeshyar-update.apk");
                emitProgress(100, "فایل نسخه جدید آماده است؛ در حال باز کردن پنجره نصب سیستم...", false, false);
                new Thread(() -> installApkFile(cachedApk)).start();
                return true;
            }

            if (!isDownloading.compareAndSet(false, true)) {
                return true;
            }
            cancelRequested.set(false);

            new Thread(() -> {
                HttpURLConnection probeConn = null;
                try {
                    final String cleanUrl = apkUrl != null ? apkUrl.trim() : "";
                    final File dir = getUpdateDir();
                    final File finalFile = new File(dir, "amoozeshyar-update.apk");
                    final File finalMeta = new File(dir, "amoozeshyar-update.meta");
                    final File partFile = new File(dir, "amoozeshyar-update.apk.part");
                    final File partMeta = new File(dir, "amoozeshyar-update.part.meta");
                    final File chunksMeta = new File(dir, "amoozeshyar-update.chunks.meta");

                    emitProgress(5, "در حال اتصال و یافتن سریع‌ترین مسیر دریافت...", false, false);
                    probeConn = openHttpWithRedirects(cleanUrl, "bytes=0-0", 12000, 15000);
                    if (probeConn == null) {
                        emitProgress(0, "اتصال به سرور بروزرسانی برقرار نشد.", false, true);
                        return;
                    }

                    int probeCode = probeConn.getResponseCode();
                    if (probeCode < 200 || probeCode >= 300) {
                        emitProgress(0, "دریافت فایل از سرور ناموفق بود (کد " + probeCode + ").", false, true);
                        return;
                    }

                    String resolvedCdnUrl = probeConn.getURL().toString();
                    String etag = probeConn.getHeaderField("ETag");
                    long total = -1L;

                    if (probeCode == HttpURLConnection.HTTP_PARTIAL) {
                        String cr = probeConn.getHeaderField("Content-Range");
                        if (cr != null) {
                            int slashIdx = cr.lastIndexOf('/');
                            if (slashIdx > 0) {
                                total = parseLongSafe(cr.substring(slashIdx + 1), -1L);
                            }
                        }
                    } else {
                        total = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                            ? probeConn.getContentLengthLong()
                            : probeConn.getContentLength();
                    }

                    if (probeCode == HttpURLConnection.HTTP_PARTIAL && total >= 524288L) {
                        try {
                            probeConn.disconnect();
                        } catch (Exception ignored) {
                        }
                        probeConn = null;

                        final int chunkCount = total >= 2_000_000L ? 6 : 4;
                        boolean canResumeChunks = false;
                        String[] cMeta = readMetaFile(chunksMeta);
                        if (cMeta != null && cMeta.length >= 5) {
                            long metaTotal = parseLongSafe(cMeta[1], -1L);
                            long metaTarget = parseLongSafe(cMeta[2], 0L);
                            int metaChunks = (int) parseLongSafe(cMeta[4], 0L);
                            String metaEtag = cMeta[3].trim();
                            boolean etagMatch = (etag == null || etag.isEmpty() || metaEtag.isEmpty() || etag.equals(metaEtag));
                            if (cleanUrl.equals(cMeta[0].trim())
                                    && metaTotal == total
                                    && (targetVersionCode <= 0 || metaTarget == targetVersionCode)
                                    && metaChunks == chunkCount
                                    && etagMatch) {
                                canResumeChunks = true;
                            }
                        }

                        if (!canResumeChunks) {
                            deleteChunkFiles(dir);
                            String chunkContent = cleanUrl + "\\n" + total + "\\n" + targetVersionCode + "\\n"
                                + (etag != null ? etag : "") + "\\n" + chunkCount;
                            try (FileOutputStream fos = new FileOutputStream(chunksMeta)) {
                                fos.write(chunkContent.getBytes(StandardCharsets.UTF_8));
                            } catch (Exception ignored) {
                            }
                        }

                        final long[] starts = new long[chunkCount];
                        final long[] ends = new long[chunkCount];
                        final File[] segFiles = new File[chunkCount];
                        long alreadyBytes = 0L;
                        for (int i = 0; i < chunkCount; i++) {
                            starts[i] = (total * i) / chunkCount;
                            ends[i] = (i == chunkCount - 1) ? (total - 1L) : ((total * (i + 1L)) / chunkCount - 1L);
                            long expectedLen = ends[i] - starts[i] + 1L;
                            segFiles[i] = new File(dir, "amoozeshyar-update.seg" + i);
                            if (segFiles[i].exists() && segFiles[i].length() > expectedLen) {
                                segFiles[i].delete();
                            }
                            if (segFiles[i].exists()) {
                                alreadyBytes += segFiles[i].length();
                            }
                        }

                        final long finalTotal = total;
                        final AtomicLong downloadedAtomic = new AtomicLong(alreadyBytes);
                        final AtomicLong speedWindowBytes = new AtomicLong(0L);
                        final AtomicLong speedWindowStartMs = new AtomicLong(System.currentTimeMillis());
                        final AtomicLong lastEmitMs = new AtomicLong(0L);
                        final AtomicBoolean chunkFailed = new AtomicBoolean(false);
                        final AtomicReference<String> activeUrlRef = new AtomicReference<>(resolvedCdnUrl);
                        final Object progressLock = new Object();
                        final int[] lastPctHolder = new int[] {
                            (int) Math.min(99, Math.max(5, (alreadyBytes * 100L) / finalTotal))
                        };

                        if (alreadyBytes > 0) {
                            emitProgress(lastPctHolder[0], "ادامه دریافت سریع (" + chunkCount + " کانال هم‌زمان): " + lastPctHolder[0] + "٪", false, false);
                        }

                        Thread[] workers = new Thread[chunkCount];
                        for (int i = 0; i < chunkCount; i++) {
                            final int segIdx = i;
                            final long segStart = starts[i];
                            final long segEnd = ends[i];
                            final long segExpected = segEnd - segStart + 1L;
                            final File segFile = segFiles[i];

                            workers[i] = new Thread(() -> {
                                for (int attempt = 0; attempt < 3; attempt++) {
                                    if (cancelRequested.get() || chunkFailed.get()) return;
                                    HttpURLConnection segConn = null;
                                    try {
                                        long existing = segFile.exists() ? segFile.length() : 0L;
                                        if (existing >= segExpected) return;

                                        long reqStart = segStart + existing;
                                        String target = attempt == 0 ? activeUrlRef.get() : cleanUrl;
                                        segConn = openHttpWithRedirects(target, "bytes=" + reqStart + "-" + segEnd, 12000, 15000);
                                        if (segConn == null) {
                                            if (attempt < 2) continue;
                                            chunkFailed.set(true);
                                            return;
                                        }
                                        int code = segConn.getResponseCode();
                                        if ((code == 403 || code == 410) && !cleanUrl.equals(target)) {
                                            segConn.disconnect();
                                            segConn = openHttpWithRedirects(cleanUrl, "bytes=" + reqStart + "-" + segEnd, 12000, 15000);
                                            if (segConn == null) {
                                                if (attempt < 2) continue;
                                                chunkFailed.set(true);
                                                return;
                                            }
                                            code = segConn.getResponseCode();
                                            activeUrlRef.set(segConn.getURL().toString());
                                        }
                                        if (code != HttpURLConnection.HTTP_PARTIAL && !(code == HttpURLConnection.HTTP_OK && reqStart == 0L)) {
                                            if (attempt < 2) continue;
                                            chunkFailed.set(true);
                                            return;
                                        }

                                        try (BufferedInputStream in = new BufferedInputStream(segConn.getInputStream(), 131072);
                                             BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(segFile, existing > 0L), 131072)) {
                                            byte[] buf = new byte[131072];
                                            long written = existing;
                                            int read;
                                            while (written < segExpected && (read = in.read(buf)) != -1) {
                                                if (cancelRequested.get()) {
                                                    out.flush();
                                                    return;
                                                }
                                                int toWrite = (int) Math.min((long) read, segExpected - written);
                                                if (toWrite <= 0) break;
                                                out.write(buf, 0, toWrite);
                                                written += toWrite;
                                                long dl = downloadedAtomic.addAndGet(toWrite);
                                                long winBytes = speedWindowBytes.addAndGet(toWrite);
                                                long now = System.currentTimeMillis();
                                                int pct = (int) Math.min(99, (dl * 100L) / finalTotal);
                                                synchronized (progressLock) {
                                                    if (now - lastEmitMs.get() >= 450L || pct >= lastPctHolder[0] + 3) {
                                                        long elapsed = Math.max(1L, now - speedWindowStartMs.get());
                                                        long speed = (winBytes * 1000L) / elapsed;
                                                        if (elapsed >= 3000L) {
                                                            speedWindowStartMs.set(now);
                                                            speedWindowBytes.set(0L);
                                                        }
                                                        lastEmitMs.set(now);
                                                        lastPctHolder[0] = Math.max(lastPctHolder[0], pct);
                                                        emitProgress(lastPctHolder[0], formatDownloadStatus(lastPctHolder[0], dl, finalTotal, speed), false, false);
                                                    }
                                                }
                                            }
                                            out.flush();
                                        }
                                        if (segFile.length() >= segExpected) return;
                                    } catch (Exception ignored) {
                                        if (attempt >= 2) {
                                            chunkFailed.set(true);
                                        }
                                    } finally {
                                        if (segConn != null) segConn.disconnect();
                                    }
                                }
                                if (!segFile.exists() || segFile.length() < segExpected) {
                                    chunkFailed.set(true);
                                }
                            });
                            workers[i].start();
                        }

                        for (Thread w : workers) {
                            try {
                                w.join();
                            } catch (InterruptedException ignored) {
                            }
                        }

                        if (cancelRequested.get()) {
                            emitProgress(0, "دریافت متوقف شد؛ پیشرفت ذخیره شده و با تلاش مجدد ادامه می‌یابد.", false, true);
                            return;
                        }

                        long verifiedSum = 0L;
                        boolean allOk = !chunkFailed.get();
                        for (int i = 0; i < chunkCount; i++) {
                            long expectedLen = ends[i] - starts[i] + 1L;
                            if (!segFiles[i].exists() || segFiles[i].length() != expectedLen) {
                                allOk = false;
                                break;
                            }
                            verifiedSum += segFiles[i].length();
                        }

                        if (!allOk || verifiedSum != finalTotal) {
                            emitProgress(0, "دریافت فایل نیمه‌تمام ماند؛ با زدن دوباره دکمه، از ادامه بخش‌های دریافت‌شده دانلود می‌شود.", false, true);
                            return;
                        }

                        emitProgress(99, "دریافت کامل شد؛ در حال ترکیب و بررسی نهایی فایل...", false, false);
                        if (partFile.exists()) partFile.delete();
                        try (BufferedOutputStream mergedOut = new BufferedOutputStream(new FileOutputStream(partFile, false), 262144)) {
                            byte[] mBuf = new byte[262144];
                            for (int i = 0; i < chunkCount; i++) {
                                try (BufferedInputStream segIn = new BufferedInputStream(new FileInputStream(segFiles[i]), 262144)) {
                                    int r;
                                    while ((r = segIn.read(mBuf)) != -1) {
                                        mergedOut.write(mBuf, 0, r);
                                    }
                                }
                            }
                            mergedOut.flush();
                        }
                        deleteChunkFiles(dir);
                    } else {
                        // Single-stream fallback (if server does not support Range or file is tiny)
                        long existingPartLen = 0L;
                        String[] pMeta = readMetaFile(partMeta);
                        if (probeCode == HttpURLConnection.HTTP_OK) {
                            if (partFile.exists()) partFile.delete();
                            partMeta.delete();
                        } else if (partFile.exists() && pMeta != null && cleanUrl.equals(pMeta[0].trim())) {
                            existingPartLen = partFile.length();
                        }
                        writeMetaFile(partMeta, cleanUrl, total, targetVersionCode, etag);

                        try (BufferedInputStream in = new BufferedInputStream(probeConn.getInputStream(), 131072);
                             BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(partFile, false), 131072)) {
                            byte[] buf = new byte[131072];
                            long downloaded = existingPartLen;
                            long winBytes = 0L;
                            long winStart = System.currentTimeMillis();
                            long lastEmit = 0L;
                            int lastPct = 5;
                            int read;
                            while ((read = in.read(buf)) != -1) {
                                if (cancelRequested.get()) {
                                    emitProgress(0, "دریافت متوقف شد.", false, true);
                                    return;
                                }
                                out.write(buf, 0, read);
                                downloaded += read;
                                winBytes += read;
                                long now = System.currentTimeMillis();
                                if (total > 0 && (now - lastEmit >= 450L)) {
                                    int pct = (int) Math.min(99, (downloaded * 100L) / total);
                                    long elapsed = Math.max(1L, now - winStart);
                                    long speed = (winBytes * 1000L) / elapsed;
                                    if (elapsed >= 3000L) {
                                        winStart = now;
                                        winBytes = 0L;
                                    }
                                    lastEmit = now;
                                    lastPct = Math.max(lastPct, pct);
                                    emitProgress(lastPct, formatDownloadStatus(lastPct, downloaded, total, speed), false, false);
                                }
                            }
                            out.flush();
                        }
                        if (total > 0 && partFile.length() != total) {
                            emitProgress(0, "دریافت فایل نیمه‌تمام ماند؛ لطفاً دوباره امتحان کنید.", false, true);
                            return;
                        }
                    }

                    PackageInfo archiveInfo = getPackageManager().getPackageArchiveInfo(partFile.getAbsolutePath(), 0);
                    if (archiveInfo == null || !getPackageName().equals(archiveInfo.packageName)) {
                        partFile.delete();
                        partMeta.delete();
                        emitProgress(0, "فایل دریافت‌شده معتبر نیست. لطفاً دوباره امتحان کنید.", false, true);
                        return;
                    }

                    if (finalFile.exists()) finalFile.delete();
                    if (!partFile.renameTo(finalFile)) {
                        try (BufferedInputStream copyIn = new BufferedInputStream(new FileInputStream(partFile), 262144);
                             BufferedOutputStream copyOut = new BufferedOutputStream(new FileOutputStream(finalFile), 262144)) {
                            byte[] cpBuf = new byte[262144];
                            int cpRead;
                            while ((cpRead = copyIn.read(cpBuf)) != -1) {
                                copyOut.write(cpBuf, 0, cpRead);
                            }
                        }
                        partFile.delete();
                    }
                    partMeta.delete();
                    writeMetaFile(finalMeta, cleanUrl, finalFile.length(), targetVersionCode, etag);

                    emitProgress(100, "دریافت کامل شد؛ در حال باز کردن پنجره نصب سیستم...", false, false);
                    installApkFile(finalFile);
                } catch (Exception e) {
                    emitProgress(0, "خطا در دریافت فایل نصبی؛ پیشرفت دانلود ذخیره شد و با تلاش مجدد ادامه می‌یابد.", false, true);
                } finally {
                    isDownloading.set(false);
                    if (probeConn != null) probeConn.disconnect();
                }
            }).start();

            return true;
        }
    }
}
`;
  fs.writeFileSync(mainActivityPath, javaCode, 'utf8');
  console.log(`[android-bridge] Updated ${path.relative(root, mainActivityPath)}`);
} else {
  const ktCode = `package ${packageName}

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import android.webkit.JavascriptInterface
import androidx.activity.OnBackPressedCallback
import androidx.core.content.FileProvider
import com.getcapacitor.BridgeActivity
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

class MainActivity : BridgeActivity() {
    private var bridgeAttached = false
    private var versionChangedThisBoot = false
    private var installAction = ""
    private val installToken = UUID.randomUUID().toString()
    private val isDownloading = AtomicBoolean(false)
    private val cancelRequested = AtomicBoolean(false)
    private var receiverRegistered = false

    private val installReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent == null || installToken != intent.getStringExtra("amoozeshyar_token")) return
            val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
            val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)
            when (status) {
                PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                    val confirmIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra(Intent.EXTRA_INTENT)
                    }
                    if (confirmIntent != null) {
                        emitProgress(100, "پنجره تایید نصب سیستم باز شد؛ برای تکمیل روی Update / نصب بزنید.", true, false)
                        confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        try {
                            startActivity(confirmIntent)
                        } catch (_: Exception) {
                            emitProgress(0, "باز کردن پنجره تایید نصب با خطا مواجه شد.", false, true)
                        }
                    } else {
                        emitProgress(0, "سیستم نتوانست پنجره تایید نصب را آماده کند.", false, true)
                    }
                }
                PackageInstaller.STATUS_SUCCESS -> {
                    emitProgress(100, "بروزرسانی با موفقیت نصب شد!", true, false)
                }
                PackageInstaller.STATUS_FAILURE_ABORTED -> {
                    emitProgress(100, "نصب لغو شد. فایل دانلودشده ذخیره است و با کلیک مجدد بدون دانلود دوباره نصب می‌شود.", true, false)
                }
                PackageInstaller.STATUS_FAILURE_CONFLICT -> {
                    emitProgress(0, "تداخل امضای فایل نصبی: لطفاً از داده‌ها پشتیبان بگیرید، نسخه فعلی را حذف و نسخه جدید را نصب کنید.", false, true)
                }
                PackageInstaller.STATUS_FAILURE_STORAGE -> {
                    emitProgress(0, "فضای آزاد گوشی برای نصب بروزرسانی کافی نیست.", false, true)
                }
                else -> {
                    val suffix = if (!message.isNullOrEmpty()) " ($message)" else "."
                    emitProgress(0, "نصب بروزرسانی انجام نشد$suffix", false, true)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        clearStaleWebViewCacheOnUpgrade()
        super.onCreate(savedInstanceState)

        installAction = "$packageName.INSTALL_RESULT"
        val filter = IntentFilter(installAction)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(installReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(installReceiver, filter)
        }
        receiverRegistered = true

        attachBridgeIfReady()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val wv = bridge?.webView
                if (wv == null) {
                    finish()
                    return
                }
                wv.evaluateJavascript(
                    "(window.__amoozeshyarHandleBack ? window.__amoozeshyarHandleBack() : false)"
                ) { result ->
                    if (result != "true") {
                        runOnUiThread { finish() }
                    }
                }
            }
        })
    }

    override fun onStart() {
        super.onStart()
        attachBridgeIfReady()
    }

    override fun onDestroy() {
        if (receiverRegistered) {
            try {
                unregisterReceiver(installReceiver)
            } catch (_: Exception) {
            }
            receiverRegistered = false
        }
        super.onDestroy()
    }

    private fun getCurrentInstalledVersionCode(): Long {
        return try {
            val pInfo = packageManager.getPackageInfo(packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode.toLong()
            }
        } catch (_: Exception) {
            0L
        }
    }

    private fun clearStaleWebViewCacheOnUpgrade() {
        val currentCode = getCurrentInstalledVersionCode()
        if (currentCode <= 0L) return
        val prefs = getSharedPreferences("amoozeshyar_native_prefs", MODE_PRIVATE)
        val savedCode = prefs.getLong("last_webview_version_code", -1L)
        if (savedCode != currentCode) {
            versionChangedThisBoot = true
            val dataDir = applicationInfo.dataDir
            if (dataDir != null) {
                val webviewRoot = File(dataDir, "app_webview")
                deleteDirRecursive(File(webviewRoot, "Default/Service Worker"))
                deleteDirRecursive(File(webviewRoot, "Default/Cache"))
                deleteDirRecursive(File(webviewRoot, "Default/Code Cache"))
                deleteDirRecursive(File(webviewRoot, "Service Worker"))
                deleteDirRecursive(File(webviewRoot, "Cache"))
                deleteDirRecursive(File(webviewRoot, "Code Cache"))
            }
            prefs.edit().putLong("last_webview_version_code", currentCode).apply()
        }
    }

    private fun deleteDirRecursive(target: File?) {
        if (target == null || !target.exists()) return
        if (target.isDirectory) {
            target.listFiles()?.forEach { deleteDirRecursive(it) }
        }
        try {
            target.delete()
        } catch (_: Exception) {
        }
    }

    private fun attachBridgeIfReady() {
        val wv = bridge?.webView ?: return
        if (versionChangedThisBoot) {
            versionChangedThisBoot = false
            wv.clearCache(true)
        }
        if (!bridgeAttached) {
            wv.addJavascriptInterface(AmoozeshyarBridge(), "AmoozeshyarAndroid")
            bridgeAttached = true
        }
    }

    private fun emitProgress(percent: Int, status: String, done: Boolean, error: Boolean) {
        val safeStatus = status.replace("\\\\", "\\\\\\\\").replace("'", "\\\\'")
        val js = "window.dispatchEvent(new CustomEvent('amoozeshyar-apk-progress', { detail: { percent: $percent, status: '$safeStatus', done: $done, error: $error } }));"
        runOnUiThread {
            bridge?.webView?.evaluateJavascript(js, null)
        }
    }

    private fun getUpdateDir(): File {
        val dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: cacheDir
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun readMetaFile(metaFile: File): List<String>? {
        if (!metaFile.exists()) return null
        return try {
            val lines = metaFile.readText(Charsets.UTF_8).split("\\n")
            if (lines.size >= 4) lines else null
        } catch (_: Exception) {
            null
        }
    }

    private fun writeMetaFile(metaFile: File, apkUrl: String, totalBytes: Long, targetVersionCode: Long, etag: String?) {
        try {
            metaFile.writeText("$apkUrl\\n$totalBytes\\n$targetVersionCode\\n\${etag ?: ""}", Charsets.UTF_8)
        } catch (_: Exception) {
        }
    }

    private fun isCachedApkReady(apkUrl: String?, targetVersionCode: Long): Boolean {
        val cleanUrl = apkUrl?.trim() ?: ""
        if (cleanUrl.isEmpty()) return false
        val dir = getUpdateDir()
        val apkFile = File(dir, "amoozeshyar-update.apk")
        val metaFile = File(dir, "amoozeshyar-update.meta")
        if (!apkFile.exists() || apkFile.length() < 100_000L) return false

        val meta = readMetaFile(metaFile) ?: return false
        if (cleanUrl != meta[0].trim()) return false

        val metaTotal = meta[1].trim().toLongOrNull() ?: -1L
        if (metaTotal > 0 && apkFile.length() != metaTotal) return false

        val archiveInfo = packageManager.getPackageArchiveInfo(apkFile.absolutePath, 0) ?: return false
        if (packageName != archiveInfo.packageName) return false

        val archiveCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            archiveInfo.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            archiveInfo.versionCode.toLong()
        }
        val installedCode = getCurrentInstalledVersionCode()
        if (archiveCode <= installedCode) return false
        if (targetVersionCode > 0 && archiveCode < targetVersionCode) return false
        return true
    }

    private fun installApkFile(apkFile: File) {
        try {
            installWithPackageInstaller(apkFile)
        } catch (_: Exception) {
            fallbackIntentInstall(apkFile)
        }
    }

    private fun installWithPackageInstaller(apkFile: File) {
        val packageInstaller = packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setSize(apkFile.length())
        }
        val sessionId = packageInstaller.createSession(params)
        packageInstaller.openSession(sessionId).use { session ->
            session.openWrite("base.apk", 0, apkFile.length()).use { out ->
                BufferedInputStream(FileInputStream(apkFile), 65536).use { input ->
                    val buf = ByteArray(65536)
                    while (true) {
                        val read = input.read(buf)
                        if (read == -1) break
                        out.write(buf, 0, read)
                    }
                }
                session.fsync(out)
            }

            val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val callbackIntent = Intent(installAction).apply {
                setPackage(this@MainActivity.packageName)
                putExtra("amoozeshyar_token", installToken)
            }
            val pendingIntent = PendingIntent.getBroadcast(this@MainActivity, sessionId, callbackIntent, piFlags)
            session.commit(pendingIntent.intentSender)
        }
    }

    private fun fallbackIntentInstall(apkFile: File) {
        runOnUiThread {
            try {
                val apkUri = FileProvider.getUriForFile(
                    this@MainActivity,
                    "$packageName.fileprovider",
                    apkFile
                )
                val systemInstallers = listOf(
                    "com.google.android.packageinstaller",
                    "com.android.packageinstaller",
                    "com.miui.packageinstaller",
                    "com.samsung.android.packageinstaller"
                )
                val installIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(apkUri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                for (pkg in systemInstallers) {
                    val targeted = Intent(installIntent).setPackage(pkg)
                    if (packageManager.resolveActivity(targeted, 0) != null) {
                        installIntent.setPackage(pkg)
                        break
                    }
                }
                emitProgress(100, "پنجره نصب باز شد.", true, false)
                startActivity(installIntent)
            } catch (_: Exception) {
                emitProgress(0, "باز کردن پنجره نصب اندروید ناموفق بود.", false, true)
            }
        }
    }

    inner class AmoozeshyarBridge {
        @JavascriptInterface
        fun exitApp() {
            runOnUiThread { finishAffinity() }
        }

        @JavascriptInterface
        fun getInstalledVersionCode(): Long = getCurrentInstalledVersionCode()

        @JavascriptInterface
        fun hasCachedApkUpdate(apkUrl: String): Boolean = isCachedApkReady(apkUrl, 0L)

        @JavascriptInterface
        fun hasCachedApkUpdateForVersion(apkUrl: String, targetVersionCode: Int): Boolean =
            isCachedApkReady(apkUrl, targetVersionCode.toLong())

        @JavascriptInterface
        fun saveTextFile(fileName: String?, content: String?, mimeType: String?): String {
            if (fileName == null || content == null) return ""
            var safeName = fileName.trim().replace(Regex("[/\\\\?%*:|<>]"), "_").replace('"', '_')
            if (safeName.isEmpty()) safeName = "amoozeshyar-file.json"
            val cleanMime = mimeType?.split(";")?.firstOrNull()?.trim()?.takeIf { it.isNotEmpty() }
                ?: "application/json"
            val bytes = content.toByteArray(Charsets.UTF_8)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    val values = ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, safeName)
                        put(MediaStore.Downloads.MIME_TYPE, cleanMime)
                        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Amoozeshyar")
                    }
                    val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    if (uri != null) {
                        contentResolver.openOutputStream(uri)?.use { out ->
                            out.write(bytes)
                            out.flush()
                            return "Download/Amoozeshyar/$safeName"
                        }
                    }
                } catch (_: Exception) {
                }
            }

            return try {
                val dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: cacheDir
                if (!dir.exists()) dir.mkdirs()
                val outFile = File(dir, safeName)
                FileOutputStream(outFile).use { fos ->
                    fos.write(bytes)
                    fos.flush()
                }
                outFile.absolutePath
            } catch (_: Exception) {
                ""
            }
        }

        @JavascriptInterface
        fun openExternalUrl(targetUrl: String?): Boolean {
            val clean = targetUrl?.trim() ?: ""
            if (clean.isEmpty()) return false
            runOnUiThread {
                try {
                    val viewIntent = Intent(Intent.ACTION_VIEW, Uri.parse(clean)).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(viewIntent)
                } catch (_: Exception) {
                }
            }
            return true
        }

        @JavascriptInterface
        fun cancelApkDownload() {
            cancelRequested.set(true)
        }

        @JavascriptInterface
        fun installApkUpdate(apkUrl: String): Boolean = installApkUpdateForVersion(apkUrl, 0)

        private fun openHttpWithRedirects(startUrl: String, rangeHeader: String?, connectMs: Int, readMs: Int): HttpURLConnection? {
            var currentUrl = startUrl
            for (hop in 0 until 8) {
                val url = URL(currentUrl)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    instanceFollowRedirects = false
                    useCaches = false
                    connectTimeout = connectMs
                    readTimeout = readMs
                    setRequestProperty("User-Agent", "Amoozeshyar-Android")
                    setRequestProperty("Accept-Encoding", "identity")
                    setRequestProperty("Connection", "keep-alive")
                    if (!rangeHeader.isNullOrEmpty()) {
                        setRequestProperty("Range", rangeHeader)
                    }
                }
                val code = conn.responseCode
                if (code in listOf(301, 302, 303, 307, 308)) {
                    val next = conn.getHeaderField("Location")
                    conn.disconnect()
                    if (next.isNullOrEmpty()) return null
                    currentUrl = URL(url, next).toString()
                    continue
                }
                return conn
            }
            return null
        }

        private fun formatDownloadStatus(pct: Int, downloaded: Long, total: Long, bytesPerSec: Long): String {
            val sb = StringBuilder()
            sb.append("در حال دریافت نسخه جدید: ").append(pct).append("٪")
            if (total > 0) {
                val dlMb = downloaded / (1024.0 * 1024.0)
                val totMb = total / (1024.0 * 1024.0)
                sb.append(String.format(Locale.US, " (%.1f از %.1f مگابایت", dlMb, totMb))
                if (bytesPerSec > 0) {
                    if (bytesPerSec >= 1024L * 1024L) {
                        sb.append(String.format(Locale.US, " · %.1f مگابایت/ثانیه", bytesPerSec / (1024.0 * 1024.0)))
                    } else {
                        sb.append(String.format(Locale.US, " · %d کیلوبایت/ثانیه", maxOf(1L, bytesPerSec / 1024L)))
                    }
                }
                sb.append(")")
            }
            return sb.toString()
        }

        private fun deleteChunkFiles(dir: File) {
            for (i in 0 until 8) {
                val cf = File(dir, "amoozeshyar-update.seg$i")
                if (cf.exists()) cf.delete()
            }
            val cMeta = File(dir, "amoozeshyar-update.chunks.meta")
            if (cMeta.exists()) cMeta.delete()
        }

        @JavascriptInterface
        fun installApkUpdateForVersion(apkUrl: String, targetVersionCode: Int): Boolean {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !packageManager.canRequestPackageInstalls()) {
                emitProgress(0, "لطفاً مجوز نصب از این برنامه را فعال کرده و دوباره دکمه بروزرسانی را بزنید.", false, true)
                runOnUiThread {
                    val permIntent = Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(permIntent)
                }
                return false
            }

            if (isCachedApkReady(apkUrl, targetVersionCode.toLong())) {
                val cachedApk = File(getUpdateDir(), "amoozeshyar-update.apk")
                emitProgress(100, "فایل نسخه جدید آماده است؛ در حال باز کردن پنجره نصب سیستم...", false, false)
                Thread { installApkFile(cachedApk) }.start()
                return true
            }

            if (!isDownloading.compareAndSet(false, true)) {
                return true
            }
            cancelRequested.set(false)

            Thread {
                var probeConn: HttpURLConnection? = null
                try {
                    val cleanUrl = apkUrl.trim()
                    val dir = getUpdateDir()
                    val finalFile = File(dir, "amoozeshyar-update.apk")
                    val finalMeta = File(dir, "amoozeshyar-update.meta")
                    val partFile = File(dir, "amoozeshyar-update.apk.part")
                    val partMeta = File(dir, "amoozeshyar-update.part.meta")
                    val chunksMeta = File(dir, "amoozeshyar-update.chunks.meta")

                    emitProgress(5, "در حال اتصال و یافتن سریع‌ترین مسیر دریافت...", false, false)
                    probeConn = openHttpWithRedirects(cleanUrl, "bytes=0-0", 12000, 15000)
                    if (probeConn == null) {
                        emitProgress(0, "اتصال به سرور بروزرسانی برقرار نشد.", false, true)
                        return@Thread
                    }

                    val probeCode = probeConn.responseCode
                    if (probeCode !in 200..299) {
                        emitProgress(0, "دریافت فایل از سرور ناموفق بود (کد $probeCode).", false, true)
                        return@Thread
                    }

                    val resolvedCdnUrl = probeConn.url.toString()
                    val etag = probeConn.getHeaderField("ETag")
                    var total = -1L

                    if (probeCode == HttpURLConnection.HTTP_PARTIAL) {
                        val cr = probeConn.getHeaderField("Content-Range")
                        if (cr != null) {
                            val slashIdx = cr.lastIndexOf('/')
                            if (slashIdx > 0) {
                                total = cr.substring(slashIdx + 1).trim().toLongOrNull() ?: -1L
                            }
                        }
                    } else {
                        total = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            probeConn.contentLengthLong
                        } else {
                            probeConn.contentLength.toLong()
                        }
                    }

                    if (probeCode == HttpURLConnection.HTTP_PARTIAL && total >= 524288L) {
                        try {
                            probeConn.disconnect()
                        } catch (_: Exception) {
                        }
                        probeConn = null

                        val chunkCount = if (total >= 2_000_000L) 6 else 4
                        var canResumeChunks = false
                        val cMeta = readMetaFile(chunksMeta)
                        if (cMeta != null && cMeta.size >= 5) {
                            val metaTotal = cMeta[1].trim().toLongOrNull() ?: -1L
                            val metaTarget = cMeta[2].trim().toLongOrNull() ?: 0L
                            val metaChunks = cMeta[4].trim().toIntOrNull() ?: 0
                            val metaEtag = cMeta[3].trim()
                            val etagMatch = etag.isNullOrEmpty() || metaEtag.isEmpty() || etag == metaEtag
                            if (cleanUrl == cMeta[0].trim() &&
                                metaTotal == total &&
                                (targetVersionCode <= 0 || metaTarget == targetVersionCode.toLong()) &&
                                metaChunks == chunkCount &&
                                etagMatch
                            ) {
                                canResumeChunks = true
                            }
                        }

                        if (!canResumeChunks) {
                            deleteChunkFiles(dir)
                            val metaText = cleanUrl + "\\n" + total + "\\n" + targetVersionCode + "\\n" + (etag ?: "") + "\\n" + chunkCount
                            try {
                                chunksMeta.writeText(metaText, Charsets.UTF_8)
                            } catch (_: Exception) {
                            }
                        }

                        val starts = LongArray(chunkCount)
                        val ends = LongArray(chunkCount)
                        val segFiles = Array(chunkCount) { i -> File(dir, "amoozeshyar-update.seg$i") }
                        var alreadyBytes = 0L
                        for (i in 0 until chunkCount) {
                            starts[i] = (total * i) / chunkCount
                            ends[i] = if (i == chunkCount - 1) total - 1L else (total * (i + 1L)) / chunkCount - 1L
                            val expectedLen = ends[i] - starts[i] + 1L
                            if (segFiles[i].exists() && segFiles[i].length() > expectedLen) {
                                segFiles[i].delete()
                            }
                            if (segFiles[i].exists()) {
                                alreadyBytes += segFiles[i].length()
                            }
                        }

                        val downloadedAtomic = AtomicLong(alreadyBytes)
                        val speedWindowBytes = AtomicLong(0L)
                        val speedWindowStartMs = AtomicLong(System.currentTimeMillis())
                        val lastEmitMs = AtomicLong(0L)
                        val chunkFailed = AtomicBoolean(false)
                        val activeUrlRef = AtomicReference(resolvedCdnUrl)
                        val progressLock = Any()
                        var lastPct = ((alreadyBytes * 100L) / total).toInt().coerceIn(5, 99)

                        if (alreadyBytes > 0) {
                            emitProgress(lastPct, "ادامه دریافت سریع ($chunkCount کانال هم‌زمان): $lastPct٪", false, false)
                        }

                        val workers = Array(chunkCount) { i ->
                            val segStart = starts[i]
                            val segEnd = ends[i]
                            val segExpected = segEnd - segStart + 1L
                            val segFile = segFiles[i]
                            Thread {
                                for (attempt in 0 until 3) {
                                    if (cancelRequested.get() || chunkFailed.get()) return@Thread
                                    var segConn: HttpURLConnection? = null
                                    try {
                                        val existing = if (segFile.exists()) segFile.length() else 0L
                                        if (existing >= segExpected) return@Thread

                                        val reqStart = segStart + existing
                                        val target = if (attempt == 0) activeUrlRef.get() else cleanUrl
                                        segConn = openHttpWithRedirects(target, "bytes=$reqStart-$segEnd", 12000, 15000)
                                        if (segConn == null) {
                                            if (attempt < 2) continue
                                            chunkFailed.set(true)
                                            return@Thread
                                        }
                                        var code = segConn.responseCode
                                        if ((code == 403 || code == 410) && cleanUrl != target) {
                                            segConn.disconnect()
                                            segConn = openHttpWithRedirects(cleanUrl, "bytes=$reqStart-$segEnd", 12000, 15000)
                                            if (segConn == null) {
                                                if (attempt < 2) continue
                                                chunkFailed.set(true)
                                                return@Thread
                                            }
                                            code = segConn.responseCode
                                            activeUrlRef.set(segConn.url.toString())
                                        }
                                        if (code != HttpURLConnection.HTTP_PARTIAL && !(code == HttpURLConnection.HTTP_OK && reqStart == 0L)) {
                                            if (attempt < 2) continue
                                            chunkFailed.set(true)
                                            return@Thread
                                        }

                                        BufferedInputStream(segConn.inputStream, 131072).use { input ->
                                            BufferedOutputStream(FileOutputStream(segFile, existing > 0L), 131072).use { output ->
                                                val buf = ByteArray(131072)
                                                var written = existing
                                                while (written < segExpected) {
                                                    val read = input.read(buf)
                                                    if (read == -1) break
                                                    if (cancelRequested.get()) {
                                                        output.flush()
                                                        return@Thread
                                                    }
                                                    val toWrite = minOf(read.toLong(), segExpected - written).toInt()
                                                    if (toWrite <= 0) break
                                                    output.write(buf, 0, toWrite)
                                                    written += toWrite
                                                    val dl = downloadedAtomic.addAndGet(toWrite.toLong())
                                                    val winBytes = speedWindowBytes.addAndGet(toWrite.toLong())
                                                    val now = System.currentTimeMillis()
                                                    val pct = ((dl * 100L) / total).toInt().coerceAtMost(99)
                                                    synchronized(progressLock) {
                                                        if (now - lastEmitMs.get() >= 450L || pct >= lastPct + 3) {
                                                            val elapsed = maxOf(1L, now - speedWindowStartMs.get())
                                                            val speed = (winBytes * 1000L) / elapsed
                                                            if (elapsed >= 3000L) {
                                                                speedWindowStartMs.set(now)
                                                                speedWindowBytes.set(0L)
                                                            }
                                                            lastEmitMs.set(now)
                                                            lastPct = maxOf(lastPct, pct)
                                                            emitProgress(lastPct, formatDownloadStatus(lastPct, dl, total, speed), false, false)
                                                        }
                                                    }
                                                }
                                                output.flush()
                                            }
                                        }
                                        if (segFile.length() >= segExpected) return@Thread
                                    } catch (_: Exception) {
                                        if (attempt >= 2) {
                                            chunkFailed.set(true)
                                        }
                                    } finally {
                                        segConn?.disconnect()
                                    }
                                }
                                if (!segFile.exists() || segFile.length() < segExpected) {
                                    chunkFailed.set(true)
                                }
                            }.also { it.start() }
                        }

                        for (w in workers) {
                            try {
                                w.join()
                            } catch (_: InterruptedException) {
                            }
                        }

                        if (cancelRequested.get()) {
                            emitProgress(0, "دریافت متوقف شد؛ پیشرفت ذخیره شده و با تلاش مجدد ادامه می‌یابد.", false, true)
                            return@Thread
                        }

                        var verifiedSum = 0L
                        var allOk = !chunkFailed.get()
                        for (i in 0 until chunkCount) {
                            val expectedLen = ends[i] - starts[i] + 1L
                            if (!segFiles[i].exists() || segFiles[i].length() != expectedLen) {
                                allOk = false
                                break
                            }
                            verifiedSum += segFiles[i].length()
                        }

                        if (!allOk || verifiedSum != total) {
                            emitProgress(0, "دریافت فایل نیمه‌تمام ماند؛ با زدن دوباره دکمه، از ادامه بخش‌های دریافت‌شده دانلود می‌شود.", false, true)
                            return@Thread
                        }

                        emitProgress(99, "دریافت کامل شد؛ در حال ترکیب و بررسی نهایی فایل...", false, false)
                        if (partFile.exists()) partFile.delete()
                        BufferedOutputStream(FileOutputStream(partFile, false), 262144).use { mergedOut ->
                            val mBuf = ByteArray(262144)
                            for (i in 0 until chunkCount) {
                                BufferedInputStream(FileInputStream(segFiles[i]), 262144).use { segIn ->
                                    while (true) {
                                        val r = segIn.read(mBuf)
                                        if (r == -1) break
                                        mergedOut.write(mBuf, 0, r)
                                    }
                                }
                            }
                            mergedOut.flush()
                        }
                        deleteChunkFiles(dir)
                    } else {
                        if (probeCode == HttpURLConnection.HTTP_OK) {
                            if (partFile.exists()) partFile.delete()
                            partMeta.delete()
                        }
                        writeMetaFile(partMeta, cleanUrl, total, targetVersionCode.toLong(), etag)

                        BufferedInputStream(probeConn.inputStream, 131072).use { input ->
                            BufferedOutputStream(FileOutputStream(partFile, false), 131072).use { output ->
                                val buf = ByteArray(131072)
                                var downloaded = 0L
                                var winBytes = 0L
                                var winStart = System.currentTimeMillis()
                                var lastEmit = 0L
                                var lastPct = 5
                                while (true) {
                                    val read = input.read(buf)
                                    if (read == -1) break
                                    if (cancelRequested.get()) {
                                        emitProgress(0, "دریافت متوقف شد.", false, true)
                                        return@Thread
                                    }
                                    output.write(buf, 0, read)
                                    downloaded += read
                                    winBytes += read
                                    val now = System.currentTimeMillis()
                                    if (total > 0 && now - lastEmit >= 450L) {
                                        val pct = ((downloaded * 100L) / total).toInt().coerceAtMost(99)
                                        val elapsed = maxOf(1L, now - winStart)
                                        val speed = (winBytes * 1000L) / elapsed
                                        if (elapsed >= 3000L) {
                                            winStart = now
                                            winBytes = 0L
                                        }
                                        lastEmit = now
                                        lastPct = maxOf(lastPct, pct)
                                        emitProgress(lastPct, formatDownloadStatus(lastPct, downloaded, total, speed), false, false)
                                    }
                                }
                                output.flush()
                            }
                        }

                        if (total > 0 && partFile.length() != total) {
                            emitProgress(0, "دریافت فایل نیمه‌تمام ماند؛ لطفاً دوباره امتحان کنید.", false, true)
                            return@Thread
                        }
                    }

                    val archiveInfo = packageManager.getPackageArchiveInfo(partFile.absolutePath, 0)
                    if (archiveInfo == null || packageName != archiveInfo.packageName) {
                        partFile.delete()
                        partMeta.delete()
                        emitProgress(0, "فایل دریافت‌شده معتبر نیست. لطفاً دوباره امتحان کنید.", false, true)
                        return@Thread
                    }

                    if (finalFile.exists()) finalFile.delete()
                    if (!partFile.renameTo(finalFile)) {
                        BufferedInputStream(FileInputStream(partFile), 262144).use { copyIn ->
                            BufferedOutputStream(FileOutputStream(finalFile), 262144).use { copyOut ->
                                val cpBuf = ByteArray(262144)
                                while (true) {
                                    val cpRead = copyIn.read(cpBuf)
                                    if (cpRead == -1) break
                                    copyOut.write(cpBuf, 0, cpRead)
                                }
                            }
                        }
                        partFile.delete()
                    }
                    partMeta.delete()
                    writeMetaFile(finalMeta, cleanUrl, finalFile.length(), targetVersionCode.toLong(), etag)

                    emitProgress(100, "دریافت کامل شد؛ در حال باز کردن پنجره نصب سیستم...", false, false)
                    installApkFile(finalFile)
                } catch (_: Exception) {
                    emitProgress(0, "خطا در دریافت فایل نصبی؛ پیشرفت دانلود ذخیره شد و با تلاش مجدد ادامه می‌یابد.", false, true)
                } finally {
                    isDownloading.set(false)
                    probeConn?.disconnect()
                }
            }.start()

            return true
        }
    }
}
`;
  fs.writeFileSync(mainActivityPath, ktCode, 'utf8');
  console.log(`[android-bridge] Updated ${path.relative(root, mainActivityPath)}`);
}
