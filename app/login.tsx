import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [boatNumber, setBoatNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState('tamil');

  const handleLogin = () => {
    if (!username || !password || !boatNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    router.replace('/(tabs)');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tamil' ? 'english' : 'tamil');
  };

  return (
    <LinearGradient
      colors={['#0066CC', '#004499']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'tamil' ? 'உயிர் காவலன்' : 'Uyir Kavalan'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'tamil' ? 'மீனவர் பாதுகாப்பு' : 'Fishermen Safety'}
          </Text>
        </View>

        <View style={styles.loginForm}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#0066CC" />
            <TextInput
              style={styles.input}
              placeholder={language === 'tamil' ? 'பயனர் பெயர்' : 'Username'}
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#0066CC" />
            <TextInput
              style={styles.input}
              placeholder={language === 'tamil' ? 'கடவுச்சொல்' : 'Password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="directions-boat" size={24} color="#0066CC" />
            <TextInput
              style={styles.input}
              placeholder={language === 'tamil' ? 'படகு எண்' : 'Boat Number'}
              value={boatNumber}
              onChangeText={setBoatNumber}
              placeholderTextColor="#666"
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <MaterialIcons
              name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color="#0066CC"
            />
            <Text style={styles.checkboxText}>
              {language === 'tamil' ? 'என்னை நினைவில் வைத்துக்கொள்' : 'Remember Me'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>
              {language === 'tamil' ? 'உள்நுழைய' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
            <MaterialIcons name="language" size={20} color="#0066CC" />
            <Text style={styles.languageButtonText}>
              {language === 'tamil' ? 'English' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#B3D9FF',
    fontWeight: '500',
  },
  loginForm: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  languageButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
});