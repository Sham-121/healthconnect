import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";

import {
  initialize,
  requestPermission,
  readRecords,
} from "react-native-health-connect";

export default function HomeScreen() {
  const [steps, setSteps] = useState(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [calories, setCalories] = useState(0);

  useEffect(() => {
    initHealthConnect();
  }, []);

  const initHealthConnect = async () => {
    try {
      const initialized = await initialize();
      if (!initialized) {
        Alert.alert("Health Connect not available on this device");
      }
    } catch (error) {
      console.log("Init error:", error);
    }
  };

  const fetchHealthData = async () => {
    try {
      await requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
      ]);

      const now = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      // 👣 Steps
      const stepsData = await readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalSteps = stepsData.records.reduce(
        (sum, record) => sum + record.count,
        0
      );

      setSteps(totalSteps);

      // ❤️ Heart Rate
      const hrData = await readRecords("HeartRate", {
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        },
      });

      if (hrData.records.length > 0) {
        const latestHR =
          hrData.records[hrData.records.length - 1].samples[0].beatsPerMinute;
        setHeartRate(latestHR);
      }

      // 🔥 Calories
      const calorieData = await readRecords("ActiveCaloriesBurned", {
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalCalories = calorieData.records.reduce(
        (sum, record) => sum + record.energy.inKilocalories,
        0
      );

      setCalories(totalCalories);
    } catch (error) {
      console.log("Fetch error:", error);
      Alert.alert("Permission denied or data error");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Health Connect Data</Text>

      <Button title="Fetch Health Data" onPress={fetchHealthData} />

      <View style={styles.card}>
        <Text>👣 Steps: {steps}</Text>
      </View>

      <View style={styles.card}>
        <Text>❤️ Heart Rate: {heartRate ?? "No Data"} bpm</Text>
      </View>

      <View style={styles.card}>
        <Text>🔥 Calories: {calories.toFixed(2)} kcal</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
});
