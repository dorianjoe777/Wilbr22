import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { countries, type Country } from '../lib/countries';
import { cn } from '../lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PhoneInput({ value, onChange, className }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    
    // Update the phone number with the new country code
    const phoneWithoutCode = value.replace(/^\+\d+/, '');
    onChange(country.dialCode + phoneWithoutCode);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value.replace(/[^\d]/g, '');
    onChange(selectedCountry.dialCode + phoneNumber);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-3 py-2 border-y border-l border-gray-300 rounded-l-md hover:bg-gray-50"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Country Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-72 bg-white rounded-md shadow-lg border border-gray-200">
              {/* Search */}
              <div className="p-2 border-b">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div>
                      <span className="font-medium">{country.name}</span>
                      <span className="text-gray-500 ml-2">{country.dialCode}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input */}
        <input
          type="tel"
          value={value.replace(selectedCountry.dialCode, '')}
          onChange={handlePhoneChange}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          placeholder="Phone number"
        />
      </div>
    </div>
  );
}