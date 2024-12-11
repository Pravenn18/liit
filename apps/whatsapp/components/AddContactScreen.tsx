// AddContactScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  FlatList,
  TextInput,
  Button,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useAtom } from 'jotai';
import { contactsAtom } from '@/data/atom/contactAtom';
import { phoneAtom } from '@/data/atom/userAtom';
import { formatPhoneNumber } from '@/utils/utils';
import { createGroupChat } from '@/services/chatService';
import { router } from 'expo-router';

const AddContactScreen = ({ navigation }) => {
  const [contacts] = useAtom(contactsAtom);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [phone] = useAtom(phoneAtom);

  const toggleContactSelection = (contact) => {
    const formattedContact = {
      ...contact,
      phone: formatPhoneNumber(contact.phone),
    };
    setSelectedContacts((prevSelectedContacts) =>
      prevSelectedContacts.includes(formattedContact.phone)
        ? prevSelectedContacts.filter(
            (phone) => phone !== formattedContact.phone,
          )
        : [...prevSelectedContacts, formattedContact.phone],
    );
  };

  const handleCreateGroup = async () => {
    if (groupName.trim() && selectedContacts.length > 0) {
      await createGroupChat(groupName, selectedContacts, phone);
      router.back();
    } else {
      alert('Please enter a group name and select at least one contact.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111b21' }}>
      <TextInput
        style={{
          padding: 10,
          backgroundColor: 'white',
          margin: 10,
          borderRadius: 5,
        }}
        placeholder="Enter Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.phone}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 10,
              backgroundColor: selectedContacts.includes(item)
                ? 'lightblue'
                : 'white',
              margin: 10,
              borderRadius: 5,
            }}
            onPress={() => toggleContactSelection(item)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Create Group" onPress={handleCreateGroup} />
    </SafeAreaView>
  );
};

export default AddContactScreen;
