// screens/OtpScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { verifyOtp } from '@/utils/auth';
import { router } from 'expo-router';
import { otpAtom } from '@/data/atom/otpAtom';
import { useAtom } from 'jotai';
import { registerForPushNotificationsAsync } from '@/services/notificationsService';
import { addExpoTokenToDb } from '@/services/apiService';

const OtpScreen: React.FC = () => {
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [storedOtp] = useAtom(otpAtom);
  const route = useRoute();
  const { phone, otp: generatedOtp } = route.params as { phone: string; otp: string };
  
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Please enter the OTP");
      return;
    }
    setLoading(true);

    try {
      const userId = await verifyOtp(phone, otp);
      if (userId) {
        Alert.alert("Success!", "OTP verified successfully.");
        router.push("../(tabs)")
        // Navigate to home screen or any other screen after verification
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Invalid OTP", error.message);
      } else {
        Alert.alert("Invalid OTP", "An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const setupPushNotifications = async () => {
      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) {
        await addExpoTokenToDb(expoPushToken, phone);
      }
    };
    setupPushNotifications();
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      {storedOtp && 
      <Text>Your otp is {storedOtp}</Text>
      }
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OtpScreen;
