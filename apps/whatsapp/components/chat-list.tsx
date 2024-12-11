import { phoneAtom } from '@/data/atom/userAtom';
import { getGroupsByAdmin, getOrCreateChat } from '@/services/chatService';
import { getUserByPhone } from '@/services/userService';
import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type ChatsListProps = {
  name: string;
  message: string | null;
  phone: string;
  is_group?: boolean;
};

const icons = {
  user: require('@/assets/images/user.png'),
};

const ChatsList = ({ name, message, phone, is_group }: ChatsListProps) => {
  const selfPhone = useAtomValue(phoneAtom);
  const [chatId, setChatId] = useState<string>('');

  useEffect(() => {
    const fetchContacts = async () => {
      const contactId = await getUserByPhone(phone);
      const userId = await getUserByPhone(selfPhone);
      if (contactId?.id && userId?.id) {
        const chatId = await getOrCreateChat([contactId.id, userId.id]);
        setChatId(chatId);
      }
    };
    const fetchGroupChatId = async () => {
      const userId = await getUserByPhone(selfPhone);
      if (userId?.id) {
        const groupData = await getGroupsByAdmin(userId.id);
        const group = groupData.find((group) => group.name === name);
        if (group) {
          setChatId(group.chat_id);
        }
      }
    };
    if (is_group) {
      fetchGroupChatId();
    } else {
      fetchContacts();
    }
  }, []);

  console.log('is_grouppoo2', JSON.stringify(is_group));

  const handlePress = () => {
    router.push({
      pathname: '/send-message',
      params: {
        contactPhone: phone,
        chatId: chatId,
        is_group: is_group?.toString(),
      }, // Pass contactPhone as a parameter
    });
  };

  // const generateInitials = (name: string) => {
  //   const initials = name.split(' ').map((word) => word[0]).join('');
  //   return initials.toUpperCase();
  // };

  // const initials = generateInitials(name);

  return (
    <TouchableOpacity
      className="bg-transparent w-[90%] mb-1 rounded-md"
      onPress={handlePress}
    >
      <View className="flex-row w-full pl-2">
        <View className="self-center pr-6">
          <View className="w-12 h-12 rounded-full bg-green-900 justify-center items-center">
            {/* <Text className='text-white text-sm font-extrabold'>{initials}</Text> */}
          </View>
        </View>
        <View>
          <Text className="text-lg font-medium text-white">{name}</Text>
          <Text className="text-sm font-light text-gray-200">{message}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChatsList;
