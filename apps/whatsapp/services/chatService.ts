import { supabase } from '../utils/supabase';
import { Chat } from '@/types/Chat';
import { getUserByPhone } from './userService';

export const getOrCreateChat = async (
  participants: string[],
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
      .insert([{ participants, is_group: false }])
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
