
import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { DEFAULT_AVATARS } from '../constants';
import { Language } from '../types';

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelect: (url: string) => void;
  onClose: () => void;
  language: Language;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ currentAvatar, onSelect, onClose, language }) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      title: { ar: 'اختر الصورة الرمزية', en: 'Choose Avatar' },
      gallery: { ar: 'المعرض', en: 'Gallery' },
      upload: { ar: 'رفع صورة', en: 'Upload' },
      uploadDesc: { ar: 'اضغط لرفع صورة من جهازك (يدعم GIF)', en: 'Click to upload (GIF supported)' },
      maxSize: { ar: 'الحد الأقصى 5 ميجابايت', en: 'Max size 5MB' }
    };
    return dict[key][language];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(language === 'ar' ? 'حجم الصورة كبير جداً (أقصى حد 5 ميجا)' : 'Image size is too large (Max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onSelect(reader.result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">{t('title')}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-800/50">
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'gallery' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <ImageIcon className="w-4 h-4" />
            {t('gallery')}
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Upload className="w-4 h-4" />
            {t('upload')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 h-[400px] overflow-y-auto">
          
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-3 gap-4">
              {DEFAULT_AVATARS.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => { onSelect(url); onClose(); }}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition hover:scale-105 ${currentAvatar === url ? 'border-brand-500 ring-2 ring-brand-500/50' : 'border-transparent hover:border-gray-600'}`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <label className="w-full aspect-square max-w-[200px] border-2 border-dashed border-gray-600 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-white/5 transition group">
                <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                   <Camera className="w-8 h-8 text-brand-400" />
                </div>
                <p className="text-gray-300 font-bold text-sm text-center">{t('uploadDesc')}</p>
                <p className="text-gray-500 text-xs mt-1">{t('maxSize')}</p>
              </label>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
