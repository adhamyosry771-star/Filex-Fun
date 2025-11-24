import React, { useState } from 'react';
import { UserCircle, MapPin, Calendar, Check, Camera } from 'lucide-react';
import { Language } from '../types';
import AvatarSelector from './AvatarSelector';
import { DEFAULT_AVATARS } from '../constants';

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
      start: { ar: 'ابدأ الآن', en: 'Start Now' }
    };
    return dict[key][language];
  };

  const handleSubmit = () => {
    if (name && country && age) {
      onComplete({ name, country, age, gender, avatar: avatarPreview });
    }
  };

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

          {/* Country */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3 focus-within:border-brand-500 transition flex items-center gap-2">
             <MapPin className="w-5 h-5 text-gray-500" />
             <div className="flex-1">
                <label className={`block text-[10px] text-gray-400 uppercase tracking-wider mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('country')}
                </label>
                <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className={`w-full bg-transparent border-none outline-none text-white appearance-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                    <option value="" className="bg-gray-800 text-gray-500">{t('chooseCountry')}</option>
                    <option value="Egypt" className="bg-gray-800">Egypt 🇪🇬</option>
                    <option value="KSA" className="bg-gray-800">KSA 🇸🇦</option>
                    <option value="UAE" className="bg-gray-800">UAE 🇦🇪</option>
                    <option value="Morocco" className="bg-gray-800">Morocco 🇲🇦</option>
                    <option value="Other" className="bg-gray-800">Other 🌍</option>
                </select>
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