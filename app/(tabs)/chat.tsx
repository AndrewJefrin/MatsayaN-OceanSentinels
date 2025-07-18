import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState('group');
  const [message, setMessage] = useState('');
  const [groupMessages, setGroupMessages] = useState([
    { id: 1, sender: 'கமல்', message: 'இன்று கடலில் நல்ல மீன்கள் கிடைக்கின்றன', time: '10:30 AM', isOwn: false },
    { id: 2, sender: 'நீங்கள்', message: 'எந்த பகுதியில் அதிக மீன்கள் உள்ளன?', time: '10:32 AM', isOwn: true },
    { id: 3, sender: 'ராஜா', message: 'கிழக்கு பகுதியில் நல்ல மீன்கள் கிடைக்கின்றன', time: '10:35 AM', isOwn: false },
    { id: 4, sender: 'முரளி', message: 'காற்று கொஞ்சம் அதிகமாக உள்ளது, கவனமாக இருங்கள்', time: '10:40 AM', isOwn: false },
  ]);

  const [boatMessages, setBoatMessages] = useState([
    { id: 1, sender: 'படகு TN01AB1234', message: 'எங்கள் இடத்தில் மீன்கள் அதிகம் உள்ளன', time: '9:15 AM', isOwn: false },
    { id: 2, sender: 'நீங்கள்', message: 'எந்த இடத்தில் உள்ளீர்கள்?', time: '9:18 AM', isOwn: true },
    { id: 3, sender: 'படகு TN01AB1234', message: 'சென்னை கடற்கரையில் இருந்து 15 கிமீ தூரத்தில்', time: '9:20 AM', isOwn: false },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: 'நீங்கள்',
        message: message,
        time: new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };

      if (activeTab === 'group') {
        setGroupMessages([...groupMessages, newMessage]);
      } else {
        setBoatMessages([...boatMessages, newMessage]);
      }
      setMessage('');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.isOwn && styles.ownMessage]}>
      <View style={[styles.messageBubble, item.isOwn && styles.ownMessageBubble]}>
        {!item.isOwn && <Text style={styles.senderName}>{item.sender}</Text>}
        <Text style={[styles.messageText, item.isOwn && styles.ownMessageText]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, item.isOwn && styles.ownMessageTime]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>அரட்டை</Text>
        <Text style={styles.headerSubtitle}>Chat</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'group' && styles.activeTab]}
          onPress={() => setActiveTab('group')}
        >
          <MaterialIcons name="group" size={20} color={activeTab === 'group' ? '#fff' : '#0066CC'} />
          <Text style={[styles.tabText, activeTab === 'group' && styles.activeTabText]}>
            குழு அரட்டை
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'boat' && styles.activeTab]}
          onPress={() => setActiveTab('boat')}
        >
          <MaterialIcons name="directions-boat" size={20} color={activeTab === 'boat' ? '#fff' : '#0066CC'} />
          <Text style={[styles.tabText, activeTab === 'boat' && styles.activeTabText]}>
            படகு தொடர்பு
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={activeTab === 'group' ? groupMessages : boatMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="செய்தி தட்டச்சு செய்யுங்கள்..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 8,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContainer: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 5,
    alignItems: 'flex-start',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#0066CC',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: '#B3D9FF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#0066CC',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});