import React, { useState } from 'react';
import { ArrowLeft, Send, Sparkles, User as UserIcon } from 'lucide-react';
import { Language, User } from '../types';
import { submitWelcomeRequest } from '../services/firebaseService';

interface WelcomeAgencyViewProps {
  user: User;
  language: Language;
  onBack: () => void;
}

const WelcomeAgencyView: React.FC<WelcomeAgencyViewProps> = ({ user, language, onBack }) => {
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
      title: { ar: 'نظام الترحيب', en: 'Welcome System' },
      subtitle: { ar: 'تقديم طلب دعم للمستخدمين الجدد', en: 'Submit support request for new users' },
      userId: { ar: 'معرف المستخدم (ID)', en: 'User ID' },
      submit: { ar: 'تقديم الطلب', en: 'Submit Request' },
      success: { ar: 'تم تقديم الطلب بنجاح! بانتظار الموافقة.', en: 'Request submitted successfully! Awaiting approval.' },
      error: { ar: 'فشلت العملية', en: 'Submission Failed' },
      desc: { ar: 'عند الموافقة، سيحصل المستخدم على VIP 5 و 20 مليون ماسة.', en: 'Upon approval, user gets VIP 5 & 20M Diamonds.' }
    };
    return dict[key][language];
  };

  const handleSubmit = async () => {
      if (!targetId) return;
      setLoading(true);
      try {
          await submitWelcomeRequest(user, targetId);
          alert(t('success'));
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
        <h1 className="text-xl font-bold flex items-center gap-2 text-purple-400">
          <Sparkles className="w-6 h-6" />
          {t('title')}
        </h1>
      </div>

      <div className="p-6 space-y-6">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 border border-purple-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
              <h3 className="text-purple-200 font-bold mb-2 text-lg">{t('subtitle')}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{t('desc')}</p>
          </div>

          {/* Form */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="space-y-4">
                  <div>
                      <label className="text-xs text-gray-400 mb-1 block">{t('userId')}</label>
                      <div className="relative">
                          <UserIcon className="absolute top-3 left-3 w-5 h-5 text-gray-500 rtl:right-3 rtl:left-auto" />
                          <input 
                            type="text" 
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full bg-black/40 border border-gray-600 rounded-xl py-3 px-10 text-white focus:border-purple-500 outline-none"
                            placeholder="Ex: 123456"
                          />
                      </div>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    disabled={loading || !targetId}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                      {loading ? '...' : <><Send className="w-4 h-4 rtl:rotate-180" /> {t('submit')}</>}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default WelcomeAgencyView;