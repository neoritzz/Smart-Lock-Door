import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // visibility control
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const auth = getAuth();

  const reauthenticate = async (currentPassword) => {
    const user = auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    return reauthenticateWithCredential(user, cred);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Semua kolom harus diisi');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return;
    }

    try {
      await reauthenticate(currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Sukses', 'Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.log(error);
      Alert.alert('Gagal', 'Password lama salah atau terjadi kesalahan');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Ubah Password
      </Text>

      {/* Password Lama */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        <TextInput
          placeholder="Password Lama"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrent}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            paddingRight: 40,
          }}
        />
        <TouchableOpacity
          onPress={() => setShowCurrent(!showCurrent)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showCurrent ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Password Baru */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        <TextInput
          placeholder="Password Baru"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            paddingRight: 40,
          }}
        />
        <TouchableOpacity
          onPress={() => setShowNew(!showNew)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showNew ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Konfirmasi Password Baru */}
      <View style={{ position: 'relative', marginBottom: 20 }}>
        <TextInput
          placeholder="Konfirmasi Password Baru"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            paddingRight: 40,
          }}
        />
        <TouchableOpacity
          onPress={() => setShowConfirm(!showConfirm)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Tombol Simpan */}
      <TouchableOpacity
        onPress={handleChangePassword}
        style={{
          backgroundColor: '#007BFF',
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Simpan Perubahan
        </Text>
      </TouchableOpacity>
    </View>
  );
}
