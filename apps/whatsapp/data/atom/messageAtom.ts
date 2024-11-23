import { atom } from 'jotai';
import { Message } from '@/types/Message';

export const messagesAtom = atom<Message[]>([]);
export const latestMessageAtom = atom<Message | null>(null);