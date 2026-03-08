/**
 * Emergency Contacts Service
 * Manages emergency contacts for auto-SMS alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

const CONTACTS_KEY = '@civic_shield_emergency_contacts';

/**
 * Save emergency contacts
 */
export async function saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    console.log('✅ Emergency contacts saved:', contacts.length);
  } catch (error) {
    console.error('❌ Failed to save contacts:', error);
    throw error;
  }
}

/**
 * Load emergency contacts
 */
export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    const data = await AsyncStorage.getItem(CONTACTS_KEY);
    if (!data) {
      return [];
    }
    const contacts = JSON.parse(data);
    console.log('📱 Loaded emergency contacts:', contacts.length);
    return contacts;
  } catch (error) {
    console.error('❌ Failed to load contacts:', error);
    return [];
  }
}

/**
 * Add a new emergency contact
 */
export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<void> {
  const contacts = await getEmergencyContacts();
  const newContact: EmergencyContact = {
    ...contact,
    id: Date.now().toString(),
  };
  contacts.push(newContact);
  await saveEmergencyContacts(contacts);
}

/**
 * Remove an emergency contact
 */
export async function removeEmergencyContact(id: string): Promise<void> {
  const contacts = await getEmergencyContacts();
  const filtered = contacts.filter(c => c.id !== id);
  await saveEmergencyContacts(filtered);
}

/**
 * Update an emergency contact
 */
export async function updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<void> {
  const contacts = await getEmergencyContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], ...updates };
    await saveEmergencyContacts(contacts);
  }
}
