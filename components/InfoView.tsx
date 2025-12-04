import React, { useState } from 'react';
import { UserCircle, MapPin, Calendar, Check, Camera, Globe, ArrowLeft, Search, X } from 'lucide-react';
import { Language } from '../types';
import AvatarSelector from './AvatarSelector';
import { DEFAULT_AVATARS, COUNTRIES } from '../constants';

interface InfoViewProps {
  onComplete: (data: { name: string; country: string; age: string; gender: 'male' | 'female', avatar: string }) => void;
  language: Language;
}

const InfoView: React.FC<InfoViewProps> = ({ onComplete, language }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATARS[0]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // Country Selector
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      title: { ar: 'أكمل بياناتك', en: 'Complete Profile' },
      subtitle: { ar: 'أكمل بياناتك للدخول إلى عالم فليكس', en: 'Fill in your details to enter the Flex world' },
      name: { ar: 'الاسم', en: 'Name' },
      namePlaceholder: { ar: 'اكتب اسمك هنا', en: 'Enter your name' },
      country: { ar: 'الدولة', en: 'Country' },
      chooseCountry: { ar: 'اختر الدولة', en: 'Select Country' },
      age: { ar: 'السن', en: 'Age' },
      gender: { ar: 'الجنس', en: 'Gender' },
      male: { ar: 'ذكر', en: 'Male' },
      female: { ar: 'أنثى', en: 'Female' },
      start: { ar: 'ابدأ الآن', en: 'Start Now' },
      searchCountry: { ar: 'بحث عن دولة...', en: 'Search country...' }
    };
    return dict[key][language];
  };

  const handleSubmit = () => {
    if (name && country && age) {
      onComplete({ name, country, age, gender, avatar: avatarPreview });
    }
  };

  const filteredCountries = COUNTRIES.filter(c => 
      c.name.ar.includes(countrySearch) || 
      c.name.en.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountryData = COUNTRIES.find(c => c.name.ar === country || c.name.en === country);

  return (
    <div className="relative h-screen w-full bg-gray-900 flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-gray-900 to-black"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 w-full max-w-md px-6 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-2">{t('title')}</h2>
        <p className="text-gray-400 text-sm mb-8">{t('subtitle')}</p>

        {/* Avatar Upload (Mock) */}
        <div 
          onClick={() => setShowAvatarSelector(true)}
          className="relative mb-8 group cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-500 to-accent-500 relative">
            <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full border-4 border-gray-900 object-cover" />
            
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                 <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 bg-white text-brand-600 rounded-full p-1 shadow-lg">
             <UserCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Form Fields */}
        <div className="w-full space-y-4">
          
          {/* Name */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3 focus-within:border-brand-500 transition">
            <label className={`block text-[10px] text-gray-400 uppercase tracking-wider mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('name')}
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-transparent border-none outline-none text-white placeholder-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}
              placeholder={t('namePlaceholder')}
            />
          </div>

          {/* Country Selector Trigger */}
          <div 
            onClick={() => setShowCountrySelector(true)}
            className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3 focus-within:border-brand-500 transition flex items-center gap-2 cursor-pointer hover:bg-white/10"
          >
             <MapPin className="w-5 h-5 text-gray-500" />
             <div className="flex-1">
                <label className={`block text-[10px] text-gray-400 uppercase tracking-wider mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('country')}
                </label>
                <div className={`w-full flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {selectedCountryData ? (
                        <>
                            <span className="text-xl">{selectedCountryData.flag}</span>
                            <span className="text-white font-medium">{selectedCountryData.name[language]}</span>
                        </>
                    ) : (
                        <span className="text-gray-500">{t('chooseCountry')}</span>
                    )}
                </div>
             </div>
          </div>

          {/* Age */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3 focus-within:border-brand-500 transition flex items-center gap-2">
             <Calendar className="w-5 h-5 text-gray-500" />
             <div className="flex-1">
                <label className={`block text-[10px] text-gray-400 uppercase tracking-wider mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('age')}
                </label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-full bg-transparent border-none outline-none text-white placeholder-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  placeholder="20"
                />
             </div>
          </div>

          {/* Gender */}
          <div className="flex gap-4 mt-2">
            <button 
                onClick={() => setGender('male')}
                className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${gender === 'male' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
            >
                <span className="text-lg">♂</span>
                <span className="text-xs font-bold">{t('male')}</span>
            </button>
            <button 
                onClick={() => setGender('female')}
                className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${gender === 'female' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
            >
                <span className="text-lg">♀</span>
                <span className="text-xs font-bold">{t('female')}</span>
            </button>
          </div>

        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={!name || !country || !age}
          className={`mt-10 w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg ${
              name && country && age 
              ? 'bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:scale-105 active:scale-95' 
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>{t('start')}</span>
          <Check className="w-5 h-5 rtl:rotate-180" />
        </button>

      </div>

      {showCountrySelector && (
          <div className="fixed inset-0 z-[80] bg-gray-900 flex flex-col animate-in slide-in-from-bottom-10">
              <div className="p-4 bg-gray-800 flex items-center gap-3 border-b border-gray-700">
                  <button onClick={() => setShowCountrySelector(false)} className="p-2 bg-gray-700 rounded-full text-white">
                      <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <h2 className="text-white font-bold flex-1">{t('chooseCountry')}</h2>
              </div>
              
              <div className="p-4 bg-gray-900 sticky top-0 z-10 border-b border-gray-800">
                  <div className="relative">
                      <Search className="absolute top-3 left-4 rtl:right-4 rtl:left-auto text-gray-500 w-5 h-5" />
                      <input 
                          type="text" 
                          placeholder={t('searchCountry')} 
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-12 text-white focus:border-brand-500 outline-none"
                      />
                      {countrySearch && (
                          <button onClick={() => setCountrySearch('')} className="absolute top-3 right-4 rtl:left-4 rtl:right-auto text-gray-500">
                              <X className="w-5 h-5" />
                          </button>
                      )}
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                  {filteredCountries.map((c) => (
                      <div 
                          key={c.code}
                          onClick={() => {
                              setCountry(c.name[language]);
                              setShowCountrySelector(false);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition border-b border-white/5 ${country === c.name[language] ? 'bg-brand-900/20 border-brand-500/30' : ''}`}
                      >
                          <span className="text-4xl drop-shadow-md">{c.flag}</span>
                          <span className="text-white font-bold text-lg">{c.name[language]}</span>
                          {country === c.name[language] && <div className="ml-auto bg-brand-500 w-2 h-2 rounded-full"></div>}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {showAvatarSelector && (
          <AvatarSelector 
              currentAvatar={avatarPreview}
              language={language}
              onSelect={(url) => setAvatarPreview(url)}
              onClose={() => setShowAvatarSelector(false)}
          />
      )}
    </div>
  );
};

export default InfoView;