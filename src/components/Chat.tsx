import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, PaperclipIcon } from 'lucide-react';
import { useChatStore } from '../lib/store';
import { cn } from '../lib/utils';

export function Chat() {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, assistantEnabled, selectedContact } = useChatStore();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedContact) return;

    // Add user message
    await addMessage({
      contact_id: selectedContact.id,
      message: message.trim(),
      direction: 'outgoing',
      status: 'sent',
    });

    setMessage('');

    if (assistantEnabled) {
      // Simulate assistant response (will be replaced with actual GPT integration)
      timeoutRef.current = setTimeout(async () => {
        await addMessage({
          contact_id: selectedContact.id,
          message: 'This is a simulated response. GPT integration coming soon!',
          direction: 'incoming',
          status: 'delivered',
        });
      }, 1000);
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Welcome to WhatsApp Business</h2>
          <p className="text-gray-500 mt-2">Select a contact to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Chat header */}
      <div className="bg-whatsapp text-white p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3">
          {selectedContact.avatar_url && (
            <img
              src={selectedContact.avatar_url}
              alt={selectedContact.name || selectedContact.phone_number}
              className="w-full h-full rounded-full object-cover"
            />
          )}
        </div>
        <div>
          <h2 className="font-semibold">{selectedContact.name || selectedContact.phone_number}</h2>
          <p className="text-sm opacity-75">
            {assistantEnabled ? 'Assistant is active' : 'Assistant is disabled'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[80%] rounded-lg p-3',
              msg.direction === 'outgoing'
                ? 'ml-auto bg-[#DCF8C6]'
                : 'bg-white'
            )}
          >
            <p>{msg.message}</p>
            <span className="text-xs text-gray-500 mt-1 block">
              {new Date(msg.created_at).toLocaleTimeString()}
              {msg.direction === 'outgoing' && (
                <span className="ml-2">
                  {msg.status === 'sent' && '✓'}
                  {msg.status === 'delivered' && '✓✓'}
                  {msg.status === 'read' && '✓✓'}
                </span>
              )}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 p-2 rounded-full border border-gray-300 focus:outline-none focus:border-whatsapp"
          />
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Mic className="w-6 h-6" />
          </button>
          <button
            type="submit"
            className="p-2 text-white bg-whatsapp rounded-full hover:bg-whatsapp-hover"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}