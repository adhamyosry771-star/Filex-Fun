
import React, { useState } from 'react';
import { ArrowLeft, Send, Database, User as UserIcon } from 'lucide-react';
import { Language, User } from '../types';
import { transferAgencyDiamonds } from '../services/firebaseService';

interface AgencyViewProps {
  user: User;
  language: Language;
  onBack: () => void;
}

const AgencyView: React.FC<AgencyViewProps> = ({ user, language, onBack }) => {
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      title: { ar: 'لوحة الوكالة', en: 'Agency Dashboard' },
      balance: { ar: 'رصيد الوكالة', en: 'Agency Balance' },
      transfer: { ar: 'تحويل ماسات', en: 'Transfer Diamonds' },
      userId: { ar: 'معرف المستخدم (ID)', en: 'User ID' },
      amount: { ar: 'الكمية', en: 'Amount' },
      send: { ar: 'إرسال', en: 'Send' },
      success: { ar: 'تم التحويل بنجاح!', en: 'Transfer Successful!' },
      error: { ar: 'فشلت العملية', en: 'Transaction Failed' },
      insufficient: { ar: 'رصيد غير كاف', en: 'Insufficient Balance' }
    };
    return dict[key][language];
  };

  const handleTransfer = async () => {
      if (!targetId || !amount || isNaN(Number(amount))) return;
      const val = parseInt(amount);
      if (val <= 0) return;
      
      if ((user.agencyBalance || 0) < val) {
          alert(t('insufficient'));
          return;
      }

      setLoading(true);
      try {
          await transferAgencyDiamonds(user.uid!, targetId, val);
          alert(t('success'));
          setAmount('');
          setTargetId('');
      } catch (e: any) {
          alert(t('error') + ": " + e.message);
      }
      setLoading(false);
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col font-sans">
      <div className="p-4 bg-gray-800 shadow-md flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
          <Database className="w-6 h-6" />
          {t('title')}
        </h1>
      </div>

      <div className="p-6 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-blue-900 to-cyan-900 rounded-3xl p-6 border border-blue-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
              <h3 className="text-blue-200 font-medium mb-2">{t('balance')}</h3>
              <div className="text-4xl font-bold text-white tracking-wider flex items-center gap-2">
                  💎 {(user.agencyBalance || 0).toLocaleString()}
              </div>
          </div>

          {/* Transfer Form */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-400" />
                  {t('transfer')}
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="text-xs text-gray-400 mb-1 block">{t('userId')}</label>
                      <div className="relative">
                          <UserIcon className="absolute top-3 left-3 w-5 h-5 text-gray-500 rtl:right-3 rtl:left-auto" />
                          <input 
                            type="text" 
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full bg-black/40 border border-gray-600 rounded-xl py-3 px-10 text-white focus:border-blue-500 outline-none"
                            placeholder="Ex: OFFECAL"
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-xs text-gray-400 mb-1 block">{t('amount')}</label>
                      <div className="relative">
                          <span className="absolute top-3 left-3 text-gray-500 rtl:right-3 rtl:left-auto">💎</span>
                          <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-black/40 border border-gray-600 rounded-xl py-3 px-10 text-white focus:border-blue-500 outline-none"
                            placeholder="1000"
                          />
                      </div>
                  </div>

                  <button 
                    onClick={handleTransfer}
                    disabled={loading || !amount || !targetId}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                      {loading ? '...' : t('send')}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AgencyView;
