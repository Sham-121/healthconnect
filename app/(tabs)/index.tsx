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
  const [calories, setCalories] = useState<number | null>(null)

  const openHealthConnect = () => {
    if (OpenHealthConnect) {
      OpenHealthConnect.open()
    } else {
      Alert.alert('Health Connect module not available')
    }
  }

  const fetchData = async () => {
    try {
      await initialize()

      const granted = await getGrantedPermissions()

      if (granted.length === 0) {
        Alert.alert(
          'Permission Required',
          'Please enable permissions in Health Connect.',
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

      // 🟢 Steps
      if (granted.some(g => g.recordType === 'Steps')) {
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

      // 🔴 Heart Rate
      if (granted.some(g => g.recordType === 'HeartRate')) {
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

      // 🔥 Calories
      if (granted.some(g => g.recordType === 'ActiveCaloriesBurned')) {
        const caloriesResult = await readRecords(
          'ActiveCaloriesBurned',
          {
            timeRangeFilter: {
              operator: 'between',
              startTime: startOfDay.toISOString(),
              endTime: now.toISOString(),
            },
          }
        )

        const totalCalories = caloriesResult.records.reduce(
          (sum, record) =>
            sum + (record.energy?.inKilocalories ?? 0),
          0
        )

        setCalories(Math.round(totalCalories))
      }

    } catch (e: any) {
      console.log('Fetch error:', e)
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
        Active Calories: {calories ?? '--'} kcal
      </Text>

      <View style={{ marginTop: 30 }}>
        <Button title="Fetch Health Data" onPress={fetchData} />
      </View>
    </ScrollView>
  )
}
