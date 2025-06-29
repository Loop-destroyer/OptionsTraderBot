# Building APK for Iron Condor Trading Signals App

This guide explains how to convert your web-based Iron Condor trading app into an Android APK using Capacitor.

## Prerequisites

- Node.js (v18 or higher)
- Android Studio
- Java Development Kit (JDK 11 or higher)
- Android SDK

## Step 1: Install Capacitor

\`\`\`bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
\`\`\`

## Step 2: Initialize Capacitor

\`\`\`bash
npx cap init "Iron Condor Signals" "com.tradingsignals.ironcondor"
\`\`\`

## Step 3: Add Android Platform

\`\`\`bash
npx cap add android
\`\`\`

## Step 4: Configure Capacitor

Create `capacitor.config.ts` in your project root:

\`\`\`typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradingsignals.ironcondor',
  appName: 'Iron Condor Signals',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: "#1a1a1a"
    }
  }
};

export default config;
\`\`\`

## Step 5: Build Your Web App

\`\`\`bash
npm run build
\`\`\`

## Step 6: Copy Web Assets to Native Project

\`\`\`bash
npx cap copy android
\`\`\`

## Step 7: Configure Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

\`\`\`xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
\`\`\`

## Step 8: Configure Network Security

Create `android/app/src/main/res/xml/network_security_config.xml`:

\`\`\`xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">your-api-domain.com</domain>
    </domain-config>
</network-security-config>
\`\`\`

Add to `android/app/src/main/AndroidManifest.xml` in the `<application>` tag:

\`\`\`xml
android:networkSecurityConfig="@xml/network_security_config"
\`\`\`

## Step 9: Configure App Icon and Splash Screen

### App Icon
- Create icons in different sizes (48x48, 72x72, 96x96, 144x144, 192x192)
- Place them in `android/app/src/main/res/mipmap-*` folders
- Name them `ic_launcher.png`

### Splash Screen
- Create splash screen images (1080x1920, 1440x2560, etc.)
- Place them in `android/app/src/main/res/drawable-*` folders
- Configure colors in `android/app/src/main/res/values/colors.xml`:

\`\`\`xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#00C851</color>
    <color name="colorPrimaryDark">#007E33</color>
    <color name="colorAccent">#00C851</color>
    <color name="splashBackground">#1a1a1a</color>
</resources>
\`\`\`

## Step 10: Open in Android Studio

\`\`\`bash
npx cap open android
\`\`\`

## Step 11: Configure Build Settings

In Android Studio:

1. Open `File` → `Project Structure`
2. Set `Compile SDK Version` to 34 (or latest)
3. Set `Build Tools Version` to latest
4. Set `Min SDK Version` to 24 (Android 7.0)
5. Set `Target SDK Version` to 34

## Step 12: Build APK

### Debug APK (for testing)
In Android Studio:
1. Click `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. APK will be generated in `android/app/build/outputs/apk/debug/`

### Release APK (for distribution)
1. Generate signing key:
\`\`\`bash
keytool -genkey -v -keystore iron-condor-release.keystore -alias iron-condor -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

2. Configure signing in `android/app/build.gradle`:
\`\`\`gradle
android {
    signingConfigs {
        release {
            storeFile file('../../iron-condor-release.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'iron-condor'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
\`\`\`

3. Build release APK:
\`\`\`bash
cd android
./gradlew assembleRelease
\`\`\`

## Step 13: Add Native Features (Optional)

### Push Notifications
\`\`\`bash
npm install @capacitor/push-notifications
\`\`\`

### Local Notifications
\`\`\`bash
npm install @capacitor/local-notifications
\`\`\`

### Device Info
\`\`\`bash
npm install @capacitor/device
\`\`\`

### Network Status
\`\`\`bash
npm install @capacitor/network
\`\`\`

## Step 14: Configure Update Script

Add to `package.json`:

\`\`\`json
{
  "scripts": {
    "mobile:build": "npm run build && npx cap copy android",
    "mobile:open": "npx cap open android",
    "mobile:sync": "npm run build && npx cap sync android"
  }
}
\`\`\`

## Step 15: Testing on Device

1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. In Android Studio, select your device and click "Run"

## Step 16: Distribution

### Google Play Store
1. Create Google Play Console account
2. Upload release APK
3. Fill out store listing details
4. Set up pricing and distribution
5. Submit for review

### Direct Distribution
1. Enable "Unknown Sources" in Android settings
2. Transfer APK file to device
3. Install directly from file manager

## Troubleshooting

### Common Issues

1. **Build Errors**: Check Android SDK path and Java version
2. **Network Issues**: Verify network security config
3. **Permissions**: Ensure all required permissions are declared
4. **Icon Issues**: Verify icon sizes and formats
5. **Splash Screen**: Check splash screen configuration

### Debug Commands

\`\`\`bash
# View device logs
adb logcat

# Install APK directly
adb install app-release.apk

# Check connected devices
adb devices

# Clear app data
adb shell pm clear com.tradingsignals.ironcondor
\`\`\`

## Performance Optimization

1. **Minimize Bundle Size**: Remove unused dependencies
2. **Enable Proguard**: For release builds
3. **Optimize Images**: Use WebP format for icons
4. **Cache Management**: Implement proper caching strategies
5. **Background Tasks**: Minimize background processing

## Security Considerations

1. **API Keys**: Store securely using Capacitor Preferences
2. **Network Traffic**: Use HTTPS for all API calls
3. **Data Storage**: Encrypt sensitive data
4. **Code Obfuscation**: Enable for release builds

## Updating the App

When you make changes to your web app:

\`\`\`bash
npm run build
npx cap copy android
npx cap sync android
\`\`\`

Then rebuild in Android Studio.

## Final Notes

- Test thoroughly on different devices and Android versions
- Follow Google Play Store guidelines for app submission
- Keep your signing key secure and backed up
- Consider using Android App Bundle (AAB) for Play Store distribution
- Implement proper error handling and offline capabilities
- Monitor app performance and user feedback

The generated APK will contain your complete Iron Condor trading signals app with all the features including capital management, custom strategy parameters, NSE data integration, and real-time trading signals.
