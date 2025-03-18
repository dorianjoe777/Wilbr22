import React, { useState } from 'react';
import { X, Phone, Search } from 'lucide-react';
import { useChatStore } from '../lib/store';
import { cn } from '../lib/utils';
import type { Contact } from '../lib/types';

interface SelectContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SelectContactDialog({ isOpen, onClose }: SelectContactDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { contacts, setSelectedContact } = useChatStore();

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone_number.includes(searchQuery)
  );

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 bg-[#25D366] text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Select Contact</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1fab52] rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-8 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <Search className="w-4 h-4 absolute left-2 top-3 text-gray-500" />
          </div>
        </div>

        {/* Contacts List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No contacts found
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.name || contact.phone_number}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Phone className="w-5 h-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">
                        {contact.name || contact.phone_number}
                      </h3>
                      {contact.name && (
                        <p className="text-sm text-gray-500">
                          {contact.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}