import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../lib/store';
import { Save, Check, AlertCircle } from 'lucide-react';

interface Config {
  id: string;
  key: string;
  value: string | null;
  description: string;
}

export function Settings() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const { assistantEnabled, toggleAssistant } = useChatStore();

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .order('key');

      if (error) throw error;
      
      // Filter out webhook URL configuration if it exists
      const filteredData = data?.filter(config => config.key !== 'WEBHOOK_URL') || [];
      setConfigs(filteredData);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateConfig(id: string, value: string) {
    setSavingStates(prev => ({ ...prev, [id]: true }));
    setSaveSuccess(prev => ({ ...prev, [id]: false }));
    
    try {
      const { error } = await supabase
        .from('configurations')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setConfigs(prev => 
        prev.map(config => 
          config.id === id ? { ...config, value } : config
        )
      );
      
      setSaveSuccess(prev => ({ ...prev, [id]: true }));
      
      setTimeout(() => {
        setSaveSuccess(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
        
        {/* Assistant Toggle */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-gray-600">Enable or disable the AI assistant</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={assistantEnabled}
                onChange={toggleAssistant}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-whatsapp/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-whatsapp"></div>
            </label>
          </div>
        </div>

        {/* Webhook Information */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold">Webhook Configuration</h2>
              <p className="text-gray-600 mt-1">
                Your webhook endpoint for the Azure Function is:
              </p>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-sm">
                {window.location.origin}/.netlify/functions/webhook
              </code>
              <p className="text-gray-600 mt-2">
                Configure your Azure Function to forward WhatsApp webhooks to this URL. Make sure to:
              </p>
              <ul className="list-disc list-inside mt-1 text-gray-600">
                <li>Set the WEBHOOK_SECRET environment variable in Netlify</li>
                <li>Set the VERIFY_TOKEN environment variable in Netlify</li>
                <li>Use the same tokens in your Azure Function configuration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* WhatsApp API Configuration Fields */}
        <div className="space-y-4">
          {configs.map((config) => {
            const isSaving = savingStates[config.id] || false;
            const isSuccess = saveSuccess[config.id] || false;
            
            return (
              <div
                key={config.id}
                className="p-4 bg-white rounded-lg shadow"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.key}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.value || ''}
                    onChange={(e) => {
                      setConfigs(prev => 
                        prev.map(c => 
                          c.id === config.id ? { ...c, value: e.target.value } : c
                        )
                      );
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp"
                    placeholder={config.description}
                  />
                  <button
                    onClick={() => updateConfig(config.id, config.value || '')}
                    disabled={isSaving}
                    className="p-2 text-white bg-whatsapp rounded-md hover:bg-whatsapp-hover disabled:opacity-50 min-w-10"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isSuccess ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">{config.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}