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
    .update({ online })
    .eq('id', userId);

  if (error) {
    console.error('Error updating online status:', error);
    throw error;
  }

  return data;
};

export const subscribeToUserStatus = (
  userId: string,
  callback: (online: boolean, lastSeen: string | null) => void,
) => {
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
        const { online, last_seen } = payload.new as {
          online: boolean;
          last_seen: string | null;
        };
        callback(online, last_seen);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
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
