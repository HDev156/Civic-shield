package com.civicshield.app

import android.telephony.SmsManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "SmsModule"
    }

    @ReactMethod
    fun sendSms(phoneNumbers: ReadableArray, message: String, promise: Promise) {
        try {
            val smsManager = SmsManager.getDefault()
            val parts = smsManager.divideMessage(message)
            
            var successCount = 0
            var failCount = 0
            
            for (i in 0 until phoneNumbers.size()) {
                val phoneNumber = phoneNumbers.getString(i)
                
                try {
                    if (parts.size == 1) {
                        smsManager.sendTextMessage(phoneNumber, null, message, null, null)
                    } else {
                        smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
                    }
                    successCount++
                } catch (e: Exception) {
                    failCount++
                }
            }
            
            promise.resolve("Sent to $successCount contact(s), failed: $failCount")
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message)
        }
    }
}
