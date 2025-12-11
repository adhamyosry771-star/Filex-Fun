import React, { useState } from 'react';
import { ArrowLeft, Gavel, Search, Ban, X, Check, Trash2 } from 'lucide-react';
import { Language, User } from '../types';
import { searchUserByDisplayId, adminUpdateUser, deleteUserProfile } from '../services/firebaseService';

interface BanSystemViewProps {
  user: User;
  language: Language;
  onBack: () => void;
}

const BanSystemView: React.FC<BanSystemViewProps> = ({ user, language, onBack }) => {
  const [targetId, setTargetId] = useState('');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      title: { ar: 'نظام الحظر', en: 'Ban System' },
      searchPlaceholder: { ar: 'ابحث عن ID المستخدم...', en: 'Search User ID...' },
      search: { ar: 'بحث', en: 'Search' },
      notFound: { ar: 'المستخدم غير موجود', en: 'User not found' },
      banDuration: { ar: 'مدة الحظر', en: 'Ban Duration' },
      day: { ar: 'يوم', en: '1 Day' },
      week: { ar: 'أسبوع', en: '1 Week' },
      month: { ar: 'شهر', en: '1 Month' },
      permanent: { ar: 'دائم', en: 'Permanent' },
      confirm: { ar: 'تأكيد الحظر', en: 'Confirm Ban' },
      unban: { ar: 'فك الحظر', en: 'Unban' },
      delete: { ar: 'حذف الحساب', en: 'Delete Account' }, // Optional power
      successBan: { ar: 'تم حظر المستخدم بنجاح', en: 'User banned successfully' },
      successUnban: { ar: 'تم فك الحظر بنجاح', en: 'User unbanned successfully' },
      error: { ar: 'حدث خطأ', en: 'An error occurred' },
      bannedStatus: { ar: 'حالة الحساب: محظور', en: 'Status: Banned' },
      activeStatus: { ar: 'حالة الحساب: نشط', en: 'Status: Active' },
      noSelf: { ar: 'لا يمكنك حظر نفسك', en: 'Cannot ban yourself' }
    };
    return dict[key][language];
  };

  const handleSearch = async () => {
      if (!targetId) return;
      if (targetId === user.id) {
          alert(t('noSelf'));
          return;
      }
      setLoading(true);
      setSearchedUser(null);
      setBanDuration(null);
      
      try {
          const result = await searchUserByDisplayId(targetId);
          if (result) {
              setSearchedUser(result);
          } else {
              alert(t('notFound'));
          }
      } catch (e) {
          alert(t('error'));
      }
      setLoading(false);
  };

  const handleBan = async () => {
      if (!searchedUser || !searchedUser.uid || banDuration === null) return;
      setActionLoading(true);

      try {
          const updateData: Partial<User> = { 
              isBanned: true,
              isPermanentBan: banDuration === -1
          };

          if (banDuration !== -1) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + banDuration);
              updateData.banExpiresAt = expiryDate.getTime();
          } else {
              updateData.banExpiresAt = 0;
          }

          await adminUpdateUser(searchedUser.uid, updateData);
          setSearchedUser({ ...searchedUser, ...updateData });
          alert(t('successBan'));
      } catch (e) {
          alert(t('error'));
      }
      setActionLoading(false);
  };

  const handleUnban = async () => {
      if (!searchedUser || !searchedUser.uid) return;
      setActionLoading(true);
      try {
          const updateData: Partial<User> = { 
              isBanned: false,
              isPermanentBan: false,
              banExpiresAt: 0
          };
          await adminUpdateUser(searchedUser.uid, updateData);
          setSearchedUser({ ...searchedUser, ...updateData });
          alert(t('successUnban'));
      } catch (e) {
          alert(t('error'));
      }
      setActionLoading(false);
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 bg-gray-800 shadow-md flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2 text-red-500">
          <Gavel className="w-6 h-6" />
          {t('title')}
        </h1>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Search Box */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <Search className="absolute top-3 left-3 w-5 h-5 text-gray-500 rtl:right-3 rtl:left-auto" />
                      <input 
                          type="text" 
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                          placeholder={t('searchPlaceholder')}
                          className="w-full bg-black/40 border border-gray-600 rounded-xl py-2.5 px-10 text-white focus:border-red-500 outline-none"
                      />
                  </div>
                  <button 
                      onClick={handleSearch}
                      disabled={loading || !targetId}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 rounded-xl font-bold transition disabled:opacity-50"
                  >
                      {loading ? '...' : t('search')}
                  </button>
              </div>
          </div>

          {/* Result */}
          {searchedUser && (
              <div className={`bg-gray-800 rounded-2xl p-5 border ${searchedUser.isBanned ? 'border-red-600' : 'border-gray-700'} animate-in fade-in slide-in-from-bottom-4`}>
                  <div className="flex items-center gap-4 mb-4">
                      <img src={searchedUser.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                      <div>
                          <h3 className="text-lg font-bold text-white">{searchedUser.name}</h3>
                          <p className="text-sm text-gray-400 font-mono">ID: {searchedUser.id}</p>
                          <div className={`mt-1 text-xs font-bold px-2 py-0.5 rounded w-fit ${searchedUser.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                              {searchedUser.isBanned ? t('bannedStatus') : t('activeStatus')}
                          </div>
                      </div>
                  </div>

                  {searchedUser.isBanned ? (
                      <button 
                          onClick={handleUnban}
                          disabled={actionLoading}
                          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                      >
                          <Check className="w-5 h-5" /> {t('unban')}
                      </button>
                  ) : (
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-xs text-gray-400 font-bold">{t('banDuration')}</label>
                              <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => setBanDuration(1)} className={`py-2 rounded-lg text-xs font-bold border transition ${banDuration === 1 ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-700 border-transparent text-gray-300'}`}>{t('day')}</button>
                                  <button onClick={() => setBanDuration(7)} className={`py-2 rounded-lg text-xs font-bold border transition ${banDuration === 7 ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-700 border-transparent text-gray-300'}`}>{t('week')}</button>
                                  <button onClick={() => setBanDuration(30)} className={`py-2 rounded-lg text-xs font-bold border transition ${banDuration === 30 ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-700 border-transparent text-gray-300'}`}>{t('month')}</button>
                                  <button onClick={() => setBanDuration(-1)} className={`py-2 rounded-lg text-xs font-bold border transition ${banDuration === -1 ? 'bg-red-900 border-red-600 text-white' : 'bg-gray-700 border-transparent text-gray-300'}`}>{t('permanent')}</button>
                              </div>
                          </div>

                          <button 
                              onClick={handleBan}
                              disabled={actionLoading || banDuration === null}
                              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {actionLoading ? '...' : <><Ban className="w-5 h-5" /> {t('confirm')}</>}
                          </button>
                      </div>
                  )}
              </div>
          )}

      </div>
    </div>
  );
};

export default BanSystemView;