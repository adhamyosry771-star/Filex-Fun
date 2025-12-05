
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Clock, Users, Eye } from 'lucide-react';
import { Language, Visitor } from '../types';
import { getUserList } from '../services/firebaseService';

interface UserListModalProps {
  type: 'friends' | 'followers' | 'following' | 'visitors';
  userId: string;
  onClose: () => void;
  language: Language;
}

const UserListModal: React.FC<UserListModalProps> = ({ type, userId, onClose, language }) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getUserList(userId, type);
        setList(data);
      } catch (error) {
        console.error("Failed to fetch list", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [userId, type]);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      friends: { ar: 'الأصدقاء', en: 'Friends' },
      followers: { ar: 'المتابعين', en: 'Followers' },
      following: { ar: 'المتابعة', en: 'Following' },
      visitors: { ar: 'الزوار', en: 'Visitors' },
      noData: { ar: 'لا يوجد بيانات', en: 'No data found' },
      visitCount: { ar: 'زيارات', en: 'Visits' }
    };
    return dict[key]?.[language] || key;
  };

  const getTitle = () => t(type);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h3 className="text-white font-bold flex items-center gap-2 text-lg">
             {type === 'visitors' ? <Eye className="w-5 h-5 text-brand-400" /> : <Users className="w-5 h-5 text-brand-400" />}
             {getTitle()}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400"><X className="w-6 h-6" /></button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-center text-gray-500 py-10">{t('noData')}</div>
          ) : (
            list.map((user: any, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-transparent hover:border-gray-700">
                <img src={user.avatar || 'https://picsum.photos/200'} className="w-12 h-12 rounded-full object-cover border border-gray-600" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                  {type === 'visitors' && (user as Visitor).lastVisitTime && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date((user as Visitor).lastVisitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                  )}
                </div>
                
                {/* Visitor Specifics */}
                {type === 'visitors' && (user as Visitor).visitCount > 1 && (
                    <div className="bg-brand-900/50 text-brand-300 text-[10px] px-2 py-1 rounded-full border border-brand-500/30">
                        {user.visitCount} {t('visitCount')}
                    </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
