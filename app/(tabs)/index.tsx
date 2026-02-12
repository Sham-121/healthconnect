import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  AppState,
} from "react-native";

import {
  initialize,
  getSdkStatus,
  SdkAvailabilityStatus,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  Permission,
} from "react-native-health-connect";

export default function HomeScreen() {
  const [steps, setSteps] = useState<number>(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [calories, setCalories] = useState<number>(0);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Initialize Health Connect
  useEffect(() => {
    const setup = async () => {
      try {
        const status = await getSdkStatus();

        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
          Alert.alert("Health Connect not available on this device");
          return;
        }

        if (
          status ===
          SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        ) {
          Alert.alert("Please update Health Connect app");
          return;
        }

        await initialize();
        setInitialized(true);
      } catch (error) {
        console.log("Initialization error:", error);
      }
    };

    setup();
  }, []);

  // Realme fix: refetch when coming back from permission screen
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") {
        fetchHealthData();
      }
    });

    return () => subscription.remove();
  }, [initialized]);

  const fetchHealthData = async () => {
    if (!initialized) return;

    try {
      const requiredPermissions: Permission[] = [
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
      ];

      const grantedPermissions = await getGrantedPermissions();

      if (grantedPermissions.length < requiredPermissions.length) {
        // On Realme this may open Google Fit or Health Connect
        await requestPermission(requiredPermissions);
        return; // stop execution after requesting
      }

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
        (sum: number, record: any) => sum + record.count,
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
        const latest =
          hrData.records[hrData.records.length - 1].samples[0]
            .beatsPerMinute;
        setHeartRate(latest);
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
        (sum: number, record: any) =>
          sum + record.energy.inKilocalories,
        0
      );

      setCalories(totalCalories);
    } catch (error) {
      console.log("Fetch error:", error);
      Alert.alert("Error fetching health data");
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
