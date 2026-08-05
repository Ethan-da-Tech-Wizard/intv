# Native Mobile & Desktop Build Manual

**Shea Post Acute Interview Scheduling & Candidate Tracking App**

---

## 1. Prerequisites
- **Node.js**: v20+ & `npm`
- **Android**: Android Studio & JDK 17
- **iOS**: macOS & Xcode 15+
- **Desktop (Tauri)**: Rust 1.75+ & Platform C++ Compilers (MSVC on Windows, Xcode CLI tools on macOS, `build-essential` on Linux)

---

## 2. Progressive Web App (PWA) Build
```bash
# Compile TypeScript & Vite PWA bundle
npm run build
```
Build output is saved to `dist/` with precached Service Worker (`sw.js`).

---

## 3. Mobile Build Commands (Capacitor 8)

### Android Build
```bash
# Add Android platform (first time only)
npx cap add android

# Sync web assets
npx cap sync android

# Open Android Studio to sign & build APK/AAB
npx cap open android
```
- In Android Studio: Select **Build > Generate Signed Bundle / APK**.
- Select **Android App Bundle (.aab)** for Google Play Store publication.

### iOS Build
```bash
# Add iOS platform (first time only, macOS required)
npx cap add ios

# Sync web assets
npx cap sync ios

# Open Xcode
npx cap open ios
```
- In Xcode: Select target **App**, choose your **Signing Team**.
- Select **Product > Archive** to publish to App Store Connect.

---

## 4. Desktop Build Commands (Tauri 2.0)

### Windows Installer (`.msi` / `.exe`)
```bash
# Build Windows Desktop Package
npm run tauri build
```
- Code signing via `SignTool.exe` using your corporate PFX certificate.

### macOS Installer (`.dmg`)
```bash
# Build macOS Desktop Package
npm run tauri build
```
- Apple Notarization command:
  ```bash
  xcrun notarytool submit src-tauri/target/release/bundle/dmg/*.dmg --apple-id "admin@sheapostacute.com" --team-id "TEAMID" --password "app-specific-password"
  ```

### Linux Package (`.AppImage` / `.deb`)
```bash
# Build Linux Package
npm run tauri build
```
