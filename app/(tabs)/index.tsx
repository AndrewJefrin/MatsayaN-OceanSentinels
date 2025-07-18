import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [safetyStatus, setSafetyStatus] = useState('safe'); // 'safe', 'warning', 'danger'
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getStatusColor = () => {
    switch (safetyStatus) {
      case 'safe': return '#28A745';
      case 'warning': return '#FFC107';
      case 'danger': return '#DC3545';
      default: return '#28A745';
    }
  };

  const getStatusMessage = () => {
    switch (safetyStatus) {
      case 'safe': return '✅ மீன்பிடிக்க நல்ல நேரம்';
      case 'warning': return '⚠️ எச்சரிக்கை - கவனமாக செல்லுங்கள்';
      case 'danger': return '⚠️ மீன்பிடிக்க செல்வது பாதுகாப்பானது அல்ல';
      default: return '✅ மீன்பிடிக்க நல்ல நேரம்';
    }
  };

  const testVoiceAlert = () => {
    Alert.alert(
      'Voice Alert Test',
      'Playing Tamil voice alert: "கடலில் புயல் எச்சரிக்கை. உடனடியாக கரைக்கு திரும்புங்கள்."',
      [{ text: 'OK', onPress: () => console.log('Voice alert played') }]
    );
  };

  const handleSOS = () => {
    Alert.alert(
      'SOS Emergency',
      'Are you sure you want to send an SOS emergency signal?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement SOS functionality
            Alert.alert('SOS Sent', 'Emergency signal has been sent to authorities and nearby boats.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌊</Text>
          <Text style={styles.appName}>Uyir Kavalan</Text>
          <Text style={styles.appNameTamil}>உயிர் காவலன்</Text>
        </View>

        {/* Safety Status Box */}
        <View style={[styles.statusBox, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
        </View>

        {/* Date and Time */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTime}>
            {currentTime.toLocaleDateString('ta-IN')} - {currentTime.toLocaleTimeString('ta-IN')}
          </Text>
        </View>

        {/* Weather and Map Tiles */}
        <View style={styles.tilesContainer}>
          <TouchableOpacity
            style={[styles.tile, styles.weatherTile]}
            onPress={() => setWeatherExpanded(!weatherExpanded)}
          >
            <MaterialIcons name="cloud" size={32} color="#0066CC" />
            <Text style={styles.tileTitle}>வானிலை</Text>
            {weatherExpanded ? (
              <View style={styles.expandedWeather}>
                <Text style={styles.weatherDetail}>காற்று: 15 km/h</Text>
                <Text style={styles.weatherDetail}>அலை: 1.2m</Text>
                <Text style={styles.weatherDetail}>ஈரப்பதம்: 78%</Text>
                <Text style={styles.weatherDetail}>வெப்பம்: 28°C</Text>
                <Text style={styles.weatherDetail}>கணிப்பு: மிதமான காற்று</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.weatherSummary}>காற்று: 15 km/h</Text>
                <Text style={styles.weatherSummary}>அலை: 1.2m</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, styles.mapTile]}
            onPress={() => router.push('/(tabs)/map')}
          >
            <MaterialIcons name="map" size={32} color="#0066CC" />
            <Text style={styles.tileTitle}>வரைபடம்</Text>
            <View style={styles.mapInfo}>
              <Text style={styles.mapDetail}>கரைக்கு: 8.5 km</Text>
              <View style={styles.compassContainer}>
                <MaterialIcons name="navigation" size={20} color="#666" />
                <Text style={styles.compassText}>வடகிழக்கு</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* SOS Emergency Button */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <MaterialIcons name="emergency" size={32} color="#fff" />
          <Text style={styles.sosButtonText}>SOS EMERGENCY</Text>
        </TouchableOpacity>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <MaterialIcons name="chat" size={24} color="#0066CC" />
            <Text style={styles.actionButtonText}>குழு அரட்டை</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.voiceButton} onPress={testVoiceAlert}>
            <MaterialIcons name="volume-up" size={24} color="#fff" />
            <Text style={styles.voiceButtonText}>குரல் எச்சரிக்கை சோதனை</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    fontSize: 32,
    marginBottom: 5,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  appNameTamil: {
    fontSize: 18,
    color: '#666',
    marginTop: 2,
  },
  statusBox: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  dateTimeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateTime: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  tilesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weatherTile: {
    marginRight: 10,
  },
  mapTile: {
    marginLeft: 10,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  expandedWeather: {
    marginTop: 10,
  },
  weatherDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  weatherSummary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  mapInfo: {
    marginTop: 10,
  },
  mapDetail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  compassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compassText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#0066CC',
    marginLeft: 10,
    fontWeight: '600',
  },
  voiceButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    fontWeight: '600',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sosButtonText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 12,
    fontWeight: 'bold',
  },

});