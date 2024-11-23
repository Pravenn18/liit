import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAtom, useSetAtom } from 'jotai';
import { phoneAtom } from '@/data/atom/userAtom';
import { latestMessageAtom } from '@/data/atom/messageAtom';
import { addContactToDb } from '@/services/apiService';
import useManageContacts from '@/behaviours';
import ChatsList from '@/components/chat-list';
import ChatsTopBar from '@/components/chats-top-bar';
import contactsAtom from '@/data';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserByPhone } from '@/services/userService';
import { userLastSeenAtom, userOnlineStatusAtom } from '@/data/atom/userState';
import { router } from 'expo-router';
import { ActivityProvider } from '@/components/ActivityTracker';

const HomeScreen = () => {
  const [contacts] = useAtom(contactsAtom);
  const { fetchContacts, fetchContact } = useManageContacts();
  const [contactList, setContactList] = useState<
    { id: string | undefined; name: string; phone: string }[]
  >([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [phone] = useAtom(phoneAtom);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(contactList);
  const [latestMessage] = useAtom(latestMessageAtom);
  const setContacts = useSetAtom(contactsAtom);
  const [noUserFoundModalVisible, setNoUserFoundModalVisible] = useState(false);
  const [userId, setUserId] = useState('');

  const handleOpenContacts = async () => {
    const fetchedContacts = await fetchContacts();
    setContactList(fetchedContacts);
    setFilteredContacts(fetchedContacts);
    setModalVisible(true);
  };

  useEffect(() => {
    const getUserId = async () => {
      const user = await getUserByPhone(phone);
      if (user) {
        fetchContact && fetchContact(user.id);
      }
    };
    getUserId();
  }, [phone]);

  useEffect(() => {
    setFilteredContacts(
      contactList.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery),
      ),
    );
  }, [searchQuery, contactList]);

  const formatPhoneNumber = (phoneNumber: string): string => {
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    return cleanedNumber.slice(-10);
  };

  const handleAddContact = async (contact: {
    id: string | undefined;
    name: string;
    phone: string;
  }) => {
    const formattedPhone = formatPhoneNumber(contact.phone);
    const user = await getUserByPhone(phone);
    const addedContact = await getUserByPhone(formattedPhone);
    const contactData = await addContactToDb(
      addedContact?.id ?? '',
      user?.id ?? '',
    );

    if (!addedContact) {
      setModalVisible(false);
      setNoUserFoundModalVisible(true);
      return;
    }

    setContacts((prevContacts) => {
      const contactExists = prevContacts.some(
        (c) => c.phone === formattedPhone,
      );
      if (!contactExists) {
        return [
          ...prevContacts,
          { id: contact.id, name: contact.name, phone: formattedPhone },
        ];
      }
      return prevContacts;
    });
    setModalVisible(false);
  };

  useEffect(() => {
    const setUserIDFunc = async () => {
      const user = await getUserByPhone(phone);
      if (user) {
        setUserId(user.id);
      }
    };
    setUserIDFunc();
  }, []);

  return (
    <ActivityProvider userId={userId}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111b21' }}>
        <ChatsTopBar />
        <FlatList
          className="w-full pt-2"
          data={contacts}
          ItemSeparatorComponent={() => (
            <View className="bg-[#333] h-[1px] my-1 left-16" />
          )}
          renderItem={({ item }) => (
            <ChatsList
              name={item.name}
              phone={item.phone}
              message={latestMessage ? latestMessage.content : ''}
            />
          )}
        />
        <Modal
          visible={noUserFoundModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setNoUserFoundModalVisible(false)}
        >
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <View
              style={{
                width: 300,
                padding: 20,
                backgroundColor: 'white',
                borderRadius: 10,
              }}
            >
              <Text>No user found with this phone number.</Text>
              <Button
                title="Close"
                onPress={() => setNoUserFoundModalVisible(false)}
              />
            </View>
          </View>
        </Modal>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenContacts}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <Modal visible={isModalVisible} animationType="slide">
          <View style={{ flex: 1, backgroundColor: '#333', padding: 20 }}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Contacts"
              placeholderTextColor="#888"
              style={{
                backgroundColor: '#444',
                color: '#fff',
                padding: 10,
                borderRadius: 5,
                marginBottom: 20,
              }}
            />
            <FlatList
              style={{ width: '100%' }}
              data={filteredContacts}
              keyExtractor={(item) => item.id || item.phone}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleAddContact(item)}>
                  <Text
                    style={{
                      backgroundColor: '#555',
                      color: '#fff',
                      padding: 10,
                      marginBottom: 10,
                      borderRadius: 5,
                    }}
                  >
                    {item.name} - {item.phone}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </Modal>
      </SafeAreaView>
    </ActivityProvider>
  );
};

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#25D366',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 30,
  },
});

export default HomeScreen;
