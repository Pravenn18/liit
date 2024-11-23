import * as Contacts from 'expo-contacts';
import { useAtom } from "jotai";
import contactsAtom from "../../data";
import { fetchUsers } from '@/utils/fetchUsers';

export const useManageContacts = () => {
  const [contacts, setContacts] = useAtom(contactsAtom);

  const fetchContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        return data.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phoneNumbers?.[0]?.number || "",
        }));
      }
    }
    return [];
  };

  const fetchContact = async (senderId: string) => {
    const users = await fetchUsers(senderId);
    setContacts(users);
  };

  return { contacts, fetchContacts, fetchContact };
};
