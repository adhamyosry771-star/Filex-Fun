import React, { useState } from 'react';
import { ArrowLeft, Camera, Save, MapPin, Calendar, User, FileText, Globe, Search, X } from 'lucide-react';
import { User as UserType, Language } from '../types';
import { updateUserProfile } from '../services/firebaseService';
import AvatarSelector from './AvatarSelector';
import { COUNTRIES } from '../constants';

interface EditProfileModalProps {
  user: UserType;
  language: Language;
  onClose: () => void;
  onUpdate: (data: Partial<UserType>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, language, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [country, setCountry] = useState(user.country || '');
  const [age, setAge] = useState(user.age?.toString() || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // Country Selector State
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [saving, setSaving] = useState(false);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      editProfile: { ar: 'تعديل الملف الشخصي', en: 'Edit Profile' },
      personalInfo: { ar: 'المعلومات الشخصية', en: 'Personal Info' },
      name: { ar: 'الاسم', en: 'Name' },
      bio: { ar: 'نبذة عني (Bio)', en: 'Bio' },
      bioPlaceholder: { ar: 'اكتب شيئاً مميزاً عن نفسك...', en: 'Write something special about yourself...' },
      country: { ar: 'الدولة', en: 'Country' },
      age: { ar: 'العمر', en: 'Age' },
      save: { ar: 'حفظ التغييرات', en: 'Save Changes' },
      saving: { ar: 'جاري الحفظ...', en: 'Saving...' },
      changePhoto: { ar: 'تغيير الصورة', en: 'Change Photo' },
      btnSave: { ar: 'حفظ', en: 'Save' },
      selectCountry: { ar: 'اختر الدولة', en: 'Select Country' },
      searchCountry: { ar: 'بحث عن دولة...', en: 'Search country...' }
    };
    return dict[key][language];
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    
    const updates: Partial<UserType> = {
      name,
      bio,
      country,
      age: parseInt(age) || 18,
      avatar
    };

    try {
      if (user.uid) {
        await updateUserProfile(user.uid, updates);
        onUpdate(updates);
        onClose();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaving(false);
    }
  };

  // Filter countries
  const filteredCountries = COUNTRIES.filter(c => 
      c.name.ar.includes(countrySearch) || 
      c.name.en.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const currentCountry = COUNTRIES.find(c => c.name.ar === country || c.name.en === country) || { flag: '🌍', name: { ar: country || 'اختر', en: country || 'Select' } };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col animate-in slide-in-from-bottom-10 font-sans">
      
      {/* Header */}
      <div className="p-4 bg-gray-800 shadow-md flex items-center justify-between shrink-0 z-10 border-b border-gray-700">
        <button 
          onClick={onClose} 
          className="p-2 rounded-full hover:bg-white/10 transition border border-white/5"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white tracking-wide">{t('editProfile')}</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="text-brand-400 font-bold text-sm hover:text-brand-300 transition"
        >
           {saving ? '...' : t('btnSave')}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div 
            onClick={() => setShowAvatarSelector(true)}
            className="relative w-32 h-32 cursor-pointer group"
          >
            <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-brand-500 to-accent-500 shadow-xl">
               <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-gray-900 group-hover:opacity-80 transition" />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 z-10">
              <Camera className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            
            <div className="absolute bottom-0 right-0 bg-gray-800 p-2 rounded-full border-2 border-gray-700 shadow-lg z-20">
              <Camera className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-medium mt-3">{t('changePhoto')}</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6 max-w-lg mx-auto">
          
          <h3 className="text-brand-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
             <User className="w-4 h-4" /> {t('personalInfo')}
          </h3>

          {/* Name Field */}
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 focus-within:border-brand-500 transition group">
            <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wide group-focus-within:text-brand-400 transition">{t('name')}</label>
            <div className="flex items-center gap-3">
               <User className="w-5 h-5 text-gray-500 group-focus-within:text-brand-500 transition" />
               <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-white font-medium outline-none placeholder-gray-600"
               />
            </div>
          </div>

          {/* Bio Field */}
          <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 focus-within:border-brand-500 transition group">
            <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wide group-focus-within:text-brand-400 transition">{t('bio')}</label>
            <div className="flex items-start gap-3">
               <FileText className="w-5 h-5 text-gray-500 mt-1 group-focus-within:text-brand-500 transition" />
               <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={t('bioPlaceholder')}
                  className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder-gray-600 leading-relaxed"
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* Country Selector Trigger */}
              <div 
                onClick={() => setShowCountrySelector(true)}
                className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 hover:border-brand-500 transition group cursor-pointer"
              >
                <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wide group-hover:text-brand-400 transition">{t('country')}</label>
                <div className="flex items-center gap-3">
                   <Globe className="w-5 h-5 text-gray-500 group-hover:text-brand-500 transition" />
                   <div className="flex items-center gap-2 text-white font-medium">
                       <span className="text-xl">{currentCountry.flag}</span>
                       <span className="text-sm truncate">{currentCountry.name[language] || currentCountry.name.en}</span>
                   </div>
                </div>
              </div>

              {/* Age */}
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 focus-within:border-brand-500 transition group">
                <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wide group-focus-within:text-brand-400 transition">{t('age')}</label>
                <div className="flex items-center gap-3">
                   <Calendar className="w-5 h-5 text-gray-500 group-focus-within:text-brand-500 transition" />
                   <input 
                      type="number" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-transparent text-white font-medium outline-none placeholder-gray-600"
                   />
                </div>
              </div>
          </div>

        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 bg-gray-800/90 backdrop-blur-lg border-t border-gray-700 shrink-0 absolute bottom-0 left-0 right-0 z-20">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95 shadow-lg disabled:opacity-50 disabled:scale-100"
        >
          {saving ? (
              <span className="animate-pulse">{t('saving')}</span>
          ) : (
              <>
                  <Save className="w-5 h-5" /> {t('save')}
              </>
          )}
        </button>
      </div>

      {/* Country Selector Modal Overlay */}
      {showCountrySelector && (
          <div className="fixed inset-0 z-[80] bg-gray-900 flex flex-col animate-in slide-in-from-bottom-10">
              <div className="p-4 bg-gray-800 flex items-center gap-3 border-b border-gray-700">
                  <button onClick={() => setShowCountrySelector(false)} className="p-2 bg-gray-700 rounded-full text-white">
                      <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <h2 className="text-white font-bold flex-1">{t('selectCountry')}</h2>
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
            currentAvatar={avatar}
            language={language}
            onSelect={(url) => { setAvatar(url); setShowAvatarSelector(false); }}
            onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
};

export default EditProfileModal;