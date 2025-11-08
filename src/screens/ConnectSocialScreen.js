import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

export default function ConnectSocialScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Social</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* INSTRUKSI */}
      <Text style={styles.infoText}>Connect your account with:</Text>

      {/* GOOGLE */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#DB4437' }]}
        onPress={() => console.log('Google connect')}
      >
        <FontAwesome name="google" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Connect with Google</Text>
      </TouchableOpacity>

      {/* FACEBOOK */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#1877F2' }]}
        onPress={() => console.log('Facebook connect')}
      >
        <FontAwesome name="facebook" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Connect with Facebook</Text>
      </TouchableOpacity>

      {/* TWITTER */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#1DA1F2' }]}
        onPress={() => console.log('Twitter connect')}
      >
        <FontAwesome name="twitter" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Connect with Twitter</Text>
      </TouchableOpacity>

      {/* APPLE */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#000' }]}
        onPress={() => console.log('Apple connect')}
      >
        <Ionicons name="logo-apple" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Connect with Apple</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  infoText: { fontSize: 16, color: '#333', marginBottom: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  icon: { marginRight: 10 },
  text: { fontSize: 16, color: '#fff', fontWeight: '600' },
});
