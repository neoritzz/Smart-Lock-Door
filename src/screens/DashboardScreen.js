import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, 
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// --- IMPOR FIREBASE MODULAR (PASTIKAN ADA 'push') ---
import { db } from '../Config/firebaseConfig'; 
import { ref, onValue, set, query, orderByChild, limitToLast, off, push } from 'firebase/database'; 

// --- KOMPONEN TOMBOL KONTROL ESP32 ---
const Esp32ControlToggle = ({ label, color, darkModeEnabled, enabled, firebasePath, onToggle, otherRelaysActive, relayId }) => {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Dapatkan status real-time dari Firebase (onValue)
  useEffect(() => {
    // firebasePath = smartLock/relayStatus/relay{N} <--- JALUR BACA STATUS
    const relayRef = ref(db, firebasePath);

    const unsubscribe = onValue(relayRef, (snapshot) => {
      const status = snapshot.val();
      console.log(`[${label}] Status updated from ${firebasePath}:`, status);
      
      // Handle berbagai format status (boolean, string "ON"/"OFF", number 1/0)
      if (status === "ON" || status === true || status === 1) {
        setIsOn(true);
        if (onToggle) {
          onToggle(label, true, false); // Update state lokal Dashboard (Mutual Exclusion)
        }
      } else if (status === "OFF" || status === false || status === 0) {
        setIsOn(false);
        if (onToggle) {
          onToggle(label, false, false); // Update state lokal Dashboard (Mutual Exclusion)
        }
      }
    });

    // Cleanup listener
    return () => off(relayRef, 'value', unsubscribe);
  }, [firebasePath, label, onToggle]);

  // 2. Kirim perintah baru ke Firebase (PUSH ke Log Perintah)
  const toggleState = async () => {
    if (!enabled || loading) return;

    // Jika relay lain aktif dan kita mencoba menyalakan relay ini
    if (!isOn && otherRelaysActive) {
      Alert.alert(
        "Relay Lain Aktif",
        "Hanya satu relay yang dapat aktif dalam satu waktu. Matikan relay lain terlebih dahulu.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    const newState = !isOn;
    
    if (!relayId) { 
      console.error("Kesalahan internal: Relay ID tidak ditemukan.");
      Alert.alert("Error", "Relay ID tidak ditemukan.");
      setLoading(false);
      return;
    }

    try {
      console.log(`[Kontrol ESP32] MENGIRIM PERINTAH PUSH Relay ${relayId} (${label}): ${newState ? 'ON' : 'OFF'}`);
      
      // --- PUSH PERINTAH KE JALUR PERINTAH BARU ---
      // Bridge ESP32/Arduino akan mendengarkan jalur ini, memproses, dan memperbarui status di smartLock/relayStatus
      const commandRef = ref(db, 'smartLock/appCommands'); 
      await push(commandRef, {
        relay: relayId, // ID relay yang benar (1, 2, atau 3)
        value: newState ? 1 : 0, // Nilai yang mudah diproses Bridge
        action: newState ? "MOBILE_ON" : "MOBILE_OFF",
        timestamp: Date.now()
      });
      // ----------------------------------------------------
      
      // Update state lokal Dashboard segera untuk Mutual Exclusion, 
      // Status visual button akan diupdate oleh listener onValue
      if (onToggle) {
        onToggle(label, newState, true); // Update state lokal Dashboard (Mutual Exclusion)
      }
    } catch (error) {
      console.error("Gagal mengirim perintah di Firebase:", error);
      Alert.alert("Error", "Gagal mengirim perintah. Cek koneksi internet.");
    } finally {
      // Status loading akan mati setelah jeda singkat untuk efek visual
      // Walaupun status button diupdate oleh listener, loading tetap dikontrol di sini.
      setTimeout(() => setLoading(false), 800);
    }
  };

  const buttonColor = isOn ? color : (darkModeEnabled ? '#2e2e2e' : '#f0f0f0');
  const textColor = isOn
    ? (color === '#ffffff' ? '#000' : '#ffffff')
    : (darkModeEnabled ? '#b0b0b0' : '#888');

  return (
    <View style={esp32Styles.controlCard}>
      <TouchableOpacity
        style={[
          esp32Styles.toggleButton,
          { 
            backgroundColor: buttonColor, 
            borderColor: color, 
            opacity: enabled ? 1 : 0.6,
            shadowColor: isOn ? color : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isOn ? 0.4 : 0.1,
            shadowRadius: isOn ? 10 : 5,
            elevation: isOn ? 8 : 3,
          },
        ]}
        onPress={toggleState}
        disabled={!enabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            <Ionicons 
              name={isOn ? "power" : "power-outline"} 
              size={32} 
              color={textColor} 
            />
            <Text style={[esp32Styles.toggleText, { color: textColor }]}>
              {isOn ? 'ON' : 'OFF'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={[esp32Styles.toggleLabel, { 
        color: darkModeEnabled ? '#e0e0e0' : '#333',
        fontWeight: isOn ? 'bold' : 'normal'
      }]}>{label}</Text>
      <View style={[esp32Styles.statusIndicator, { 
        backgroundColor: isOn ? color : (darkModeEnabled ? '#444' : '#ddd')
      }]} />
      
      {/* Tampilkan pesan warning jika relay lain aktif */}
      {otherRelaysActive && !isOn && (
        <Text style={[esp32Styles.warningText, { 
          color: darkModeEnabled ? '#ff6b6b' : '#ff4444' 
        }]}>
          Matikan relay aktif lainnya
        </Text>
      )}
    </View>
  );
};

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [esp32Enabled, setEsp32Enabled] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showData, setShowData] = useState(true);
  const [allLogs, setAllLogs] = useState([]);
  // Menyimpan label relay yang aktif untuk Mutual Exclusion
  const [activeRelays, setActiveRelays] = useState([]); 
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // === 1. DEFINISI TEMA DINAMIS ===
  const theme = {
    background: darkModeEnabled ? '#121212' : '#f4f9ff',
    text: darkModeEnabled ? '#ffffff' : '#1a1a1a',
    headerBackground: darkModeEnabled ? '#1f1f1f' : '#dceeff',
    boxBackground: darkModeEnabled ? '#1e1e1e' : '#e9f3ff',
    tableBorder: darkModeEnabled ? '#444' : '#a8c4e2',
    modeIconColor: darkModeEnabled ? '#fff' : '#4b8ef7',
    inputBackground: darkModeEnabled ? '#222' : '#f8fbff',
    inputBorder: darkModeEnabled ? '#555' : '#c5d9f2',
    cardBackground: darkModeEnabled ? '#1e1e1e' : '#ffffff',
    cardBorder: darkModeEnabled ? '#333' : '#e0e0e0',
  };

  // === 2. MEMUAT TEMA DARI ASYNCSTORAGE ===
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('darkModeEnabled');
        if (storedMode !== null) setDarkModeEnabled(JSON.parse(storedMode));
      } catch (err) {
        console.log('Error loading theme:', err);
      }
    };
    loadTheme();
    const unsub = navigation.addListener('focus', loadTheme);
    return unsub;
  }, [navigation]);

  // === DATA LOG REAL-TIME DARI FIREBASE - SESUAI ARDUINO ===
  useEffect(() => {
    console.log('🚀 Setup Firebase listener untuk activity logs...');
    
    // PATH SESUAI ARDUINO: smartLock/activityLogs 
    const logsRef = ref(db, 'smartLock/activityLogs');
    
    // Query untuk mendapatkan data terbaru (maks 100)
    const orderedLogsRef = query(logsRef, orderByChild('timestamp'), limitToLast(100));
    
    setLoadingLogs(true);
    
    // Listener Real-time
    const unsubscribe = onValue(orderedLogsRef, (snapshot) => {
      const logsData = snapshot.val();
      const loadedLogs = [];
      
      console.log('📊 Data diterima dari Firebase:', logsData ? Object.keys(logsData).length : 0, 'records');
      
      if (logsData) {
        // Convert object ke array
        Object.keys(logsData).forEach((key) => {
          const item = logsData[key];
          
          loadedLogs.push({
            id: key,
            uid: item.uid || 'N/A', 
            user: item.user || 'Unknown User', 
            // Menggunakan Date object dari timestamp untuk konsistensi
            time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : (item.time || 'N/A'), 
            date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : (item.date || 'N/A'), 
            status: item.status || 'Unknown',
            timestamp: item.timestamp || 0 // Harus ada untuk sorting
          });
        });
        
        // Sort by timestamp descending (terbaru pertama)
        loadedLogs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Batasi ke 50 data terbaru
        const latestLogs = loadedLogs.slice(0, 50);
        setAllLogs(latestLogs);
        
        // Update last update time
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setAllLogs([]);
      }
      setLoadingLogs(false);
    }, (error) => {
      console.error("❌ Error reading logs:", error);
      Alert.alert("Database Error", "Gagal memuat data logs: " + error.message);
      setLoadingLogs(false);
    });

    return () => {
      console.log('🧹 Cleaning up Firebase log listener...');
      off(orderedLogsRef, 'value');
    };
  }, []); // Dependensi kosong agar hanya berjalan sekali saat mount

  // Filter logs berdasarkan search text
  const filteredLogs = useMemo(() => {
    if (!showData) return [];
    if (searchText.trim() === '') return allLogs;
    
    const searchLower = searchText.toLowerCase().trim();
    
    return allLogs.filter(
      (item) =>
        (item.uid && item.uid.toLowerCase().includes(searchLower)) ||
        (item.user && item.user.toLowerCase().includes(searchLower)) ||
        (item.status && item.status.toLowerCase().includes(searchLower))
    );
  }, [searchText, allLogs, showData]);

  // === PATH FIREBASE KONTROL BARU ===
  const controlButtons = useMemo(() => [
    // firebasePath = JALUR BACA STATUS, relayId = ID PERINTAH
    { label: 'Relay 1 (Lock)', color: '#FF1493', firebasePath: 'smartLock/relayStatus/relay1', relayId: 1 },
    { label: 'Relay 2', color: '#1E90FF', firebasePath: 'smartLock/relayStatus/relay2', relayId: 2 }, 
    { label: 'Relay 3', color: '#3CB371', firebasePath: 'smartLock/relayStatus/relay3', relayId: 3 },
  ], []);

  // Fungsi untuk menangani perubahan status relay (Digunakan oleh Esp32ControlToggle)
  // Ini digunakan untuk mengelola state lokal 'activeRelays' untuk Mutual Exclusion Logic
  const handleRelayToggle = useCallback((relayLabel, newState, isCommandOrigin) => {
    // console.log(`[Dashboard] Status updated for ${relayLabel}: ${newState ? 'ON' : 'OFF'}`);
    
    setActiveRelays(prev => {
      // Selalu hapus relay saat ini dari daftar
      const updated = prev.filter(relay => relay !== relayLabel);
      
      // Jika status baru adalah ON, tambahkan ke daftar
      if (newState) {
        updated.push(relayLabel);
      }
      // Kita hanya mengizinkan 1 relay aktif dalam daftar, ini adalah kunci Mutual Exclusion
      // Jika ada lebih dari 1 (misalnya karena race condition), kita hanya simpan yang terakhir di ON
      if (updated.length > 1) {
        return updated.slice(-1); 
      }
      return updated;
    });
  }, []);


  // Cek apakah ada relay lain yang aktif selain relay yang sedang diperiksa
  const isOtherRelaysActive = useCallback((currentRelayLabel) => {
    // True jika ada relay yang aktif DAN relay tersebut BUKAN relay yang sedang diperiksa
    return activeRelays.some(relay => relay !== currentRelayLabel);
  }, [activeRelays]);

  // Refresh data manually (hanya menyetel state loading, listener Firebase yang melakukan fetching)
  const refreshData = async () => {
    // Karena listener Firebase (onValue) sudah aktif, kita hanya menyetel state loading
    // untuk menampilkan indikator refresh/loading.
    setLoadingLogs(true);
    // Beri waktu seolah-olah data sedang diambil
    setTimeout(() => {
        setLoadingLogs(false);
        setLastUpdate(new Date().toLocaleTimeString()); // Update time secara visual
    }, 1000);
  };

  // Pull to refresh function
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View
        style={[
          styles.headerFixed,
          { 
            backgroundColor: theme.headerBackground,
            borderBottomColor: theme.tableBorder,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerIconContainer}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Smart Lock Door</Text>
        <Ionicons name={darkModeEnabled ? 'moon' : 'sunny'} size={28} color={theme.modeIconColor} />
      </View>

      {/* ScrollView dengan Refresh Control */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 100 : 90, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.modeIconColor]}
            tintColor={theme.modeIconColor}
          />
        }
      >
        {/* STATUS AKUN */}
        <View
          style={[
            styles.section,
            styles.infoBox,
            {
              backgroundColor: darkModeEnabled ? '#1f3b3a' : '#e8faff',
              borderColor: darkModeEnabled ? '#355f5d' : '#b7e5f2',
            },
          ]}
        >
          <Text style={[styles.label, { color: theme.text }]}>Account Status:</Text>
          <Text style={styles.statusText}>Active (Premium)</Text>
          <Text style={[styles.label, { color: theme.text }]}>Active Period:</Text>
          <Text style={{ color: theme.text }}>Valid until August 10, 2025</Text>
        </View>

        {/* SEARCH & REFRESH ACTIONS */}
        <View style={styles.section}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Search UID, or User..."
              placeholderTextColor={darkModeEnabled ? '#888' : '#666'}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close-circle" size={20} color={darkModeEnabled ? '#888' : '#666'} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchActions}>
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>Reset Search</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.refreshButton}
              disabled={refreshing}
            >
              <Ionicons name="refresh" size={16} color="#007AFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* UID LOG TABLE */}
        <View
          style={[
            styles.section,
            styles.uidBox,
            { 
              backgroundColor: theme.boxBackground, 
              borderColor: theme.tableBorder,
              padding: 10,
            },
          ]}
        >
          <View style={styles.tableHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                RFID Activity Log
              </Text>
              {(lastUpdate || (!loadingLogs && !refreshing)) && (
                <Text style={[styles.lastUpdate, { color: darkModeEnabled ? '#aaa' : '#666' }]}>
                  Last update: {lastUpdate || 'Now'}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {(loadingLogs || refreshing) && (
                <ActivityIndicator size="small" color={theme.modeIconColor} />
              )}
              <Text style={[styles.logCount, { color: darkModeEnabled ? '#aaa' : '#666' }]}>
                {filteredLogs.length} logs
              </Text>
            </View>
          </View>

          {/* HEADER TABEL */}
          <View style={[styles.tableRow, styles.tableHeaderRow, {borderBottomColor: theme.tableBorder}]}>
            {['UID', 'User', 'Time', 'Date', 'Status'].map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.tableCell,
                  styles.tableHeaderText,
                  { 
                    backgroundColor: theme.headerBackground, 
                    color: theme.text,
                    flex: i === 0 || i === 1 ? 1.5 : 1, // Beri bobot lebih ke UID dan User
                  },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>

          {/* ISI DATA */}
          {(loadingLogs && !refreshing) ? ( 
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.modeIconColor} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading activity logs...
              </Text>
            </View>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((l, index) => (
              <View 
                key={l.id} 
                style={[
                  styles.tableRow, 
                  { 
                    borderBottomWidth: (index === filteredLogs.length - 1) ? 0 : 1, 
                    borderBottomColor: theme.tableBorder,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (darkModeEnabled ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                  }
                ]}
              >
                <Text style={[styles.tableCell, { color: theme.text, flex: 1.5 }]} numberOfLines={1}>{l.uid}</Text>
                <Text style={[styles.tableCell, { color: theme.text, flex: 1.5 }]} numberOfLines={1}>{l.user}</Text>
                <Text style={[styles.tableCell, { color: theme.text, flex: 1 }]}>{l.time}</Text>
                <Text style={[styles.tableCell, { color: theme.text, flex: 1 }]}>{l.date}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1 },
                    l.status && (l.status.includes('Unlocked') || l.status.includes('ON') || l.status.includes('Success') || l.status.includes('Granted')) 
                      ? styles.statusActive 
                      : styles.statusLock,
                  ]}
                  numberOfLines={1}
                >
                  {l.status}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={darkModeEnabled ? '#444' : '#ccc'} />
              <Text style={[styles.emptyStateText, { color: darkModeEnabled ? '#666' : '#999' }]}>
                {searchText ? 'No matching logs found' : 'No RFID activity logs available'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: darkModeEnabled ? '#555' : '#bbb' }]}>
                {searchText ? 'Try different search terms' : 'RFID card taps will appear here automatically'}
              </Text>
            </View>
          )}
        </View>

        {/* ESP32 CONTROLS SECTION */}
        <View style={[
          styles.section, 
          esp32Styles.controlSection,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          }
        ]}>
          <View style={esp32Styles.sectionHeader}>
            <View style={esp32Styles.titleContainer}>
              <Ionicons 
                name="hardware-chip" 
                size={24} 
                color={theme.text} 
                style={esp32Styles.sectionIcon}
              />
              <View>
                <Text style={[esp32Styles.sectionTitle, { color: theme.text }]}>
                  ESP32 Relay Controls
                </Text>
                <Text style={[esp32Styles.sectionSubtitle, { 
                  color: darkModeEnabled ? '#aaa' : '#666' 
                }]}>
                  {activeRelays.length > 0 
                    ? `Relay Aktif: ${activeRelays.join(', ')}` 
                    : 'Hanya satu relay dapat aktif dalam satu waktu'
                  }
                </Text>
              </View>
            </View>
            
            {/* Tombol ON/OFF Control Section */}
            <TouchableOpacity 
              onPress={() => setEsp32Enabled(!esp32Enabled)}
              style={[
                esp32Styles.toggleSectionButton,
                {
                  backgroundColor: esp32Enabled 
                    ? (darkModeEnabled ? '#442222' : '#ffe6e6') 
                    : (darkModeEnabled ? '#224422' : '#e6ffe6'),
                  borderColor: esp32Enabled ? (darkModeEnabled ? '#6b2a2a' : '#ffc0c0') : (darkModeEnabled ? '#2a6b2a' : '#c0ffc0'),
                }
              ]}
            >
              <Ionicons 
                name={esp32Enabled ? 'remove' : 'add'} 
                size={28} 
                color={esp32Enabled ? (darkModeEnabled ? '#ff6b6b' : '#ff4444') : (darkModeEnabled ? '#4CAF50' : '#2E7D32')} 
              />
            </TouchableOpacity>
          </View>

          {esp32Enabled ? (
            <View style={esp32Styles.controlGrid}>
              {controlButtons.map((button, index) => (
                <Esp32ControlToggle
                  key={index}
                  label={button.label}
                  color={button.color}
                  firebasePath={button.firebasePath}
                  relayId={button.relayId} 
                  darkModeEnabled={darkModeEnabled}
                  enabled={esp32Enabled}
                  onToggle={handleRelayToggle} // Pass fungsi untuk mengelola state aktif
                  otherRelaysActive={isOtherRelaysActive(button.label)} // Pass logic Mutual Exclusion
                />
              ))}
            </View>
          ) : (
            <View style={esp32Styles.disabledState}>
              <Ionicons 
                name="hardware-chip-outline" 
                size={48} 
                color={darkModeEnabled ? '#444' : '#ccc'} 
              />
              <Text style={[
                esp32Styles.disabledText,
                { color: darkModeEnabled ? '#666' : '#999' }
              ]}>
                Kontrol ESP32 dinonaktifkan
              </Text>
              <Text style={[
                esp32Styles.disabledSubtext,
                { color: darkModeEnabled ? '#555' : '#bbb' }
              ]}>
                Tekan tombol "+" untuk mengontrol relay
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;

// === STYLE YANG DITAMBAHKAN UNTUK ESP32 ===
const esp32Styles = StyleSheet.create({
  controlSection: {
    marginTop: 30,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  toggleSectionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: 52,
    height: 52,
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  controlCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 8,
  },
  toggleText: { 
    fontSize: 14, 
    fontWeight: 'bold',
    marginTop: 4,
  },
  toggleLabel: { 
    fontSize: 12, 
    textAlign: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  warningText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  disabledState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  disabledText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  disabledSubtext: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

// === STYLE UTAMA ===
const styles = StyleSheet.create({
  headerFixed: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 99,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 15, 
    paddingTop: Platform.OS === 'ios' ? 50 : 45, 
    paddingBottom: 10, 
    borderBottomWidth: 1,
  },
  headerIconContainer: { 
    padding: 4 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    flex: 1 
  },
  section: { 
    marginTop: 20 
  },
  infoBox: { 
    padding: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    elevation: 2 
  },
  label: { 
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  statusText: { 
    color: 'green', 
    fontWeight: 'bold', 
    marginBottom: 8,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: { 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    flex: 1,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  searchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: '#007AFF', 
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  sectionTitle: { 
    fontWeight: 'bold', 
    marginBottom: 4, 
    fontSize: 18 
  },
  uidBox: { 
    borderWidth: 1, 
    padding: 10, 
    borderRadius: 8, 
    elevation: 2, 
    overflow: 'hidden' 
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastUpdate: {
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logCount: {
    fontSize: 12,
    marginLeft: 8,
  },
  tableRow: { 
    flexDirection: 'row' 
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableCell: { 
    flex: 1, 
    paddingVertical: 8, 
    textAlign: 'center', 
    fontSize: 12,
    paddingHorizontal: 2,
  },
  tableHeaderText: { 
    fontWeight: 'bold',
  },
  statusActive: { 
    color: 'green', 
    fontWeight: 'bold' 
  },
  statusLock: { 
    color: 'red', 
    fontWeight: 'bold' 
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});