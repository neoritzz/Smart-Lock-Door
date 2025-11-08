import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function LanguageScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('English (US)');

  const languages = [
    'English (US)',
    'Bahasa Indonesia',
    'Español (Spanish)',
    'Français (French)',
    'Deutsch (German)',
    '日本語 (Japanese)',
    '한국어 (Korean)',
    '中文 (Mandarin)',
    'Português (Portuguese)',
    'Русский (Russian)',
    'العربية (Arabic)',
    'हिन्दी (Hindi)',
    'ไทย (Thai)',
    'Türkçe (Turkish)',
    'Italiano (Italian)',
    'Nederlands (Dutch)',
    'Polski (Polish)',
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <Ionicons name="language-outline" size={24} color="#2e7d32" />
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {languages.map((lang, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.languageItem,
              selected === lang && styles.selectedLanguage,
            ]}
            onPress={() => setSelected(lang)}
          >
            <Text
              style={[
                styles.languageText,
                selected === lang && { color: '#2e7d32', fontWeight: 'bold' },
              ]}
            >
              {lang}
            </Text>
            {selected === lang && (
              <Ionicons name="checkmark-circle" size={22} color="#2e7d32" />
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 50 }} />
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
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguage: {
    backgroundColor: '#f3fff3',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
});
