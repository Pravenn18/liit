import { atom } from "jotai";

export interface Contact {
  name: string;
  phone: string;
}

export const contactsAtom = atom<Contact[]>([]);
