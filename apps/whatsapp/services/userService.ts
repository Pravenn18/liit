import { supabase } from '../utils/supabase';
import { User } from '@/types/User';

export const updateUserLastSeen = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating last seen:', error);
    throw error;
  }
  return data;
};

export const updateUserOnlineStatus = async (
  userId: string,
  online: boolean,
) => {
  const { data, error } = await supabase
    .from('users')
    .update({ online: online })
    .eq('id', userId);

  if (error) {
    console.error('Error updating online status:', error);
    throw error;
  }
  return data;
};
export const fetchAndSubscribeToUserStatus = async (
  userId: string,
  callback: (online: boolean) => void,
) => {
  const { data, error } = await supabase
    .from('users')
    .select('online')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user status:', error);
    throw error;
  }

  const subscription = supabase
    .channel(`public:users:id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const { online } = payload.new as {
          online: boolean;
        };
        callback(online);
        console.log(`User ${userId} online status changed to:`, online);
      },
    )
    .subscribe();

  return {
    initialStatus: data.online,
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
};
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) {
    console.warn('Error fetching user by phone:', error);
    return null;
  }

  return data;
};
