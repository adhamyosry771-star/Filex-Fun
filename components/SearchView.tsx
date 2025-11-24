
import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus, Check } from 'lucide-react';
import { Language, User } from '../types';
import { searchUserByDisplayId, sendFriendRequest } from '../services/firebaseService';
import { auth } from '../firebaseConfig';

interface SearchViewProps {
  language: Language;
  onBack: () => void;
  currentUser: User;
}

const SearchView: React.FC<SearchViewProps> = ({ language, onBack, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<User | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      search: { ar: 'بحث عن مستخدم', en: 'Search User' },
      placeholder: { ar: 'أدخل المعرف (ID)', en: 'Enter User ID' },
      find: { ar: 'بحث', en: 'Search' },
      notFound: { ar: 'لم يتم العثور على المستخدم', en: 'User not found' },
      add: { ar: 'متابعة', en: 'Follow' },
      sent: { ar: 'تم الإرسال', en: 'Sent' },
      self: { ar: 'هذا أنت!', en: 'That\'s you!' }
    };
    return dict[key][language];
  };

  const handleSearch = async () => {
      if (!searchTerm) return;
      setLoading(true);
      setResult(null);
      setRequestSent(false);
      
      const user = await searchUserByDisplayId(searchTerm);
      setResult(user);
      setLoading(false);
  };

  const handleSendRequest = async () => {
      if (!result || !result.uid || !auth.currentUser) return;
      setLoading(true);
      try {
          await sendFriendRequest(auth.currentUser.uid, result.uid, currentUser.name, currentUser.avatar);
          setRequestSent(true);
      } catch (e) {
          alert("Failed to send request");
      }
      setLoading(false);
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col font-sans">
      <div className="p-4 bg-gray-800 shadow flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
        </button>
        <h1 className="font-bold text-lg">{t('search')}</h1>
      </div>

      <div className="p-4 space-y-6">
          <div className="relative">
              <Search className="absolute top-3.5 left-4 rtl:right-4 rtl:left-auto text-gray-500 w-5 h-5" />
              <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder={t('placeholder')}
                 className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 px-12 focus:border-brand-500 outline-none"
              />
              <button 
                onClick={handleSearch}
                disabled={loading || !searchTerm}
                className="absolute top-1.5 right-1.5 rtl:left-1.5 rtl:right-auto bg-brand-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm"
              >
                  {loading ? '...' : t('find')}
              </button>
          </div>

          {result ? (
              <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center animate-in zoom-in">
                  <img src={result.avatar} className="w-24 h-24 rounded-full border-4 border-brand-500 mb-4 object-cover" />
                  <h2 className="text-xl font-bold mb-1">{result.name}</h2>
                  <p className="text-gray-400 text-sm mb-4">ID: {result.id}</p>
                  
                  {result.uid === currentUser.uid ? (
                      <span className="text-brand-400 font-bold">{t('self')}</span>
                  ) : requestSent ? (
                      <button disabled className="px-8 py-2 bg-green-600/20 text-green-500 rounded-full font-bold flex items-center gap-2">
                          <Check className="w-4 h-4" /> {t('sent')}
                      </button>
                  ) : (
                      <button onClick={handleSendRequest} className="px-8 py-2 bg-gradient-to-r from-brand-600 to-accent-600 rounded-full font-bold text-white flex items-center gap-2 shadow-lg hover:scale-105 transition">
                          <UserPlus className="w-4 h-4" /> {t('add')}
                      </button>
                  )}
              </div>
          ) : searchTerm && !loading && (
              <div className="text-center text-gray-500 mt-10">
                  {t('notFound')}
              </div>
          )}
      </div>
    </div>
  );
};

export default SearchView;
