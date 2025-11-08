// frontend/screens/NewPasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NewPasswordScreen({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const username = route.params?.username; // Mengambil username dari layar sebelumnya

  const handleConfirmPassword = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    // 🔑 SIMULASI: Proses reset kata sandi (di sini seharusnya ada panggilan API backend)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success',
        'Your password has been successfully updated!'
      );
      
      // Kembali ke layar Login setelah sukses
      navigation.popToTop(); // Kembali ke tumpukan navigasi paling atas (biasanya Login/Home)
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header dengan tombol back (mirip gambar) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Password</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Please write your new password.</Text>

        {/* Input Password */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Input Confirm Password */}
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Tombol Confirm Password (Warna ungu seperti gambar) */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleConfirmPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Confirm Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8a2be2', // Warna ungu yang mirip
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});