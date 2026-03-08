# 🛡️ Civic Shield - Emergency Safety App

A React Native emergency response application that enables users to send SOS alerts with real-time GPS location via automatic SMS to emergency contacts.

![Platform](https://img.shields.io/badge/Platform-Android-green)
![React Native](https://img.shields.io/badge/React%20Native-0.83.2-blue)
![Expo](https://img.shields.io/badge/Expo-55.0.4-black)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Core Functionality
- 🚨 **SOS Alert System** - Quick emergency alert with one tap or shake gesture
- 📍 **Native GPS Location** - Accurate location using Android LocationManager (works in release builds!)
- 📱 **Automatic SMS Sending** - Sends SMS automatically without user interaction (native Android module)
- 🤝 **Emergency Contacts** - Manage multiple emergency contacts
- 📜 **Incident History** - Local storage of all SOS incidents
- 🗺️ **Google Maps Integration** - Share location via Google Maps links
- 📳 **Shake Detection** - Trigger SOS by shaking the device

### Advanced Features (Optional)
- 🎤 **Voice Recording** - Record audio during emergency for evidence
- 📍 **Live Location Tracking** - Track location every 10 seconds in real-time
- 🚓 **Police Station Finder** - Find nearby police stations and call emergency (100/911/112)
- 🤫 **Silent Panic Mode** - Trigger SOS silently without UI or sound
- 📸 **Photo Capture** - Take photos during emergency (coming soon)

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

**Frontend:**
- React Native 0.83.2
- TypeScript 5.9.2
- Expo SDK 55.0.4
- React Navigation 6.x
- React Native Maps 1.26.20

**Native Modules (Android):**
- Kotlin 2.1.20
- Android SDK 36 (Target)
- Android SDK 24 (Minimum)
- Gradle 9.0.0

**Backend/Services:**
- Firebase 12.10.0 (Optional - for cloud features)
- AsyncStorage 2.2.0 (Local storage)
- Native Android APIs (LocationManager, SmsManager)

**Key Libraries:**
- expo-location 55.1.2 (GPS location)
- expo-av 16.0.8 (Audio recording)
- expo-sensors 55.0.8 (Shake detection)
- expo-sms 55.0.8 (SMS fallback)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│                     (TypeScript)                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Screens    │  │  Components  │  │  Navigation  │ │
│  │              │  │              │  │              │ │
│  │ • SOS        │  │ • Countdown  │  │ • Bottom     │ │
│  │ • Map        │  │ • Error      │  │   Tabs       │ │
│  │ • History    │  │   Boundary   │  │              │ │
│  │ • Settings   │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Service Layer                        │  │
│  │                                                   │  │
│  │  • realSOSService (SOS coordinator)              │  │
│  │  • nativeLocationService (GPS)                   │  │
│  │  • nativeAutoSMSService (SMS)                    │  │
│  │  • voiceRecordingService (Audio)                 │  │
│  │  • liveLocationTrackingService (Tracking)        │  │
│  │  • policeStationFinderService (Emergency)        │  │
│  │  • silentPanicService (Silent mode)              │  │
│  │  • advancedFeaturesManager (Feature control)     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Native Modules (Kotlin)                 │  │
│  │                                                   │  │
│  │  • LocationModule → Android LocationManager      │  │
│  │  • SmsModule → Android SmsManager                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Storage Layer                        │  │
│  │                                                   │  │
│  │  • AsyncStorage (Local data)                     │  │
│  │    - Emergency contacts                          │  │
│  │    - Incident history                            │  │
│  │    - Feature settings                            │  │
│  │    - Location history                            │  │
│  │                                                   │  │
│  │  • Firebase Firestore (Optional)                 │  │
│  │    - Cloud backup                                │  │
│  │    - Multi-device sync                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**SOS Trigger Flow:**
```
User Action (Shake/Button)
    ↓
CleanSOSScreen
    ↓
realSOSService.triggerRealSOS()
    ↓
┌─────────────────────────────────────────┐
│ 1. Get Location (Native Module)         │
│    LocationModule.getCurrentLocation()  │
│    → Android LocationManager            │
│                                         │
│ 2. Send SMS (Native Module)            │
│    SmsModule.sendSms()                  │
│    → Android SmsManager                 │
│                                         │
│ 3. Start Recording (if enabled)        │
│    voiceRecordingService.startRecording()│
│    → expo-av                            │
│                                         │
│ 4. Start Tracking (if enabled)         │
│    liveLocationTrackingService.start()  │
│    → Location updates every 10s         │
│                                         │
│ 5. Save to History                     │
│    AsyncStorage.setItem()               │
└─────────────────────────────────────────┘
    ↓
Success/Error Response
    ↓
UI Update (Show result)
```

### Database Schema

**AsyncStorage (Local Storage):**

```typescript
// Emergency Contacts
emergency_contacts: EmergencyContact[]
{
  name: string,
  phone: string
}

// SOS History
sos_history: Incident[]
{
  type: 'kidnap' | 'assault' | 'emergency',
  location: {
    latitude: number,
    longitude: number,
    accuracy: number,
    timestamp: number
  },
  mapsLink: string,
  timestamp: number,
  smsSuccess: boolean,
  locationError?: string
}

// Feature Settings
advanced_features_enabled: FeatureStatus
{
  voiceRecording: boolean,
  photoCapture: boolean,
  liveTracking: boolean,
  policeStationFinder: boolean,
  silentPanic: boolean
}

// Location History (per incident)
live_location_history_{incidentId}: LocationUpdate[]
{
  latitude: number,
  longitude: number,
  accuracy: number,
  timestamp: number
}

// Silent Panic History
silent_incidents: SilentIncident[]
{
  type: 'silent_panic',
  location: Location,
  timestamp: number,
  recordingStarted: boolean,
  trackingStarted: boolean
}
```

**Firebase Firestore (Optional):**

```
users/{userId}/
  ├── emergency_contacts/{contactId}
  │   ├── name: string
  │   ├── phone: string
  │   └── addedAt: timestamp
  │
  └── incidents/{incidentId}
      ├── type: string
      ├── latitude: number
      ├── longitude: number
      ├── timestamp: timestamp
      ├── userId: string
      └── status: string
```

### Third-Party Integrations

**Core Services:**
- **Google Maps** - Location visualization and directions
  - Maps API for incident display
  - Directions API for police station navigation
  - Geocoding API (future feature)

**Optional Services:**
- **Firebase** (Optional - not required for core functionality)
  - Authentication (anonymous auth)
  - Firestore (cloud backup)
  - Cloud Functions (future feature)
  - Analytics (future feature)

**Native Android APIs:**
- **LocationManager** - GPS location services
- **SmsManager** - SMS sending
- **AudioRecord** - Voice recording (via expo-av)
- **Vibrator** - Haptic feedback
- **Accelerometer** - Shake detection (via expo-sensors)

**No External APIs Required:**
- App works completely offline
- No API keys needed for core features
- No subscription services
- No cloud dependencies

### Security & Privacy

**Data Storage:**
- All sensitive data stored locally (AsyncStorage)
- No data sent to external servers (except optional Firebase)
- Emergency contacts encrypted at rest
- No user tracking or analytics

**Permissions:**
- Location: For GPS coordinates
- SMS: For automatic emergency alerts
- Microphone: For voice recording
- Camera: For photo capture (future)
- Vibrate: For haptic feedback
- Internet: For maps and optional cloud sync

**Privacy Features:**
- No user account required
- Anonymous authentication (if Firebase used)
- Local-first architecture
- No data collection
- Open source code (auditable)

### Performance Optimizations

**Location:**
- Uses last known location for instant results
- Falls back to network location if GPS slow
- 15-second timeout prevents hanging
- Caches location for quick access

**SMS:**
- Native module for direct sending
- No messaging app required
- Batch sending to multiple contacts
- Automatic message splitting for long texts

**Storage:**
- AsyncStorage for fast local access
- Incident history limited to last 50
- Location history limited to last 100 per incident
- Automatic cleanup of old data

**UI:**
- React Native for native performance
- Minimal re-renders
- Lazy loading of screens
- Optimized images and assets

### Deployment

**Build Process:**
```bash
# Install dependencies
npm install

# Generate native code
npx expo prebuild --clean

# Build release APK
cd android
./gradlew assembleRelease

# Output
android/app/build/outputs/apk/release/app-release.apk
```

**Requirements:**
- Node.js 18+
- Android SDK 24+
- Java JDK 17
- Gradle 9.0.0

**Distribution:**
- Direct APK installation
- Google Play Store (future)
- F-Droid (future)

### Scalability

**Current Capacity:**
- Unlimited emergency contacts
- 50 incidents in history
- 100 location updates per incident
- No server-side limitations

**Future Scaling:**
- Cloud sync for multi-device
- Real-time location sharing
- Group emergency alerts
- Community incident reporting

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
- **LocationModule** (Kotlin) - Native GPS location using Android LocationManager
- No user interaction required for SMS sending
- Works reliably in release builds

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

### Completed Features ✅
- [x] Voice recording during emergency
- [x] Live location tracking
- [x] Police station finder
- [x] Silent panic mode
- [x] Native location module (works in release builds)
- [x] Native SMS module (automatic sending)

### Planned Features
- [ ] Photo capture and sharing
- [ ] Multi-language support
- [ ] iOS support
- [ ] Offline maps
- [ ] Emergency contact groups

## ⚠️ Disclaimer

This app is designed to assist in emergency situations but should not be relied upon as the sole means of emergency communication. Always call local emergency services (911, 112, etc.) when in immediate danger.

---

**Version**: 1.0.0 (Build 21 - Final)  
**Last Updated**: March 8, 2026  
**Platform**: Android (API 24+)  
**Status**: Production Ready

**Key Features:**
- Native GPS location (works in release builds)
- Automatic SMS sending (no user interaction)
- Voice recording during emergency
- Live location tracking
- Police station finder
- Silent panic mode

Made with ❤️ for safety and security
