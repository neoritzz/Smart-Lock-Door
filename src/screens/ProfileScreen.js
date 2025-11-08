import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Komponen Item Pengaturan yang Disederhanakan ---
const SettingItem = ({
  iconName,
  title,
  subtitle,
  onPress,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  // HAPUS isLast dari props
  darkModeEnabled,
}) => {
  // Menentukan warna berdasarkan Dark Mode
  const textColor = darkModeEnabled ? '#E0E0E0' : '#333';
  const iconColor = darkModeEnabled ? '#A5D6A7' : '#2e7d32'; // Hijau Aksen
  const separatorColor = darkModeEnabled ? '#333333' : '#E0E0E0'; // Garis pemisah halus

  const content = (
    <>
      {/* Ikon Item */}
      {iconName && (
        <Ionicons name={iconName} size={22} color={iconColor} style={styles.itemIcon} />
      )}
      
      {/* Teks Item */}
      <View style={styles.itemTextContainer}>
        <Text style={[styles.itemTitle, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: darkModeEnabled ? '#BDBDBD' : '#757575' }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {/* Switch atau Chevron */}
      {isSwitch ? (
        <Switch
          trackColor={{ false: '#757575', true: '#81c784' }} // Hijau Aksesn untuk mode aktif
          thumbColor="#f4f3f4"
          value={switchValue}
          onValueChange={onSwitchChange}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={darkModeEnabled ? '#757575' : '#BDBDBD'} />
      )}
    </>
  );

  return (
    <TouchableOpacity
      style={[
        styles.item,
        // Garis pemisah: Dibuat permanen (borderBottomWidth: 1) untuk semua item
        { borderBottomWidth: 1, borderBottomColor: separatorColor },
      ]}
      onPress={onPress}
      disabled={isSwitch && !onPress}
    >
      {content}
    </TouchableOpacity>
  );
};

// --- Komponen Utama ---
export default function ProfileScreen() {
  const [appNotifEnabled, setAppNotifEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const navigation = useNavigation();

  // === LOAD MODE DARI STORAGE ===
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('darkModeEnabled');
        if (storedMode !== null) {
          setDarkModeEnabled(JSON.parse(storedMode));
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // === SIMPAN MODE KE STORAGE ===
  const toggleDarkMode = async (val) => {
    try {
      setDarkModeEnabled(val);
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(val));
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Warna dinamis
  const backgroundColor = darkModeEnabled ? '#121212' : '#fff';
  const headerTextColor = darkModeEnabled ? '#fff' : '#2e7d32';

  // Handler Navigasi Dummy (Anda bisa mengganti ini dengan navigasi yang sebenarnya)
  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  
  // Handler Logout
    const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_name');
  
      navigation.navigate('Login');

    } catch (error) {
      Alert.alert('Error', 'Gagal logout, coba lagi.');
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={darkModeEnabled ? '#fff' : '#333'}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: headerTextColor }]}>
          Settings
        </Text>

        <Ionicons
          name={darkModeEnabled ? 'moon' : 'sunny'}
          size={24}
          color={darkModeEnabled ? '#fff' : '#fbc02d'}
        />
      </View>
      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* ACCOUNT SECTION */}
        <Text style={[styles.sectionTitle, { color: headerTextColor }]}>Account</Text>
        <View style={styles.sectionContainer}>
          <SettingItem
            iconName="person-outline"
            title="Edit Profile"
            onPress={() => handleNavigation('EditProfile')}
            darkModeEnabled={darkModeEnabled}
            // Hapus isLast
          />
          <SettingItem
            iconName="key-outline"
            title="Change Password"
            onPress={() => handleNavigation('ChangePassword')}
            darkModeEnabled={darkModeEnabled}
            // Hapus isLast
          />
          <SettingItem
            iconName="share-social-outline"
            title="Connect Social"
            onPress={() => handleNavigation('ConnectSocial')}
            // Hapus isLast
            darkModeEnabled={darkModeEnabled}
          />
        </View>

        {/* NOTIFICATIONS SECTION */}
        <Text style={[styles.sectionTitle, { color: headerTextColor }]}>Notifications</Text>
        <View style={styles.sectionContainer}>
          <SettingItem
            iconName="notifications-outline"
            title="App Notifications"
            subtitle="Get alerts for updates and activities"
            isSwitch
            switchValue={appNotifEnabled}
            onSwitchChange={setAppNotifEnabled}
            // Hapus isLast
            darkModeEnabled={darkModeEnabled}
          />
        </View>

        {/* MODE SECTION (Display) */}
        <Text style={[styles.sectionTitle, { color: headerTextColor }]}>Display</Text>
        <View style={styles.sectionContainer}>
          <SettingItem
            iconName={darkModeEnabled ? 'moon-outline' : 'sunny-outline'}
            title={darkModeEnabled ? 'Dark Mode' : 'Light Mode'}
            subtitle={`Current mode: ${darkModeEnabled ? 'Dark' : 'Light'}`}
            isSwitch
            switchValue={darkModeEnabled}
            onSwitchChange={toggleDarkMode}
            // Hapus isLast
            darkModeEnabled={darkModeEnabled}
          />
        </View>

        {/* MORE SECTION */}
        <Text style={[styles.sectionTitle, { color: headerTextColor }]}>More</Text>
        <View style={styles.sectionContainer}>
          <SettingItem
            iconName="language-outline"
            title="Language"
            subtitle="English (US)"
            onPress={() => handleNavigation('Language')}
            darkModeEnabled={darkModeEnabled}
            // Hapus isLast
          />
          <SettingItem
            iconName="card-outline"
            title="Payment"
            onPress={() => handleNavigation('Payment')}
            // Hapus isLast
            darkModeEnabled={darkModeEnabled}
          />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: headerTextColor }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={headerTextColor} />
          <Text style={[styles.logoutText, { color: headerTextColor }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, // Sesuaikan dengan status bar Anda
    paddingHorizontal: 16,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  backIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700', // Lebih tebal
    textAlign: 'center',
    flex: 1,
  },
  // Style untuk Judul Kategori (misalnya: Account, Notifications)
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    paddingLeft: 5, // Sedikit padding untuk estetika
  },
  // Style untuk pembungkus item (agar item terlihat sebagai satu kelompok)
  sectionContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Style untuk setiap item pengaturan
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 5,
    minHeight: 50,
  },
  itemIcon: {
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});