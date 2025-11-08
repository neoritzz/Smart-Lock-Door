import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
// Mengimpor Ionicons agar styling serasi dengan LoginScreen
import { Ionicons } from '@expo/vector-icons'; 

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (email.trim() === '') {
      Alert.alert('Peringatan', 'Mohon masukkan alamat email Anda.');
      return;
    }
    
    // --- Logika Reset Password ---
    // Di sini Anda akan mengimplementasikan logika untuk mengirim email reset
    // Misalnya, memanggil API
    
    Alert.alert('Informasi', `Tautan reset kata sandi sedang diproses untuk ${email}.`);
    
    // Untuk simulasi, kita langsung kembali ke Login setelah 2 detik
    setTimeout(() => {
      navigation.goBack(); 
    }, 2000); 
  };

  const goToLogin = () => {
    navigation.goBack(); // Kembali ke layar Login
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Lupa Kata Sandi?</Text>
          <Text style={styles.subtitle}>
            Masukkan alamat email Anda untuk mereset kata sandi.
          </Text>

          {/* Input Email dengan Icon */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#999" />
            <TextInput
              placeholder="Username"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>
          
          {/* Tombol Reset Password */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleResetPassword}
          >
            <Text style={styles.buttonText}>Kirim Tautan Reset</Text>
          </TouchableOpacity>

          {/* Link Kembali ke Login/Sign In */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.link}>Kembali ke Sign In</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Gaya Utama Serasi dengan LoginScreen ---
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb', // Latar belakang abu-abu muda
    justifyContent: 'center' 
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20, // Tambahan padding agar card tidak terlalu lebar
  },
  card: {
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 25,
    // marginHorizontal: 20, // Sudah dicakup oleh keyboardContainer
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#111', 
    marginBottom: 5,
    textAlign: 'center', // Agar judul di tengah
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 25,
    textAlign: 'center', // Agar subtitle di tengah
  },
  
  // --- Gaya Input Serasi dengan LoginScreen ---
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20, // Sedikit lebih besar dari LoginScreen karena hanya ada satu input
    backgroundColor: 'white',
  },
  input: { 
    flex: 1, 
    height: 45, 
    marginLeft: 5,
    fontSize: 16, // Ukuran font disamakan
    color: '#333',
  },
  
  // --- Gaya Tombol Serasi dengan LoginScreen ---
  button: {
    backgroundColor: '#1e3a8a', // Warna biru tua
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 16 
  },
  
  // --- Gaya Footer/Link Serasi dengan LoginScreen ---
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 10 
  },
  link: { 
    color: '#1e3a8a', // Warna link biru tua
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline', // Opsional, agar terlihat seperti link
  },
});