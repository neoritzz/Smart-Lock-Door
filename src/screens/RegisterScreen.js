// frontend/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('user'); // default role
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleRegister = async () => {
    // Validasi field
    if (!username || !password || !confirm || !uid) {
      Alert.alert('Peringatan', 'Isi semua field (username, password, konfirmasi password, dan UID)!');
      return;
    }

    // Validasi panjang password minimal 6
    if (password.length < 6) {
      Alert.alert('Peringatan', 'Password minimal 6 karakter!');
      return;
    }

    // Validasi konfirmasi password
    if (password !== confirm) {
      Alert.alert('Peringatan', 'Password dan konfirmasi tidak cocok!');
      return;
    }

    try {
      const res = await axios.post('http://192.168.20.8:3000/api/auth/register', {
        username,
        password,
        role,
        uid,
      });

      Alert.alert('Berhasil', 'Registrasi berhasil! Silakan login.');
      navigation.navigate('Login');
    } catch (error) {
      console.log('🛑 Error saat register:', error);
      console.log('🧩 Response data:', error.response?.data);
      Alert.alert(
        'Registrasi Gagal',
        error.response?.data?.message || 'Terjadi kesalahan saat registrasi'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Create your account to continue</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#999" />
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" />
          <TextInput
            placeholder="Password (min 6 karakter)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            style={styles.input}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" />
          <TextInput
            placeholder="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={secureConfirm}
            style={styles.input}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
            <Ionicons
              name={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* UID */}
        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color="#999" />
          <TextInput
            placeholder="UID"
            value={uid}
            onChangeText={(text) => setUid(text.toUpperCase())} // otomatis uppercase
            style={styles.input}
            autoCapitalize="characters"
          />
        </View>

        {/* Role (opsional) */}
        <View style={styles.inputContainer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#999" />
          <TextInput
            placeholder="Role (default: user)"
            value={role}
            onChangeText={setRole}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        {/* Tombol Register */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// SINGLE styles declaration (tidak diduplikasi)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center' },
  card: {
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 25,
    marginHorizontal: 20,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 25 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: { flex: 1, height: 45, marginLeft: 5 },
  button: {
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666' },
  link: { color: '#1e3a8a', fontWeight: '600' },
});
