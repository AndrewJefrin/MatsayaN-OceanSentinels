import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [language, setLanguage] = useState('tamil');
  const [alertVolume, setAlertVolume] = useState(0.8);
  const [ttgoConnected, setTtgoConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRelation, setContactRelation] = useState('');

  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'கமல்', phone: '+91 9876543210', email: 'kamal@example.com', relation: 'நண்பர்' },
    { id: 2, name: 'ராஜா', phone: '+91 9876543211', email: 'raja@example.com', relation: 'குடும்பம்' },
    { id: 3, name: 'கடலோர காவல்படை', phone: '100', email: '', relation: 'அவசர சேவை' },
  ]);

  const testVoiceAlert = () => {
    Alert.alert(
      'Voice Alert Test',
      'Playing Tamil voice alert: "கடலில் புயல் எச்சரிக்கை. உடனடியாக கரைக்கு திரும்புங்கள்."',
      [{ text: 'OK', onPress: () => console.log('Voice alert played') }]
    );
  };

  const syncTTGO = () => {
    Alert.alert(
      'TTGO Sync',
      'Attempting to sync with TTGO hardware...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => setTtgoConnected(!ttgoConnected) }
      ]
    );
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tamil' ? 'english' : 'tamil');
  };

  const openContactModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setContactName(contact.name);
      setContactPhone(contact.phone);
      setContactEmail(contact.email || '');
      setContactRelation(contact.relation);
    } else {
      setEditingContact(null);
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactRelation('');
    }
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setEditingContact(null);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactRelation('');
  };

  const saveContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    if (editingContact) {
      // Edit existing contact
      setEmergencyContacts(prev =>
        prev.map(contact =>
          contact.id === editingContact.id
            ? { ...contact, name: contactName, phone: contactPhone, email: contactEmail, relation: contactRelation }
            : contact
        )
      );
    } else {
      // Add new contact
      const newContact = {
        id: Date.now(),
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        relation: contactRelation
      };
      setEmergencyContacts(prev => [...prev, newContact]);
    }
    closeContactModal();
  };

  const deleteContact = (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEmergencyContacts(prev => prev.filter(contact => contact.id !== contactId));
          }
        }
      ]
    );
  };

  const editContact = (contact) => {
    openContactModal(contact);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>அமைப்புகள்</Text>
        <Text style={styles.headerSubtitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>மொழி அமைப்புகள்</Text>
          <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
            <MaterialIcons name="language" size={24} color="#0066CC" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>மொழி மாற்றம்</Text>
              <Text style={styles.settingValue}>
                {language === 'tamil' ? 'தமிழ்' : 'English'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Boat Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>படகு விவரங்கள்</Text>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="directions-boat" size={24} color="#0066CC" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>படகு விவரங்களை நிர்வகிக்க</Text>
              <Text style={styles.settingValue}>TN01AB1234</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>அவசர தொடர்புகள்</Text>
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <MaterialIcons name="phone" size={20} color="#0066CC" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                {contact.email ? <Text style={styles.contactEmail}>{contact.email}</Text> : null}
                <Text style={styles.contactRelation}>{contact.relation}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => editContact(contact)}
                >
                  <MaterialIcons name="edit" size={18} color="#0066CC" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteContact(contact.id)}
                >
                  <MaterialIcons name="delete" size={18} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addContactButton}
            onPress={() => openContactModal()}
          >
            <MaterialIcons name="add" size={20} color="#0066CC" />
            <Text style={styles.addContactText}>புதிய தொடர்பு சேர்க்க</Text>
          </TouchableOpacity>
        </View>

        {/* Hardware Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>வன்பொருள் ஒத்திசைவு</Text>
          <TouchableOpacity style={styles.settingItem} onPress={syncTTGO}>
            <MaterialIcons name="router" size={24} color="#0066CC" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>TTGO வன்பொருள் ஒத்திசைவு</Text>
              <Text style={[styles.settingValue, { color: ttgoConnected ? '#28A745' : '#DC3545' }]}>
                {ttgoConnected ? 'இணைக்கப்பட்டது' : 'இணைக்கப்படவில்லை'}
              </Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: ttgoConnected ? '#28A745' : '#DC3545' }]} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <MaterialIcons name="sync" size={24} color="#0066CC" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>தானியங்கி ஒத்திசைவு</Text>
              <Text style={styles.settingValue}>
                {autoSync ? 'இயக்கப்பட்டது' : 'முடக்கப்பட்டது'}
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#767577', true: '#0066CC' }}
              thumbColor={autoSync ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Alert Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>எச்சரிக்கை அமைப்புகள்</Text>
          <View style={styles.settingItem}>
            <MaterialIcons name="volume-up" size={24} color="#0066CC" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>எச்சரிக்கை ஒலி அளவு</Text>
              <Text style={styles.settingValue}>{Math.round(alertVolume * 100)}%</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.testButton} onPress={testVoiceAlert}>
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
            <Text style={styles.testButtonText}>குரல் எச்சரிக்கை சோதனை</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>பற்றி</Text>
          <View style={styles.settingItem}>
            <MaterialIcons name="info" size={24} color="#0066CC" />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>பயன்பாட்டு பதிப்பு</Text>
              <Text style={styles.settingValue}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Contact Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeContactModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? 'தொடர்பைத் திருத்து' : 'புதிய தொடர்பு சேர்க்க'}
              </Text>
              <TouchableOpacity onPress={closeContactModal}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>பெயர் *</Text>
              <TextInput
                style={styles.textInput}
                value={contactName}
                onChangeText={setContactName}
                placeholder="தொடர்பு பெயர்"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>தொலைபேசி எண் *</Text>
              <TextInput
                style={styles.textInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+91 9876543210"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>மின்னஞ்சல்</Text>
              <TextInput
                style={styles.textInput}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="contact@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>உறவு</Text>
              <TextInput
                style={styles.textInput}
                value={contactRelation}
                onChangeText={setContactRelation}
                placeholder="நண்பர், குடும்பம், முதலியன"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeContactModal}>
                <Text style={styles.cancelButtonText}>ரத்து</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveContact}>
                <Text style={styles.saveButtonText}>சேமி</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginLeft: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#0066CC',
    marginTop: 2,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    marginLeft: 15,
  },
  actionButton: {
    padding: 5,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  addContactText: {
    fontSize: 16,
    color: '#0066CC',
    marginLeft: 8,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    marginHorizontal: 20,
    marginTop: 15,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});