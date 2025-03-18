import { create } from 'zustand';
import { supabase } from './supabase';
import type { Contact, Chat } from './types';

interface ChatStore {
  messages: Chat[];
  contacts: Contact[];
  selectedContact: Contact | null;
  searchQuery: string;
  assistantEnabled: boolean;
  addMessage: (message: Omit<Chat, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  setContacts: (contacts: Contact[]) => void;
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  toggleAssistant: () => void;
  fetchMessages: (contactId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  contacts: [],
  selectedContact: null,
  searchQuery: '',
  assistantEnabled: true,

  addMessage: async (message) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        messages: [...state.messages, data],
      }));
    } catch (error) {
      console.error('Error adding message:', error);
    }
  },

  fetchMessages: async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ messages: data });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },

  setContacts: (contacts) => set({ contacts }),
  setSelectedContact: (contact) => {
    set({ selectedContact: contact });
    if (contact) {
      get().fetchMessages(contact.id);
    }
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleAssistant: () => set((state) => ({ assistantEnabled: !state.assistantEnabled })),
}));