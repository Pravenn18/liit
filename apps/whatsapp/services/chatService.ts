import { supabase } from '../utils/supabase';
import { Chat } from '@/types/Chat';
import { getUserByPhone } from './userService';
import { User } from '@/types/User';

export const getOrCreateChat = async (
  participants: string[],
  group: boolean = false,
): Promise<string> => {
  // Check if a chat already exists between the participants
  const { data, error } = await supabase
    .from('chats')
    .select('id')
    .contains('participants', participants)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is the code for no rows found
    console.error('Error fetching chat:', error);
    throw error;
  }

  if (data) {
    // Chat already exists
    return data.id;
  } else {
    // Create a new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert([{ participants, is_group: group }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating chat:', createError);
      throw createError;
    }

    return newChat.id;
  }
};

export const getReceiverId = async (
  chatId: string,
  currentPhone: string,
): Promise<string | null> => {
  const currentUserId = await getUserByPhone(currentPhone);
  const { data, error } = await supabase
    .from('chats')
    .select('participants')
    .eq('id', chatId)
    .single();

  if (error) {
    console.error('Error fetching chat participants:', error);
    throw error;
  }

  if (data && data.participants) {
    const receiverId = data.participants.find(
      (participant: string) => participant !== (currentUserId || ''),
    );
    return receiverId || null;
  }

  return null;
};

export const createGroupChat = async (
  groupName: string,
  contacts: string[],
  admin: string,
) => {
  const adminId = await getUserByPhone(admin);
  const contactIds = await Promise.all(
    contacts.map(async (contact) => {
      const contactData = await getUserByPhone(contact);
      return contactData ? contactData.id : null;
    }),
  );
  const validContactIds = contactIds.filter((id) => id !== null) as string[];
  const createGroupChatData = await getOrCreateChat(validContactIds, true);
  const { data, error } = await supabase
    .from('groups')
    .insert([
      { name: groupName, chat_id: createGroupChatData, admin: adminId?.id },
    ]);

  if (error) {
    console.error('Error creating group chat:', error);
    throw error;
  }
  return data;
};

export const getGroupsByAdmin = async (adminId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('admin', adminId);

  if (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }

  return data;
};

export const getChatIdData = async (chatId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId);

  if (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }

  return data;
};

export const getGroupsByUserId = async (userId: string) => {
  // Fetch groups where the user is an admin
  const { data: adminGroups, error: adminError } = await supabase
    .from('groups')
    .select('*')
    .eq('admin', userId);

  if (adminError) {
    console.error('Error fetching groups where user is admin:', adminError);
    throw adminError;
  }

  // Fetch chat IDs where the user is a participant
  const { data: participantChats, error: participantChatsError } =
    await supabase
      .from('chats')
      .select('id')
      .contains('participants', [userId]);

  if (participantChatsError) {
    console.error(
      'Error fetching chats where user is participant:',
      participantChatsError,
    );
    throw participantChatsError;
  }

  const chatIds = participantChats.map((chat) => chat.id);

  // Fetch groups where the chat ID is in the list of chat IDs
  const { data: participantGroups, error: participantGroupsError } =
    await supabase.from('groups').select('*').in('chat_id', chatIds);

  if (participantGroupsError) {
    console.error(
      'Error fetching groups where user is participant:',
      participantGroupsError,
    );
    throw participantGroupsError;
  }

  // Combine and return unique groups
  const allGroups = [...adminGroups, ...participantGroups];
  const uniqueGroups = Array.from(
    new Set(allGroups.map((group) => group.id)),
  ).map((id) => allGroups.find((group) => group.id === id));

  return uniqueGroups;
};
