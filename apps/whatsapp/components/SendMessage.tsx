// screens/ChatScreen.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useAtom } from 'jotai';
import {
  sendMessage,
  useMessages,
  updateMessageStatus,
} from '@/services/messageService';
import { messagesAtom } from '@/data/atom/messageAtom';
import { phoneAtom } from '@/data/atom/userAtom';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Message } from '@/types/Message';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchAndSubscribeToUserStatus,
  getGroupByChatId,
  getUserById,
  getUserByPhone,
} from '@/services/userService';
import { getChatIdData, getReceiverId } from '@/services/chatService';
import { userLastSeenAtom, userOnlineStatusAtom } from '@/data/atom/userState';

const backgroundImage = require('@/assets/images/whatsappbg.png');

const MessageStatus = ({
  status,
  time,
}: {
  status: Message['status'];
  time: Message['created_at'];
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'seen':
        return '✓✓';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    return status === 'seen' ? '#34B7F1' : '#8696A0';
  };

  return (
    <View className="flex-row">
      <Text className="text-xs pt-2 text-gray-500 ml-1">
        {new Date(time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      <Text style={{ color: getStatusColor() }} className="text-xs pt-2 ml-1">
        {getStatusIcon()}
      </Text>
    </View>
  );
};

const ChatContent = ({
  userPhone,
  contactPhone,
  chatId,
  userId,
  messages,
  is_group,
}: {
  userPhone: string;
  contactPhone: string;
  chatId: string;
  userId: string;
  messages: Message[];
  is_group?: any;
}) => {
  const [message, setMessage] = useState('');
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});

  const handleSendMessage = async () => {
    if (message.trim()) {
      await sendMessage(userPhone, chatId, message, 'text');
      setMessage('');
    }
  };

  useEffect(() => {
    const fetchUserNames = async () => {
      const chatIdData = await getChatIdData(chatId);
      const participantIds = chatIdData[0].participants;
      const userNamesMap: { [key: string]: string } = {};

      for (const participantId of participantIds) {
        const user = await getUserById(participantId);
        if (user) {
          if (!Array.isArray(user)) {
            userNamesMap[participantId] = user.name;
          }
        }
      }
      const groupData = await getGroupByChatId(chatId);
      if (groupData && groupData.admin) {
        const adminUser = await getUserById(groupData.admin);
        if (adminUser) {
          userNamesMap[groupData.admin] = adminUser.name;
        }
      }
      setUserNames(userNamesMap);
    };

    fetchUserNames();
  }, [chatId]);

  const [contactUserId, setContactUserId] = useState<string | null>(null);

  // useLayoutEffect(() => {
  //   const getChatIdDetails = async () => {
  //     const chatIdData = await getChatIdData(chatId);
  //     console.log('chatIdData', JSON.stringify(chatIdData));
  //     setIsGroup(chatIdData[0].is_group);
  //   };

  //   getChatIdDetails();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      const markMessagesAsSeen = async () => {
        const contactId = await getUserByPhone(contactPhone);
        setContactUserId(contactId?.id || null);
        console.log('chatId', JSON.stringify(chatId));
        console.log('contactId', JSON.stringify(contactId));
        const receiverId = await getReceiverId(chatId, userPhone);
        try {
          const unseenMessages = messages.filter(
            (msg) => msg.status === 'delivered' && contactId?.id === receiverId,
          );
          for (const msg of unseenMessages) {
            await updateMessageStatus(msg.id, 'seen');
          }
        } catch (error) {
          console.error('Error marking messages as seen:', error);
        }
      };

      markMessagesAsSeen();
    }, [messages]),
  );
  // TODO
  const [isOnline, setIsOnline] = useAtom(userOnlineStatusAtom);

  console.log('is_grouppoo', JSON.stringify(is_group));

  useEffect(() => {
    const fetchUserStatus = async () => {
      console.log('Calleddddd');
      const userData = await getUserByPhone(contactPhone);
      const data = await fetchAndSubscribeToUserStatus(
        userData?.id || '',
        setIsOnline,
      );
    };
    if (!is_group) fetchUserStatus();
  }, []);

  if (!userNames) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 p-5">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-white">{contactPhone}</Text>
          {isOnline ? (
            <Text className="text-sm text-green-500">Online</Text>
          ) : (
            <Text className="text-sm text-red-500 font-bold">Offline</Text>
          )}
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              className={`p-3 ${
                item.sender_id === userId.toString()
                  ? 'items-end'
                  : 'items-start'
              }`}
            >
              <View
                className={`flex-row p-2 rounded-lg ${
                  item.sender_id === userId.toString()
                    ? 'bg-green-200'
                    : 'bg-gray-200'
                }`}
              >
                {is_group && (
                  <>
                    <Text className="text-xs text-gray-500">
                      {userNames[item.sender_id] || 'Unknown'}
                    </Text>
                    <View
                      className={`flex-row p-2 rounded-lg ${
                        item.sender_id === userId
                          ? 'bg-green-200'
                          : 'bg-gray-200'
                      }`}
                    />
                  </>
                )}
                <Text className="text-sm">{item.content}</Text>
                {item.sender_id === userId.toString() && (
                  <MessageStatus status={item.status} time={item.created_at} />
                )}
              </View>
            </View>
          )}
        />

        <View className="flex-row items-center pt-2">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2 bg-white"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="bg-blue-500 px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const ChatScreen = () => {
  const [phone] = useAtom(phoneAtom);
  const route = useRoute();
  const { chatId, contactPhone, is_group } = route.params as {
    chatId: string;
    contactPhone: string;
    is_group: string;
  };

  const [messages] = useAtom(messagesAtom);
  const [userId, setUserId] = useState<string | null>(null);
  useMessages(chatId);

  useEffect(() => {
    const fetchUserStatus = async () => {
      const userData = await getUserByPhone(phone);
      if (userData?.id) setUserId(userData.id);
    };
    fetchUserStatus();
  }, [phone]);

  if (!userId) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const filteredMessages = messages.filter((msg) => msg !== null);

  return (
    <ChatContent
      userPhone={phone}
      contactPhone={contactPhone}
      chatId={chatId}
      userId={userId}
      messages={filteredMessages}
      is_group={is_group}
    />
  );
};

export default ChatScreen;
