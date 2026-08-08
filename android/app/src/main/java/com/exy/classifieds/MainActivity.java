package com.exy.classifieds;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * Module 2.1 — native share receiver.
 *
 * Android delivers a shared Reel/Short as ACTION_SEND with the link inside
 * EXTRA_TEXT. We translate that into the same `/share?url=&title=&text=`
 * query the PWA share_target produces, so the web layer needs no changes:
 * readSharePayload() parses it and the Express Post Drawer opens pre-filled.
 */
public class MainActivity extends BridgeActivity {

    private static final String SHARE_PATH = "/share";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent(), false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent, true);
    }

    private void handleShareIntent(Intent intent, boolean navigateNow) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return;
        }
        if (!"text/plain".equals(intent.getType())) {
            return;
        }

        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        String title = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (text == null && title == null) {
            return;
        }

        final String target = SHARE_PATH + "?" + buildQuery(title, text);

        // The bridge WebView is not ready during onCreate, so defer the hop.
        getBridge().getWebView().post(new Runnable() {
            @Override
            public void run() {
                WebView webView = getBridge().getWebView();
                if (webView == null) {
                    return;
                }
                String base = getBridge().getServerUrl();
                if (base == null || base.isEmpty()) {
                    base = getBridge().getLocalUrl();
                }
                webView.loadUrl(base + target);
            }
        });
    }

    private String buildQuery(String title, String text) {
        StringBuilder query = new StringBuilder();
        String url = extractFirstUrl(text);

        if (url != null) {
            query.append("url=").append(Uri.encode(url));
        }
        if (title != null && !title.isEmpty()) {
            if (query.length() > 0) query.append("&");
            query.append("title=").append(Uri.encode(title));
        }
        if (text != null && !text.isEmpty()) {
            if (query.length() > 0) query.append("&");
            query.append("text=").append(Uri.encode(text));
        }
        return query.toString();
    }

    /** Instagram and WhatsApp bury the link inside the caption text. */
    private String extractFirstUrl(String text) {
        if (text == null) return null;
        for (String token : text.split("\\s+")) {
            if (token.startsWith("http://") || token.startsWith("https://")) {
                return token;
            }
        }
        return null;
    }
}
