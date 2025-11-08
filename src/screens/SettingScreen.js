import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Hook untuk mengetahui apakah layar ini aktif

  // State untuk menampilkan nama yang diperbarui
  const [currentName, setCurrentName] = useState('Loading...');
  const [isLightMode, setIsLightMode] = useState(true);

  // Fungsi untuk memuat data terbaru setelah kembali dari Edit Profile
  const loadProfileData = async () => {
    try {
      // Inisialisasi data awal jika belum ada (hanya untuk simulasi)
      let storedName = await AsyncStorage.getItem('user_name');
      if (!storedName) {
         await AsyncStorage.setItem('user_name', 'Charlotte King');
         storedName = 'Charlotte King';
      }
      setCurrentName(storedName);
    } catch (error) {
      console.log('Error loading data for settings:', error);
    }
  };

  // Panggil loadProfileData setiap kali layar ini kembali menjadi fokus (setelah kembali dari Edit Profile)
  useEffect(() => {
    if (isFocused) {
      loadProfileData();
    }
  }, [isFocused]);

  // Komponen untuk setiap baris menu di Settings
  const SettingItem = ({ title, onPress, showArrow = true, iconName, children }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={!onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {iconName && <Ionicons name={iconName} size={24} color="#2e7d32" style={{ marginRight: 15 }} />}
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {children}
        {showArrow && <Ionicons name="chevron-forward-outline" size={20} color="#777" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Kembali', 'Anda kembali ke Home')}>
             <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <Ionicons name={isLightMode ? "sunny" : "moon"} size={24} color={isLightMode ? "#ffc107" : "#2e7d32"} />
      </View>
      
      <ScrollView>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          {/* TOMBOL YANG KAMU INGINKAN */}
          <SettingItem 
            title="Edit Profile" 
            iconName="person-circle-outline"
            onPress={() => navigation.navigate('EditProfile')} // NAVIGASI KE LAYAR EDIT PROFILE
          >
            {/* Menampilkan nama user di samping menu Edit Profile */}
            <Text style={styles.currentNameText}>{currentName}</Text>
          </SettingItem>
          <SettingItem title="Change Password" iconName="lock-closed-outline" onPress={() => navigation.navigate('ChangePassword')} />
          <SettingItem title="Connect Social" iconName="share-social-outline" onPress={() => Alert.alert('Navigasi', 'Halaman Hubungkan Sosial Media')} />
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <SettingItem title="App Notifications" iconName="notifications-outline" showArrow={false}>
            <Switch 
              value={true} 
              onValueChange={() => {}} 
              thumbColor="#2e7d32"
            />
          </SettingItem>
        </View>
        
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.section}>
          <SettingItem title="Light Mode" iconName="sunny-outline" showArrow={false}>
            <Switch 
              value={isLightMode} 
              onValueChange={setIsLightMode} 
              thumbColor={isLightMode ? "#2e7d32" : "#777"}
            />
          </SettingItem>
        </View>
        
        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={ () => {}}>
          <Ionicons name="log-out-outline" size={20} color="#2e7d32" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{height: 50}}/>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentNameText: {
    fontSize: 14,
    color: '#777',
    marginRight: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  logoutText: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});