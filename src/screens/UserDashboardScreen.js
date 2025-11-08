import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function UserDashboardScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [accountStatus, setAccountStatus] = useState('Inactive');
  const [activePeriod, setActivePeriod] = useState('-');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [relayStates, setRelayStates] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
  });

  // Ambil data user dari AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername || '');
      fetchAccountData(storedUsername);
    };
    fetchUser();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAccountData(username);
    setIsRefreshing(false);
  };

  // Ambil status akun user
  const fetchAccountData = async (username) => {
    if (!username) return;

    try {
      const res = await axios.get(`http://192.168.20.8:3000/api/user/${username}`);
      const { status, active_period } = res.data;
      setAccountStatus(status);
      setActivePeriod(active_period || '-');
    } catch (error) {
      console.log('Gagal ambil data akun:', error.message);
      Alert.alert('Error', 'Tidak bisa mengambil data akun.');
    }
  };

  // Toggle relay ESP32
  const toggleRelay = async (relayName) => {
    try {
      const newState = !relayStates[relayName];
      setRelayStates({ ...relayStates, [relayName]: newState });

      await axios.post(`http://192.168.20.8:3000/api/esp32/${relayName}`, {
        state: newState ? 1 : 0,
      });

      Alert.alert('ESP32', `${relayName} berhasil ${newState ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.log('Error control relay:', error.message);
      Alert.alert('Error', 'Tidak bisa mengirim perintah ke ESP32.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>User Dashboard</Text>

      {/* Info Akun */}
      <View style={styles.card}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{username}</Text>

        <Text style={styles.label}>Account Status:</Text>
        <Text
          style={[
            styles.value,
            { color: accountStatus === 'Active' ? 'green' : 'red', fontWeight: 'bold' },
          ]}
        >
          {accountStatus}
        </Text>

        <Text style={styles.label}>Active Period:</Text>
        <Text style={styles.value}>{activePeriod}</Text>
      </View>

      {/* ESP32 Control */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ESP32 Relay Control</Text>

        {['relay1', 'relay2', 'relay3'].map((relay) => (
          <TouchableOpacity
            key={relay}
            style={[
              styles.relayButton,
              relayStates[relay] ? styles.relayOn : styles.relayOff,
            ]}
            onPress={() => toggleRelay(relay)}
          >
            <Text style={styles.relayText}>
              {relay.toUpperCase()} - {relayStates[relay] ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2563eb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  label: { fontSize: 14, color: '#555', marginTop: 8 },
  value: { fontSize: 16, color: '#111' },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
  },
  relayButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  relayOn: { backgroundColor: '#22c55e' },
  relayOff: { backgroundColor: '#ef4444' },
  relayText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
