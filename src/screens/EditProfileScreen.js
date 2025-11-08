import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// --- Komponen Input Field ---
const ProfileInputField = ({ label, value, onChangeText, keyboardType = 'default', isPassword = false, placeholder }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        // Pastikan secureTextEntry hanya berdasarkan prop isPassword
        secureTextEntry={isPassword} 
        placeholder={placeholder}
      />
      {isPassword && (
        <Ionicons name="eye-off-outline" size={20} color="#999" style={styles.passwordIcon} />
      )}
    </View>
  </View>
);
// --------------------------------------------------------


export default function EditProfileScreen() {
  const navigation = useNavigation();
  // Menggunakan null sebagai nilai awal, akan diisi dari AsyncStorage
  const [name, setName] = useState(null); 
  const [email, setEmail] = useState(null);
  const [username, setUsername] = useState(null);
  const [phone, setPhone] = useState(null);
  // Password hanya untuk tampilan, tidak untuk diubah
  const [password, setPassword] = useState('********'); 

  // --- 1. Load data saat komponen dimuat ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedName = await AsyncStorage.getItem('user_name');
        const storedEmail = await AsyncStorage.getItem('user_email');
        const storedUsername = await AsyncStorage.getItem('user_username');
        const storedPhone = await AsyncStorage.getItem('user_phone');
        
        // Tetapkan state. Jika stored data null, gunakan nilai default.
        setName(storedName ?? 'Charlotte King');
        setEmail(storedEmail ?? '@johnkinggraphics.gmail.com');
        setUsername(storedUsername ?? '@johnkinggraphics');
        setPhone(storedPhone ?? '+91 6895312');
        
      } catch (error) {
        console.log('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  // --- 2. Fungsi Simpan (terhubung ke tombol ceklis di header) ---
  const saveProfile = async () => {
    if (!name || !email || !username) {
      Alert.alert('Gagal', 'Nama, Email, dan Username tidak boleh kosong.');
      return;
    }
    
    if (name === null) {
      Alert.alert('Tunggu', 'Data profil sedang dimuat, coba lagi sebentar.');
      return;
    }

    try {
      // Simpan semua state yang baru ke AsyncStorage
      await AsyncStorage.setItem('user_name', name);
      await AsyncStorage.setItem('user_email', email);
      await AsyncStorage.setItem('user_username', username);
      await AsyncStorage.setItem('user_phone', phone);
      
      Alert.alert('Success', 'Profil berhasil diperbarui!');
      
      // Navigasi kembali. SettingsScreen akan me-refresh data karena fokusnya kembali.
      navigation.goBack(); 
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Gagal menyimpan perubahan.');
    }
  };

  // Setup Header dengan tombol ceklis
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Profile',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: 'bold', color: '#000' },
      headerBackVisible: false, 
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 15 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        // Tombol ceklis memanggil saveProfile
        <TouchableOpacity onPress={saveProfile} style={{ paddingLeft: 15 }}>
          <Ionicons name="checkmark" size={30} color="#2e7d32" /> 
        </TouchableOpacity>
      ),
      headerShown: true,
    });
  }, [navigation, name, email, username, phone, saveProfile]);

  // Tampilkan Loading jika data masih dimuat
  if (name === null) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text>Memuat data...</Text>
          </View>
      );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileArea}>
        <View style={styles.profileImageContainer}>
          <Image 
            style={styles.profileImage}
            source={{ uri: 'https://via.placeholder.com/150/0000FF/808080?Text=CK' }} // Placeholder
          />
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={12} color="#000" />
          </View>
        </View>
      </View>

      <View style={styles.form}>
        <ProfileInputField label="Name" value={name} onChangeText={setName} placeholder="Charlotte king" />
        <ProfileInputField label="E mail address" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="@johnkinggraphics.gmail.com" />
        <ProfileInputField label="User name" value={username} onChangeText={setUsername} placeholder="@johnkinggraphics" />
        
        {/* Password field yang hanya menampilkan '********' */}
        <ProfileInputField 
            label="Password" 
            value={password} 
            isPassword={true} 
            onChangeText={setPassword} 
            placeholder="********" 
        />
        
        <ProfileInputField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 6895312" />
      </View>
      <View style={{height: 50}}/>
    </ScrollView>
  );
}

// ... styles (tetap sama)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    profileArea: {
        alignItems: 'center',
        marginVertical: 20,
        marginTop: 30,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#eee',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 3,
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
        width: 25,
        height: 25,
    },
    form: {
        marginTop: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', 
        borderRadius: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
    },
    passwordIcon: {
        paddingRight: 15,
    }
});