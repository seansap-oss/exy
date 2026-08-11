const config = {
    appId: 'com.exy.classifieds',
    appName: 'EXY',
    webDir: 'dist',
    android: {
        // Social iframes (Instagram / YouTube / Facebook) need mixed content
        // allowed because some embed sub-resources still negotiate over http.
        allowMixedContent: true,
        captureInput: true,
        webContentsDebuggingEnabled: true,
    },
    server: {
        androidScheme: 'https',
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 900,
            backgroundColor: '#0c0b09',
            showSpinner: false,
            androidSplashResourceName: 'splash',
        },
    },
};
export default config;
