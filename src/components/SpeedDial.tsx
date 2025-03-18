import React, { useState } from 'react';
import { Plus, MessageSquare, UserPlus, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SpeedDialProps {
  onNewChat: () => void;
  onNewContact: () => void;
  position?: 'left' | 'right';
}

export function SpeedDial({ onNewChat, onNewContact, position = 'right' }: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const positionClasses = position === 'left' 
    ? 'left-6' 
    : 'right-6';

  const optionsPosition = position === 'left'
    ? 'items-start'
    : 'items-end';

  return (
    <div className={`absolute bottom-6 ${positionClasses} flex flex-col ${optionsPosition}`}>
      {/* Speed Dial Options */}
      <div
        className={cn(
          'flex flex-col space-y-2 mb-2 transition-all duration-200',
          optionsPosition,
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* New Contact Button */}
        <button
          onClick={() => handleAction(onNewContact)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-whatsapp text-white shadow-lg hover:bg-whatsapp-hover transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Contact</span>
        </button>

        {/* New Chat Button */}
        <button
          onClick={() => handleAction(onNewChat)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-whatsapp text-white shadow-lg hover:bg-whatsapp-hover transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-whatsapp text-white rounded-full shadow-lg flex items-center justify-center hover:bg-whatsapp-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp z-10 transition-transform duration-200"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200" />
        ) : (
          <Plus className="w-6 h-6 transition-transform duration-200" />
        )}
      </button>
    </div>
  );
}