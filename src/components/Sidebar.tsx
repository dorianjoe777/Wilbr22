import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Settings as SettingsIcon, Search, Phone } from 'lucide-react';
import { useChatStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { Contact } from '../lib/types';
import { NewContactDialog } from './NewContactDialog';
import { SelectContactDialog } from './SelectContactDialog';
import { SpeedDial } from './SpeedDial';

export function Sidebar() {
  const location = useLocation();
  const { contacts, setContacts, selectedContact, setSelectedContact, searchQuery, setSearchQuery } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = useState(false);
  const [isSelectContactDialogOpen, setIsSelectContactDialogOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleNewChat = () => {
    setIsSelectContactDialogOpen(true);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone_number.includes(searchQuery)
  );

  if (location.pathname === '/settings') {
    return (
      <div className="w-16 bg-whatsapp text-white flex flex-col items-center py-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `p-3 rounded-lg mb-2 ${
              isActive ? 'bg-whatsapp-hover' : 'hover:bg-whatsapp-hover'
            }`
          }
        >
          <MessageSquare className="w-6 h-6" />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `p-3 rounded-lg ${
              isActive ? 'bg-whatsapp-hover' : 'hover:bg-whatsapp-hover'
            }`
          }
        >
          <SettingsIcon className="w-6 h-6" />
        </NavLink>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="bg-whatsapp text-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Chats</h1>
            <div className="flex gap-2">
              <NavLink
                to="/settings"
                className="p-2 rounded-full hover:bg-whatsapp-hover"
              >
                <SettingsIcon className="w-5 h-5" />
              </NavLink>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-8 rounded-lg bg-whatsapp-hover text-white placeholder-gray-300 focus:outline-none"
            />
            <Search className="w-4 h-4 absolute left-2 top-3 text-gray-300" />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp" />
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    'p-3 hover:bg-gray-100 cursor-pointer',
                    selectedContact?.id === contact.id && 'bg-gray-100'
                  )}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-whatsapp text-white flex items-center justify-center">
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.name || contact.phone_number}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Phone className="w-6 h-6" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {contact.name || contact.phone_number}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        {contact.phone_number}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Speed Dial */}
        <SpeedDial
          onNewChat={handleNewChat}
          onNewContact={() => setIsNewContactDialogOpen(true)}
          position={selectedContact ? 'left' : 'right'}
        />
      </div>

      <NewContactDialog
        isOpen={isNewContactDialogOpen}
        onClose={() => setIsNewContactDialogOpen(false)}
      />

      <SelectContactDialog
        isOpen={isSelectContactDialogOpen}
        onClose={() => setIsSelectContactDialogOpen(false)}
      />
    </>
  );
}