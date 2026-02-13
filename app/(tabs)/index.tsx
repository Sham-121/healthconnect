import React, { useState } from 'react'
import {
  View,
  Text,
  Button,
  Alert,
  ScrollView,
  NativeModules,
} from 'react-native'

import {
  initialize,
  getGrantedPermissions,
  readRecords,
} from 'react-native-health-connect'

const { OpenHealthConnect } = NativeModules

export default function Home() {
  const [steps, setSteps] = useState<number | null>(null)
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [activeCalories, setActiveCalories] = useState<number | null>(null)
  const [totalCalories, setTotalCalories] = useState<number | null>(null)
  const [sleepHours, setSleepHours] = useState<number | null>(null)

  const openHealthConnect = () => {
    if (OpenHealthConnect) {
      OpenHealthConnect.open()
    } else {
      Alert.alert('Health Connect module not available')
    }
  }

  const fetchData = async () => {
    try {

      // 🔥 REQUIRED for Realme/Oppo
await initialize('com.google.android.apps.healthdata')


      const granted = await getGrantedPermissions()

      if (granted.length === 0) {
        Alert.alert(
          'Permission Required',
          'Please allow permissions in Health Connect.',
          [
            { text: 'Open Health Connect', onPress: openHealthConnect },
            { text: 'Cancel', style: 'cancel' },
          ]
        )
        return
      }

      const now = new Date()
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      // ===========================
      // 🟢 STEPS
      // ===========================

      if (granted.some(g => g.recordType.includes('Steps'))) {

        const stepsResult = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        })

        const totalSteps = stepsResult.records.reduce(
          (sum, record) => sum + record.count,
          0
        )

        setSteps(totalSteps)
      }

      // ===========================
      // 🔴 HEART RATE
      // ===========================

      if (granted.some(g => g.recordType.includes('HeartRate'))) {

        const heartResult = await readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        })

        const avgHeart =
          heartResult.records.length > 0
            ? heartResult.records.reduce(
                (sum, record) =>
                  sum + (record.samples?.[0]?.beatsPerMinute ?? 0),
                0
              ) / heartResult.records.length
            : null

        setHeartRate(avgHeart ? Math.round(avgHeart) : null)
      }

      // ===========================
      // 🔥 ACTIVE CALORIES
      // ===========================

      if (granted.some(g => g.recordType.includes('ActiveCaloriesBurned'))) {

        const activeCal = await readRecords('ActiveCaloriesBurned', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        })

        const totalActive = activeCal.records.reduce(
          (sum, record) => sum + (record.energy?.inKilocalories ?? 0),
          0
        )

        setActiveCalories(Math.round(totalActive))
      }

      // ===========================
      // 🔥 TOTAL CALORIES
      // ===========================

      if (granted.some(g => g.recordType.includes('TotalCaloriesBurned'))) {

        const totalCal = await readRecords('TotalCaloriesBurned', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        })

        const total = totalCal.records.reduce(
          (sum, record) => sum + (record.energy?.inKilocalories ?? 0),
          0
        )

        setTotalCalories(Math.round(total))
      }

      // ===========================
      // 💤 SLEEP
      // ===========================

      if (granted.some(g => g.recordType.includes('SleepSession'))) {

        const sleepResult = await readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: now.toISOString(),
          },
        })

        const totalSleepMs = sleepResult.records.reduce(
          (sum, record) =>
            sum +
            (new Date(record.endTime).getTime() -
              new Date(record.startTime).getTime()),
          0
        )

        setSleepHours(
          totalSleepMs > 0
            ? parseFloat((totalSleepMs / (1000 * 60 * 60)).toFixed(1))
            : null
        )
      }

    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 26, marginBottom: 20 }}>
        Health Connect Dashboard
      </Text>

      <Text style={{ fontSize: 18 }}>
        Steps: {steps ?? '--'}
      </Text>

      <Text style={{ fontSize: 18, marginTop: 10 }}>
        Avg Heart Rate: {heartRate ?? '--'} bpm
      </Text>

      <Text style={{ fontSize: 18, marginTop: 10 }}>
        Active Calories: {activeCalories ?? '--'} kcal
      </Text>

      <Text style={{ fontSize: 18, marginTop: 10 }}>
        Total Calories: {totalCalories ?? '--'} kcal
      </Text>

      <Text style={{ fontSize: 18, marginTop: 10 }}>
        Sleep: {sleepHours ?? '--'} hrs
      </Text>

      <View style={{ marginTop: 30 }}>
        <Button title="Fetch Health Data" onPress={fetchData} />
      </View>
    </ScrollView>
  )
}
