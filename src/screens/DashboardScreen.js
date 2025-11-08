import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../Config/firebaseConfig';
import { ref, onValue, off, push } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';

// === RELAY CONFIG ===
const RELAY_CONFIGS = [
  { label: 'Relay 1 (Lock)', color: '#FF1493', relayId: 1 },
  { label: 'Relay 2', color: '#1E90FF', relayId: 2 },
  { label: 'Relay 3', color: '#3CB371', relayId: 3 },
];

const FIREBASE_STATUS_PATH = 'smartLock/relayStatus/';
const FIREBASE_COMMAND_PATH = 'smartLock/appCommands/';

const Esp32ControlToggle = ({
  label,
  color,
  darkModeEnabled,
  enabled,
  relayId,
  currentStatus,
  anyRelayOn,
}) => {
  const [loading, setLoading] = useState(false);
  const isOn = currentStatus;

  const toggleState = async () => {
    if (!enabled || loading) return;
    if (!isOn && anyRelayOn) {
      Alert.alert('Relay Aktif', 'Matikan relay lain sebelum menyalakan yang baru.');
      return;
    }
    setLoading(true);
    const newState = !isOn;

    try {
      const commandRef = ref(db, FIREBASE_COMMAND_PATH);
      await push(commandRef, {
        relay: relayId,
        value: newState ? 1 : 0,
        action: newState ? 'MOBILE_ON' : 'MOBILE_OFF',
        timestamp: Date.now(),
        source: 'USER_APP',
      });
    } catch {
      Alert.alert('Error', 'Tidak bisa mengirim perintah ke server.');
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const buttonColor = isOn ? color : darkModeEnabled ? '#2e2e2e' : '#f0f0f0';
  const textColor = isOn ? '#fff' : darkModeEnabled ? '#b0b0b0' : '#555';

  return (
    <View style={esp32Styles.controlCard}>
      <TouchableOpacity
        style={[
          esp32Styles.toggleButton,
          { backgroundColor: buttonColor, borderColor: color, opacity: enabled ? 1 : 0.5 },
        ]}
        onPress={toggleState}
        disabled={!enabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            <Ionicons name={isOn ? 'power' : 'power-outline'} size={30} color={textColor} />
            <Text style={[esp32Styles.toggleText, { color: textColor }]}>
              {isOn ? 'ON' : 'OFF'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={[esp32Styles.toggleLabel, { color: darkModeEnabled ? '#eee' : '#333' }]}>
        {label}
      </Text>
    </View>
  );
};

export default function UserScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // 🟢 DEFAULT PUTIH
  const [esp32Enabled, setEsp32Enabled] = useState(false);
  const [relayStatus, setRelayStatus] = useState({ relay1: false, relay2: false, relay3: false });
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');

  // === LOAD MODE DARI STORAGE ===
  useEffect(() => {
    const loadMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('darkModeEnabled');
        if (storedMode === null) {
          await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(false)); // 🟢 default terang
          setDarkModeEnabled(false);
        } else {
          setDarkModeEnabled(JSON.parse(storedMode));
        }
      } catch (err) {
        console.log('Gagal ambil dark mode:', err);
      }
    };
    if (isFocused) loadMode();

    const interval = setInterval(loadMode, 1000);
    return () => clearInterval(interval);
  }, [isFocused]);

  // === GET USERNAME ===
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUserName(parsed.username || 'User');
        }
      } catch (e) {
        console.log('Gagal ambil nama user:', e);
      }
    };
    fetchUserName();
  }, []);

  // === GREETING ===
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat pagi');
    else if (hour < 18) setGreeting('Selamat siang');
    else setGreeting('Selamat malam');
  }, []);

  // === FIREBASE LISTENER ===
  useEffect(() => {
    const rootRef = ref(db, FIREBASE_STATUS_PATH);
    const listener = onValue(rootRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRelayStatus({
        relay1: data.relay1 === true || data.relay1 === 'ON' || data.relay1 === 1,
        relay2: data.relay2 === true || data.relay2 === 'ON' || data.relay2 === 1,
        relay3: data.relay3 === true || data.relay3 === 'ON' || data.relay3 === 1,
      });
    });
    return () => off(rootRef, 'value', listener);
  }, []);

  const theme = {
    background: darkModeEnabled ? '#121212' : '#f4f9ff',
    text: darkModeEnabled ? '#ffffff' : '#1a1a1a',
    card: darkModeEnabled ? '#1e1e1e' : '#ffffff',
    accent: darkModeEnabled ? '#4da3ff' : '#2e7d32',
  };

  const anyRelayOn = Object.values(relayStatus).some((val) => val);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <LinearGradient
        colors={darkModeEnabled ? ['#0a0f2c', '#1a3c66'] : ['#0057ff', '#00a2ff']}
        style={[styles.headerFixed, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]}
      >
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Smart Lock Door</Text>
        <Ionicons name={darkModeEnabled ? 'moon' : 'sunny'} size={26} color="#fff" />
      </LinearGradient>

      {/* BODY */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 30 }}>
        {/* GREETING BOX */}
        <View style={[styles.greetingBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            {greeting}, <Text style={{ fontWeight: 'bold', color: theme.accent }}>{userName}</Text> 👋
          </Text>
        </View>

        {/* ACCOUNT INFO */}
        <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.accent }]}>
          <Text style={[styles.label, { color: theme.accent }]}>Account Status:</Text>
          <Text style={[styles.statusText, { color: theme.accent }]}>Active (Premium)</Text>
          <Text style={[styles.label, { color: theme.accent, marginTop: 5 }]}>Active Period:</Text>
          <Text style={{ color: theme.accent }}>Valid until August 10, 2025</Text>
        </View>

        {/* ESP32 CONTROL */}
        <View
          style={[
            esp32Styles.controlSection,
            {
              backgroundColor: theme.card,
              borderColor: darkModeEnabled ? '#333' : '#d0e7ff',
              shadowColor: theme.accent,
            },
          ]}
        >
          <View style={esp32Styles.sectionHeader}>
            <View>
              <Text style={[esp32Styles.sectionTitle, { color: theme.text }]}>ESP32 Relay Controls</Text>
              <Text style={{ color: darkModeEnabled ? '#aaa' : '#555', fontSize: 13 }}>
                Kontrol perangkat IoT secara real-time
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEsp32Enabled(!esp32Enabled)} style={esp32Styles.toggleSectionButton}>
              <Ionicons
                name={esp32Enabled ? 'remove' : 'add'}
                size={24}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>

          {esp32Enabled ? (
            <View style={esp32Styles.controlGrid}>
              {RELAY_CONFIGS.map((relay) => (
                <Esp32ControlToggle
                  key={relay.relayId}
                  label={relay.label}
                  color={relay.color}
                  relayId={relay.relayId}
                  darkModeEnabled={darkModeEnabled}
                  enabled={esp32Enabled}
                  currentStatus={relayStatus[`relay${relay.relayId}`]}
                  anyRelayOn={anyRelayOn && !relayStatus[`relay${relay.relayId}`]}
                />
              ))}
            </View>
          ) : (
            <View style={esp32Styles.disabledState}>
              <Ionicons name="hardware-chip-outline" size={48} color={theme.accent} />
              <Text style={{ color: theme.text, marginTop: 10, fontWeight: '600' }}>Kontrol ESP32 dinonaktifkan</Text>
              <Text style={{ color: darkModeEnabled ? '#888' : '#666', marginTop: 3, fontSize: 12 }}>
                Tekan tombol "+" untuk mengontrol relay
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// === STYLES ===
const esp32Styles = StyleSheet.create({
  controlSection: {
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  toggleSectionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  controlCard: { alignItems: 'center', width: '30%', marginBottom: 20 },
  toggleButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toggleText: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  toggleLabel: { fontSize: 12, textAlign: 'center' },
  disabledState: { alignItems: 'center', paddingVertical: 35 },
});

const styles = StyleSheet.create({
  headerFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 45,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  greetingBox: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  greetingText: { fontSize: 18, fontWeight: '600' },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
  },
  label: { fontWeight: 'bold', fontSize: 14 },
  statusText: { fontWeight: 'bold', marginBottom: 5, fontSize: 15 },
});
