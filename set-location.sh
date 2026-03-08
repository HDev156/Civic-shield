#!/bin/bash

# Set iOS Simulator location to Ghaziabad, India
# Usage: ./set-location.sh

DEVICE_ID=$(xcrun simctl list devices | grep Booted | grep -o '[A-F0-9-]\{36\}' | head -1)

if [ -z "$DEVICE_ID" ]; then
    echo "❌ No booted simulator found. Please start the simulator first."
    exit 1
fi

echo "📍 Setting location to Vasundhara, Ghaziabad..."
echo "   Latitude: 28.6692"
echo "   Longitude: 77.3497"

xcrun simctl location "$DEVICE_ID" set "28.6692,77.3497"

if [ $? -eq 0 ]; then
    echo "✅ Location set successfully!"
    echo "🔄 Please reload your app to see the new location"
else
    echo "❌ Failed to set location"
    exit 1
fi
