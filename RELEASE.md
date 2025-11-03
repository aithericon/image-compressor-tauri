# Release Process

This document describes how to create releases for the Image Compressor application.

## Automated Releases via GitHub Actions

The project uses GitHub Actions to automatically build the application for multiple platforms.

### Creating a New Release

1. **Update Version Numbers:**

   ```bash
   # Update package.json version
   npm version patch  # or minor, or major

   # Update Cargo.toml version
   # Edit src-tauri/Cargo.toml manually

   # Update tauri.conf.json version
   # Edit src-tauri/tauri.conf.json manually
   ```

2. **Create CHANGELOG Entry:**

   ```bash
   # Update CHANGELOG.md with changes in this version
   ```

3. **Commit and Tag:**

   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

4. **GitHub Actions Builds:**
   - Automatically triggered by the tag push
   - Builds for Windows and macOS (Intel + Apple Silicon)
   - Creates a draft release on GitHub
   - Uploads installers as release assets

5. **Publish Release:**
   - Go to GitHub Releases
   - Edit the draft release
   - Review the release notes
   - Click "Publish release"

## Manual Releases (If Needed)

### macOS (Local Build)

```bash
# Development build
npm run tauri:dev

# Production build
npm run tauri:build

# Output location:
# src-tauri/target/release/bundle/dmg/*.dmg
# src-tauri/target/release/bundle/macos/*.app
```

### Windows (Requires Windows Machine or VM)

```bash
# Development build
npm run tauri:dev

# Production build
npm run tauri:build

# Output location:
# src-tauri/target/release/bundle/msi/*.msi
# src-tauri/target/release/bundle/nsis/*.exe
```

## Code Signing (Optional but Recommended)

### macOS Code Signing

1. Obtain an Apple Developer certificate
2. Add secrets to GitHub:
   - `APPLE_CERTIFICATE` - Base64-encoded .p12 certificate
   - `APPLE_CERTIFICATE_PASSWORD` - Certificate password
   - `APPLE_SIGNING_IDENTITY` - Developer ID Application name
   - `APPLE_ID` - Apple ID email
   - `APPLE_PASSWORD` - App-specific password
   - `APPLE_TEAM_ID` - Team ID from Apple Developer account

3. Uncomment the signing environment variables in `.github/workflows/release.yml`

### Windows Code Signing

1. Obtain a Windows code signing certificate
2. Add secrets to GitHub:
   - `WINDOWS_CERTIFICATE` - Base64-encoded .pfx certificate
   - `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

3. Uncomment the signing environment variables in `.github/workflows/release.yml`

## Testing Builds

### Automated Testing

Every push to `main` or `develop` triggers the test workflow:

- TypeScript type checking
- Linting
- Frontend build
- Rust code check and tests
- Debug Tauri build

### Manual Testing

Before releasing, test on actual devices:

1. **macOS:**
   - Test on Apple Silicon Mac
   - Test on Intel Mac
   - Verify app opens and functions correctly
   - Check code signature (if signed)

2. **Windows:**
   - Test on Windows 10
   - Test on Windows 11
   - Verify installer works
   - Check code signature (if signed)

## Build Artifacts

### Windows

- `.msi` - Windows Installer (recommended)
- `.exe` - NSIS installer

### macOS

- `.dmg` - Disk image with app (recommended)
- `.app` - Application bundle

### File Naming Convention

GitHub Actions generates files with this naming:

- Windows: `Image-Compressor_1.0.0_x64_en-US.msi`
- macOS (Intel): `Image-Compressor_1.0.0_x64.dmg`
- macOS (Apple Silicon): `Image-Compressor_1.0.0_aarch64.dmg`

## Troubleshooting

### Build Fails on GitHub Actions

1. Check the Actions tab for error logs
2. Common issues:
   - Missing dependencies in `package.json`
   - Rust compilation errors
   - Missing platform-specific dependencies

### Code Signing Issues

1. Verify secrets are correctly set in GitHub repository settings
2. Check certificate validity
3. Ensure correct certificate format (base64-encoded)

### App Crashes After Build

1. Test in debug mode first: `npm run tauri:dev`
2. Check dev server logs
3. Build in release mode locally to reproduce
4. Check Tauri console logs

## Distribution Channels

### Direct Download

- Upload releases to company website
- Provide download links to customers

### Microsoft Store (Optional)

- Requires additional configuration in `tauri.conf.json`
- Need Microsoft Partner Center account
- Automated updates available

### Mac App Store (Optional)

- Requires additional code signing
- Need Apple Developer Program membership
- Automated updates available

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example: `v1.2.3`

- 1 = Major version
- 2 = Minor version
- 3 = Patch version

## Support

For release process questions, contact: support@aithericon.eu
