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

const appVersion = String(pkgJson.version || versionJson.version || '2.3.9');
const appVersionCode = Number(versionJson.versionCode || 32);

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

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {
    private boolean bridgeAttached = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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

    private void attachBridgeIfReady() {
        if (bridgeAttached) return;
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv != null) {
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

    public class AmoozeshyarBridge {
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> finishAffinity());
        }

        @JavascriptInterface
        public boolean installApkUpdate(String apkUrl) {
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

            new Thread(() -> {
                HttpURLConnection conn = null;
                try {
                    emitProgress(5, "در حال اتصال به سرور بروزرسانی...", false, false);
                    String currentUrl = apkUrl;
                    for (int hop = 0; hop < 6; hop++) {
                        URL url = new URL(currentUrl);
                        conn = (HttpURLConnection) url.openConnection();
                        conn.setInstanceFollowRedirects(false);
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(30000);
                        conn.setRequestProperty("User-Agent", "Amoozeshyar-Android");
                        int code = conn.getResponseCode();
                        if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                            String next = conn.getHeaderField("Location");
                            conn.disconnect();
                            if (next == null || next.isEmpty()) break;
                            currentUrl = new URL(url, next).toString();
                            continue;
                        }
                        break;
                    }

                    if (conn == null || conn.getResponseCode() < 200 || conn.getResponseCode() >= 300) {
                        emitProgress(0, "دریافت فایل از سرور ناموفق بود.", false, true);
                        return;
                    }

                    int total = conn.getContentLength();
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) dir = getCacheDir();
                    File outFile = new File(dir, "amoozeshyar-update.apk");

                    try (InputStream in = conn.getInputStream();
                         FileOutputStream out = new FileOutputStream(outFile)) {
                        byte[] buf = new byte[8192];
                        long downloaded = 0;
                        int lastPct = 5;
                        int read;
                        while ((read = in.read(buf)) != -1) {
                            out.write(buf, 0, read);
                            downloaded += read;
                            if (total > 0) {
                                int pct = (int) Math.min(99, (downloaded * 100L) / total);
                                if (pct >= lastPct + 3) {
                                    lastPct = pct;
                                    emitProgress(pct, "در حال دریافت نسخه جدید: " + pct + "٪", false, false);
                                }
                            }
                        }
                    }

                    emitProgress(100, "دریافت کامل شد؛ در حال باز کردن پنجره نصب...", true, false);

                    runOnUiThread(() -> {
                        Uri apkUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            outFile
                        );
                        Intent installIntent = new Intent(Intent.ACTION_VIEW);
                        installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(installIntent);
                    });
                } catch (Exception e) {
                    emitProgress(0, "خطا در دریافت فایل نصبی. اتصال اینترنت را بررسی کنید.", false, true);
                } finally {
                    if (conn != null) conn.disconnect();
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

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.webkit.JavascriptInterface
import androidx.activity.OnBackPressedCallback
import androidx.core.content.FileProvider
import com.getcapacitor.BridgeActivity
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : BridgeActivity() {
    private var bridgeAttached = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

    private fun attachBridgeIfReady() {
        if (bridgeAttached) return
        val wv = bridge?.webView ?: return
        wv.addJavascriptInterface(AmoozeshyarBridge(), "AmoozeshyarAndroid")
        bridgeAttached = true
    }

    private fun emitProgress(percent: Int, status: String, done: Boolean, error: Boolean) {
        val safeStatus = status.replace("\\\\", "\\\\\\\\").replace("'", "\\\\'")
        val js = "window.dispatchEvent(new CustomEvent('amoozeshyar-apk-progress', { detail: { percent: $percent, status: '$safeStatus', done: $done, error: $error } }));"
        runOnUiThread {
            bridge?.webView?.evaluateJavascript(js, null)
        }
    }

    inner class AmoozeshyarBridge {
        @JavascriptInterface
        fun exitApp() {
            runOnUiThread { finishAffinity() }
        }

        @JavascriptInterface
        fun installApkUpdate(apkUrl: String): Boolean {
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

            Thread {
                var conn: HttpURLConnection? = null
                try {
                    emitProgress(5, "در حال اتصال به سرور بروزرسانی...", false, false)
                    var currentUrl = apkUrl
                    for (hop in 0 until 6) {
                        val url = URL(currentUrl)
                        conn = (url.openConnection() as HttpURLConnection).apply {
                            instanceFollowRedirects = false
                            connectTimeout = 15000
                            readTimeout = 30000
                            setRequestProperty("User-Agent", "Amoozeshyar-Android")
                        }
                        val code = conn.responseCode
                        if (code in listOf(301, 302, 303, 307, 308)) {
                            val next = conn.getHeaderField("Location")
                            conn.disconnect()
                            if (next.isNullOrEmpty()) break
                            currentUrl = URL(url, next).toString()
                            continue
                        }
                        break
                    }

                    val activeConn = conn
                    if (activeConn == null || activeConn.responseCode !in 200..299) {
                        emitProgress(0, "دریافت فایل از سرور ناموفق بود.", false, true)
                        return@Thread
                    }

                    val total = activeConn.contentLength
                    val dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: cacheDir
                    val outFile = File(dir, "amoozeshyar-update.apk")

                    activeConn.inputStream.use { input ->
                        FileOutputStream(outFile).use { output ->
                            val buf = ByteArray(8192)
                            var downloaded = 0L
                            var lastPct = 5
                            while (true) {
                                val read = input.read(buf)
                                if (read == -1) break
                                output.write(buf, 0, read)
                                downloaded += read
                                if (total > 0) {
                                    val pct = ((downloaded * 100L) / total).toInt().coerceAtMost(99)
                                    if (pct >= lastPct + 3) {
                                        lastPct = pct
                                        emitProgress(pct, "در حال دریافت نسخه جدید: $pct٪", false, false)
                                    }
                                }
                            }
                        }
                    }

                    emitProgress(100, "دریافت کامل شد؛ در حال باز کردن پنجره نصب...", true, false)

                    runOnUiThread {
                        val apkUri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "$packageName.fileprovider",
                            outFile
                        )
                        val installIntent = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(apkUri, "application/vnd.android.package-archive")
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(installIntent)
                    }
                } catch (_: Exception) {
                    emitProgress(0, "خطا در دریافت فایل نصبی. اتصال اینترنت را بررسی کنید.", false, true)
                } finally {
                    conn?.disconnect()
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
