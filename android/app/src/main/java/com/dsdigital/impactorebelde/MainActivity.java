package com.dsdigital.impactorebelde;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.*;
import android.view.*;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;

/** The game is bundled in the APK: there is deliberately no INTERNET permission. */
public final class MainActivity extends Activity {
    private WebView game;
    private FrameLayout root;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(16,27,37));
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(16,27,37));
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        game.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = loader.shouldInterceptRequest(request.getUrl());
                return local != null ? local : new WebResourceResponse("text/plain", "UTF-8", new java.io.ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"appassets.androidplatform.net".equals(request.getUrl().getHost());
            }
        });
        game.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreen != null) { callback.onCustomViewHidden(); return; }
                fullscreen = view; fullscreenCallback = callback;
                game.setVisibility(View.GONE);
                root.addView(view, new FrameLayout.LayoutParams(-1,-1));
                immersive();
            }
            @Override public void onHideCustomView() { hideFullscreen(); }
        });
        root.addView(game, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        immersive();
        game.loadUrl("https://appassets.androidplatform.net/assets/index.html?apk=1");
    }
    private void immersive() {
        root.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    private void hideFullscreen() {
        if (fullscreen == null) return;
        root.removeView(fullscreen); fullscreen = null;
        game.setVisibility(View.VISIBLE);
        fullscreenCallback.onCustomViewHidden(); fullscreenCallback = null;
        immersive();
    }
    @Override public void onWindowFocusChanged(boolean focused) { super.onWindowFocusChanged(focused); if(focused) immersive(); }
    @Override public void onBackPressed() {
        if (fullscreen != null) hideFullscreen();
        else game.evaluateJavascript("document.getElementById('touch-exit').click()", null);
    }
    @Override protected void onPause() { game.evaluateJavascript("window.dispatchEvent(new Event('blur'))", null); game.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if(game != null) game.onResume(); }
    @Override protected void onDestroy() { game.destroy(); super.onDestroy(); }
}
