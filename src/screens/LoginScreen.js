// frontend/screens/LoginScreen.js
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uid, setUid] = useState('');
  const [secure, setSecure] = useState(true);

  const handleLogin = async () => {
    if (!username || !password || !uid) {
      Alert.alert('Peringatan', 'Isi semua field (username, password, dan UID)!');
      return;
    }

    try {
      const res = await axios.post('http://192.168.20.8:3000/api/auth/login', {
        username,
        password,
        uid,
      });

      const { user, token } = res.data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('username', user.username);
      await AsyncStorage.setItem('uid', user.uid);

      Alert.alert('Login Berhasil', `Selamat datang, ${user.username}!`);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.log('🛑 Error saat login:', error);
      Alert.alert(
        'Login Gagal',
        error.response?.data?.message || 'Terjadi kesalahan saat login'
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Please sign in to continue</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#999" />
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
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
            onChangeText={setUid}
            style={styles.input}
          />
        </View>

        {/* Tombol Lupa Kata Sandi */}
        <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
        >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        {/* Tombol Login */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

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

  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    paddingVertical: 5,
  },
  forgotPasswordText: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
  },
});