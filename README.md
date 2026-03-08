# 🛡️ Civic Shield - Emergency Safety App

A React Native emergency response application that enables users to send SOS alerts with real-time GPS location via automatic SMS to emergency contacts.

![Platform](https://img.shields.io/badge/Platform-Android-green)
![React Native](https://img.shields.io/badge/React%20Native-0.83.2-blue)
![Expo](https://img.shields.io/badge/Expo-55.0.4-black)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Core Functionality
- 🚨 **SOS Alert System** - Quick emergency alert with one tap or shake gesture
- 📍 **Real-Time GPS Location** - Accurate location tracking using device GPS
- 📱 **Automatic SMS Sending** - Sends SMS automatically without user interaction (native Android module)
- 🤝 **Emergency Contacts** - Manage multiple emergency contacts
- 📜 **Incident History** - Local storage of all SOS incidents
- 🗺️ **Google Maps Integration** - Share location via Google Maps links
- 📳 **Shake Detection** - Trigger SOS by shaking the device

### Emergency Types
- 🚨 Kidnap Alert
- ⚠️ Assault Alert
- 🆘 General Emergency

### Safety Features
- ⏱️ 10-second countdown with cancel option
- 🔔 Vibration feedback
- 📊 Incident tracking and history
- 🔒 Privacy-focused (local storage, no cloud required)

## 📱 Screenshots

```
[SOS Screen]     [History]        [Settings]       [Map View]
   🚨              📜               ⚙️               🗺️
```

## 🏗️ Architecture

### Technology Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Storage**: AsyncStorage (local)
- **Location**: expo-location
- **SMS**: Native Android SmsManager (custom module)
- **Sensors**: expo-sensors (shake detection)
- **Maps**: react-native-maps

### Native Modules
- **SmsModule** (Kotlin) - Automatic SMS sending using Android SmsManager API
- No user interaction required for SMS sending

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Android Studio (for Android development)
- Android SDK (API 24+)
- Java Development Kit (JDK 17)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/civic-shield.git
cd civic-shield
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment (optional)**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials (optional)
```

4. **Generate native folders**
```bash
npx expo prebuild --clean
```

5. **Build for Android**
```bash
cd android
./gradlew assembleRelease
```

6. **Install on device**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## 📦 Project Structure

```
civic-shield/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CountdownModal.tsx
│   │   └── ErrorBoundary.tsx
│   ├── screens/             # App screens
│   │   ├── CleanSOSScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── IncidentHistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/            # Business logic
│   │   ├── realLocationService.ts      # GPS location
│   │   ├── nativeAutoSMSService.ts     # Automatic SMS
│   │   ├── realSOSService.ts           # SOS coordinator
│   │   ├── shakeDetectionService.ts    # Shake detection
│   │   ├── autoSMSService.ts           # Contact management
│   │   └── featureManager.ts           # Feature initialization
│   └── firebase.ts          # Firebase config (optional)
├── android/
│   └── app/src/main/java/com/civicshield/app/
│       ├── SmsModule.kt     # Native SMS module
│       └── SmsPackage.kt    # Module registration
├── App.tsx                  # Main app component
├── app.json                 # Expo configuration
└── package.json             # Dependencies
```

## 🔧 Configuration

### Permissions Required

The app requires the following Android permissions:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### App Configuration

Edit `app.json` to customize:
- App name and slug
- Bundle identifier
- Permissions
- Plugins

## 📖 Usage

### Setup Emergency Contacts

1. Open the app
2. Navigate to **Settings** tab
3. Tap "Add Emergency Contact"
4. Enter contact name and phone number
5. Save

### Trigger SOS Alert

**Method 1: Button Press**
1. Go to **SOS** tab
2. Press the red SOS button
3. Select emergency type
4. Wait for countdown or press "Send Now"

**Method 2: Shake Detection**
1. Go to **SOS** tab
2. Enable "Shake Detection" toggle
3. Shake your phone vigorously (3 times)
4. Confirm the alert

### What Happens When SOS is Triggered

1. ⏱️ 10-second countdown starts (can be cancelled)
2. 📍 GPS location is retrieved
3. 📱 SMS is sent automatically to all emergency contacts
4. 💾 Incident is saved to local history
5. ✅ Confirmation is displayed

### SMS Format

Emergency contacts receive:
```
🚨 SOS! I need help.

My current location:
https://maps.google.com/?q=28.6139,77.2090

Type: EMERGENCY
Time: Mar 8, 2026 5:30 PM

Sent from Civic Shield
```

## 🔐 Privacy & Security

- **Local Storage**: All data stored locally on device
- **No Cloud Required**: Works without internet (except for maps)
- **No User Tracking**: No analytics or tracking
- **Open Source**: Transparent and auditable code
- **Minimal Permissions**: Only essential permissions requested

## 🛠️ Development

### Run in Development Mode

```bash
npm start
```

### Build Release APK

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Debug Logs

```bash
# View all logs
adb logcat

# Filter for app logs
adb logcat | grep -i "civic\|location\|sms"

# View crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"
```

## 🧪 Testing

### Test Checklist

- [ ] App installs successfully
- [ ] App opens without crashing
- [ ] Permissions are requested on startup
- [ ] Emergency contacts can be added/removed
- [ ] Shake detection triggers SOS
- [ ] GPS location is retrieved accurately
- [ ] SMS is sent automatically (no messaging app opens)
- [ ] Incident appears in history
- [ ] Google Maps link opens correctly

### Test SOS Flow

1. Add your own phone number as emergency contact
2. Enable shake detection
3. Trigger SOS (shake or button)
4. Verify SMS is received with location
5. Check history for incident record

## 🐛 Troubleshooting

### Location Not Working
- Ensure location permission is granted ("Allow all the time")
- Enable GPS on device
- Test outdoors or near window for better GPS signal
- First GPS fix may take 5-10 seconds

### SMS Not Sending
- Verify SMS permission is granted
- Check emergency contacts are configured
- Ensure phone number format is correct (+918527680688)
- Check device has SMS capability

### App Crashes
- Check logcat for error messages
- Verify all permissions are granted
- Ensure Android SDK is properly configured
- Try clean build: `./gradlew clean assembleRelease`

## 📚 Documentation

- [Build 16 Guide](BUILD_16_AUTO_SMS.md) - Latest build with automatic SMS
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical details
- [Quick Build Guide](QUICK_BUILD_GUIDE.md) - Fast build reference

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Uses [React Native](https://reactnative.dev/)
- Location services by [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
- Maps by [react-native-maps](https://github.com/react-native-maps/react-native-maps)

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting guide

## 🚀 Roadmap

### Planned Features
- [ ] Voice recording during emergency
- [ ] Photo capture and sharing
- [ ] Live location tracking
- [ ] Police station finder
- [ ] Silent panic mode
- [ ] Multi-language support
- [ ] iOS support

## ⚠️ Disclaimer

This app is designed to assist in emergency situations but should not be relied upon as the sole means of emergency communication. Always call local emergency services (911, 112, etc.) when in immediate danger.

---

**Version**: 1.0.0 (Build 16)  
**Last Updated**: March 8, 2026  
**Platform**: Android (API 24+)  
**Status**: Production Ready

Made with ❤️ for safety and security
