package com.amoozeshyar.app;

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
        String safeStatus = status.replace("\\", "\\\\").replace("'", "\\'");
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
            String[] lines = text.split("\n", -1);
            return lines.length >= 4 ? lines : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void writeMetaFile(File metaFile, String apkUrl, long totalBytes, long targetVersionCode, String etag) {
        String content = apkUrl + "\n" + totalBytes + "\n" + targetVersionCode + "\n" + (etag != null ? etag : "");
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
            String safeName = fileName.trim().replaceAll("[/\\?%*:|<>]", "_").replace('"', '_');
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
                            String chunkContent = cleanUrl + "\n" + total + "\n" + targetVersionCode + "\n"
                                + (etag != null ? etag : "") + "\n" + chunkCount;
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
