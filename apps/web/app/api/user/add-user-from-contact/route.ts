// TODO

import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const POST  = async(req: NextRequest) => {
  if (req.method === 'POST') {
    try {
      const { receiver_id, sender_id } = await req.json();
      if (!receiver_id || !sender_id) {
        return NextResponse.json({ error: 'reciever_id and sender_id are required' });
      }

      // Check if a chat already exists between the participants
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .contains('participants', [receiver_id, sender_id])
        .single();

      if (chatError && chatError.code !== 'PGRST116') { // PGRST116 is the code for no rows found
        console.error('Error fetching chat:', chatError);
        return NextResponse.json({ error: 'Internal Server Error' });
      }

      let chatId;
      if (chatData) {
        // Chat already exists
        chatId = chatData.id;
      } else {
        // Create a new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert([{ participants: [receiver_id, sender_id], is_group: false }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating chat:', createError);
          return NextResponse.json({ error: 'Internal Server Error' });
        }

        chatId = newChat.id;
      }

      return NextResponse.json({ success: true, chatId });
    } catch (error) {
      console.error('Server error:', error);
      return NextResponse.json({ error: 'Internal Server Error' });
    }
  }
}