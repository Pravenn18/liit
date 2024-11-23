// userState.ts
import { atom } from 'jotai';

export const userOnlineStatusAtom = atom<boolean>(true);
export const userLastSeenAtom = atom<Date | null>(null);
