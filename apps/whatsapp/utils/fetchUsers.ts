import { Contact } from '@/data/atom/contactAtom';
import { supabase } from '@/utils/supabase';

export const fetchUsers = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('participants')
      .contains('participants', [userId]);

    if (error) {
      console.error('Error fetching users:', error.message);
      return [];
    }

    const uniqueContacts = new Map<string, Contact>();

    for (const chat of data) {
      for (const participantId of chat.participants) {
        if (participantId !== userId && !uniqueContacts.has(participantId)) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, phone')
            .eq('id', participantId)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError.message);
            continue;
          }

          uniqueContacts.set(participantId, {
            name: userData.name,
            phone: userData.phone,
          });
        }
      }
    }

    return Array.from(uniqueContacts.values());
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
};
