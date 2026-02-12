package com.healthconnectdemo

import android.content.Intent
import android.content.pm.PackageManager
import com.facebook.react.bridge.*

class OpenHealthConnectModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "OpenHealthConnect"
    }

    @ReactMethod
    fun open() {
        val context = reactApplicationContext
        val packageName = "com.google.android.apps.healthdata"

        val intent = context.packageManager.getLaunchIntentForPackage(packageName)

        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }
}
