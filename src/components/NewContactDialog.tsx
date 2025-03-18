import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../lib/store';
import { PhoneInput } from './PhoneInput';

interface NewContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewContactDialog({ isOpen, onClose }: NewContactDialogProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+51');
  const [loading, setLoading] = useState(false);
  const { setContacts } = useChatStore();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          {
            phone_number: phoneNumber.trim(),
            name: name.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh contacts list
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      setContacts(contacts || []);
      onClose();
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 bg-whatsapp text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">New Contact</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-whatsapp-hover rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp"
                placeholder="Enter name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-whatsapp text-white rounded-md hover:bg-whatsapp-hover disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}