export interface Message {
  id: string;
  chat_id: string;
  created_at: string;
  content: string;
  type: 'text' | 'image';
  sender_id: string;
  status: 'sent' | 'delivered' | 'seen';
}