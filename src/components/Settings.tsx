import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../lib/store';
import { Save, Check, AlertCircle, Copy } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.protocol}//${window.location.host}/.netlify/functions/webhook`;

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp" />
      </div>
    );
  }

  // Group configurations by type
  const tokenConfigs = configs.filter(config => 
    ['VERIFY_TOKEN', 'ACCESS_TOKEN'].includes(config.key)
  );
  const otherConfigs = configs.filter(config => 
    !['VERIFY_TOKEN', 'ACCESS_TOKEN'].includes(config.key)
  );

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
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Webhook Configuration</h2>
              <p className="text-gray-600 mt-1">
                Your webhook endpoint for WhatsApp Business API is:
              </p>
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded mt-2">
                <code className="text-sm flex-1 break-all">
                  {webhookUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-200"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Token Configurations */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Authentication Tokens</h2>
          <div className="space-y-4">
            {tokenConfigs.map((config) => {
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

        {/* Other Configurations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Other Settings</h2>
          {otherConfigs.map((config) => {
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