import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios'; // ✅ Tambahan Step 2

// ===== FUNCTION BUAT KONEKSI MIDTRANS (Step 3) =====
const handleMidtransPayment = async (type) => {
  try {
    // Contoh endpoint backend kamu (ganti IP sesuai lokal/hosting)
    const response = await axios.post('http://192.168.20.8:3000/api/payment/create', {
      payment_type: type, // kirim tipe pembayaran misal 'gopay', 'bca_va', dll
      amount: 10000, // contoh nominal
    });

    const { redirect_url } = response.data;

    if (redirect_url) {
      await Linking.openURL(redirect_url);
    } else {
      Alert.alert('Gagal', 'Tidak ada URL pembayaran dari server.');
    }
  } catch (error) {
    console.log('Midtrans error:', error);
    Alert.alert('Error', 'Gagal memproses pembayaran.');
  }
};

// ===== FUNCTION BUAT BUKA APP E-WALLET / BANK =====
const openPaymentApp = async (type) => {
  let url = '';

  switch (type) {
    case 'DANA':
      // 🔁 Ubah dari buka app → trigger Midtrans
      return handleMidtransPayment('dana');
    case 'ShopeePay':
      return handleMidtransPayment('shopeepay');
    case 'GoPay':
      return handleMidtransPayment('gopay');
    case 'OVO':
      return handleMidtransPayment('ovo');
    case 'LinkAja':
      return handleMidtransPayment('linkaja');

    // Virtual Account (via Midtrans)
    case 'BRI':
      return handleMidtransPayment('bri_va');
    case 'BCA':
      return handleMidtransPayment('bca_va');
    case 'Mandiri':
      return handleMidtransPayment('mandiri_va');
    case 'BNI':
      return handleMidtransPayment('bni_va');
    case 'Permata':
      return handleMidtransPayment('permata_va');

    default:
      Alert.alert('Error', 'Tipe pembayaran tidak dikenal.');
      return;
  }

  // fallback manual (kalau mau buka app langsung)
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert(
      'Tidak dapat membuka aplikasi',
      `Pastikan aplikasi ${type} sudah terinstal di perangkat kamu.`
    );
  }
};

export default function PaymentScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <Ionicons name="card-outline" size={24} color="#2e7d32" />
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* QRIS */}
        <TouchableOpacity style={styles.paymentBox}>
          <View style={styles.row}>
            <Ionicons name="qr-code-outline" size={36} color="#2e7d32" style={{ marginRight: 15 }} />
            <View>
              <Text style={styles.paymentTitle}>QRIS</Text>
              <Text style={styles.paymentSub}>Min. Rp 100</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* E-Wallet */}
        <Text style={styles.sectionTitle}>E-Wallet</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('DANA')}>
            <Ionicons name="wallet-outline" size={26} color="#2e7d32" />
            <Text style={styles.menuText}>DANA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('ShopeePay')}>
            <Ionicons name="logo-bitcoin" size={26} color="#2e7d32" />
            <Text style={styles.menuText}>ShopeePay</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('GoPay')}>
            <Ionicons name="logo-google" size={26} color="#2e7d32" />
            <Text style={styles.menuText}>GoPay</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('OVO')}>
            <Ionicons name="logo-apple" size={26} color="#2e7d32" />
            <Text style={styles.menuText}>OVO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => openPaymentApp('LinkAja')}
          >
            <Ionicons name="logo-wechat" size={26} color="#2e7d32" />
            <Text style={styles.menuText}>LinkAja</Text>
          </TouchableOpacity>
        </View>

        {/* Virtual Account */}
        <Text style={styles.sectionTitle}>Virtual Account</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('BRI')}>
            <Ionicons name="business-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>BANK BRI (BRIVA)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('Permata')}>
            <Ionicons name="card-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>BANK PERMATA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('Mandiri')}>
            <Ionicons name="cash-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>BANK Mandiri</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPaymentApp('BCA')}>
            <Ionicons name="business-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>BANK BCA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => openPaymentApp('BNI')}
          >
            <Ionicons name="business-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>BANK BNI</Text>
          </TouchableOpacity>
        </View>

        {/* Convenience Store */}
        <Text style={styles.sectionTitle}>Convenience Store</Text>
        <View style={styles.section}>
          <View style={styles.menuItem}>
            <Ionicons name="storefront-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>Indomaret</Text>
          </View>
          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <Ionicons name="cart-outline" size={24} color="#2e7d32" />
            <Text style={styles.menuText}>Alfamart</Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// ===== STYLES TETAP SAMA =====
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
    marginBottom: 10,
  },
  paymentBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 15,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentSub: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
