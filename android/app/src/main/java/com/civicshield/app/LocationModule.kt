package com.civicshield.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class LocationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val locationManager: LocationManager = 
        reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    
    override fun getName(): String {
        return "LocationModule"
    }

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        try {
            // Check permissions
            if (ActivityCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "Location permission not granted")
                return
            }

            // Try GPS first
            val gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

            if (!gpsEnabled && !networkEnabled) {
                promise.reject("GPS_DISABLED", "Location services are disabled")
                return
            }

            // Get last known location first (instant)
            val lastKnownGPS = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val lastKnownNetwork = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            
            val lastKnown = when {
                lastKnownGPS != null -> lastKnownGPS
                lastKnownNetwork != null -> lastKnownNetwork
                else -> null
            }

            if (lastKnown != null) {
                val result = Arguments.createMap()
                result.putDouble("latitude", lastKnown.latitude)
                result.putDouble("longitude", lastKnown.longitude)
                result.putDouble("accuracy", lastKnown.accuracy.toDouble())
                result.putDouble("timestamp", lastKnown.time.toDouble())
                promise.resolve(result)
                return
            }

            // If no last known location, request fresh location
            val locationListener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    locationManager.removeUpdates(this)
                    
                    val result = Arguments.createMap()
                    result.putDouble("latitude", location.latitude)
                    result.putDouble("longitude", location.longitude)
                    result.putDouble("accuracy", location.accuracy.toDouble())
                    result.putDouble("timestamp", location.time.toDouble())
                    promise.resolve(result)
                }

                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            // Request location update
            val provider = if (gpsEnabled) LocationManager.GPS_PROVIDER else LocationManager.NETWORK_PROVIDER
            locationManager.requestSingleUpdate(provider, locationListener, null)

            // Timeout after 15 seconds
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                try {
                    locationManager.removeUpdates(locationListener)
                    promise.reject("TIMEOUT", "Location request timed out")
                } catch (e: Exception) {
                    // Already resolved
                }
            }, 15000)

        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
