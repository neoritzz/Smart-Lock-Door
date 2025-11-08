import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* FORM INPUTS */}
      <View style={{ marginTop: 10 }}>
        {/* OLD PASSWORD */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Old Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setShowCurrent(!showCurrent)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showCurrent ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* NEW PASSWORD */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setShowNew(!showNew)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showNew ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm(!showConfirm)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* BUTTON */}
      <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
        <Ionicons name="save-outline" size={22} color="#fff" style={styles.icon} />
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    paddingRight: 40,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  icon: {
    marginRight: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
