# Quick Build Guide - Build 15

## 🚀 Build Commands (Copy & Paste)

### 1. Navigate to project
```bash
cd civic-shield
```

### 2. Clean prebuild (IMPORTANT - adds expo-sms plugin)
```bash
npx expo prebuild --clean
```
**When prompted**: Choose "Clear the native folders"

### 3. Build APK
```bash
cd android
./gradlew assembleRelease
```

### 4. Install on device
```bash
cd ..
adb install android/app/build/outputs/apk/release/app-release.apk
```

## 📱 What's New in Build 15

### ✅ Real GPS Location
- Uses expo-location for actual device coordinates
- Shows latitude, longitude, accuracy
- Creates Google Maps links

### ✅ Real SMS Sending
- Uses expo-sms to send from device
- Sends to emergency contacts automatically
- No cloud APIs needed

### ✅ Local History
- Saves to device storage (AsyncStorage)
- No Firebase required
- Shows SMS success/failure

### ✅ Shake Detection
- Toggle on/off in SOS screen
- Shake phone to trigger SOS
- 10-second countdown with cancel

## 🔧 After Installation

### 1. Grant Permissions
- Location: "Allow all the time"
- SMS: Allow
- Microphone: Allow (for future voice recording)

### 2. Add Emergency Contacts
- Go to Settings tab
- Add contact name and phone number
- Save

### 3. Enable Shake Detection
- Go to SOS tab
- Toggle "Shake Detection" ON

### 4. Test SOS
- Press SOS button OR shake phone
- Select emergency type
- Wait for countdown OR press "Send Now"
- Check if location and SMS work

## 🐛 If Something Doesn't Work

### Location Not Working
```bash
# Check if permission granted
adb shell dumpsys package com.civicshield.app | grep -i location

# Check logs
adb logcat | grep -i location
```

### SMS Not Working
```bash
# Check if permission granted
adb shell dumpsys package com.civicshield.app | grep -i sms

# Check logs
adb logcat | grep -i sms
```

### App Crashes
```bash
# View crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"
```

## 📊 Expected Behavior

### When SOS Triggered:
1. ⏱️ 10-second countdown starts
2. 📍 GPS location retrieved (may take 5-10 seconds)
3. 📱 SMS sent to all emergency contacts
4. ✅ Success message shown with location
5. 📜 Incident saved to history

### SMS Message Format:
```
🚨 SOS! I need help.

My current location:
https://maps.google.com/?q=LAT,LONG

Type: EMERGENCY
Time: Mar 8, 2026 4:30 PM

Sent from Civic Shield
```

## 🎯 Success Criteria

- [ ] App opens without crashing
- [ ] Shake detection works
- [ ] Location shows real coordinates
- [ ] SMS sends to contacts
- [ ] History shows incidents
- [ ] Can open location on Google Maps

## 📞 Emergency Contacts Format

Phone numbers should be in format:
- With country code: +918527680688
- Without country code: 8527680688
- With spaces: +91 85276 80688

All formats should work!

## ⚡ Quick Test

1. Open app
2. Go to Settings → Add contact: "Test" / "YOUR_NUMBER"
3. Go to SOS → Enable shake detection
4. Shake phone
5. Wait for countdown
6. Check if you receive SMS

Done! 🎉
