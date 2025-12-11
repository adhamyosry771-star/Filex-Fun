import React, { useState } from 'react';
import { Globe, Mail, Lock, ArrowRight, Hexagon } from 'lucide-react';
import { Language } from '../types';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../services/firebaseService';

interface LoginViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onGuestLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ language, setLanguage, onGuestLogin }) => {
  const [mode, setMode] = useState<'welcome' | 'email_login' | 'email_signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Popup closed");
      } else {
        alert(language === 'ar' ? 'حدث خطأ في تسجيل الدخول عبر جوجل.' : 'Google login error.');
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
        if (mode === 'email_signup') {
            await registerWithEmail(email, password);
        } else {
            await loginWithEmail(email, password);
        }
    } catch (e: any) {
        setLoading(false);
        alert(e.message || "Authentication failed");
    }
  };

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
        slogan: { ar: 'مستقبل الترفيه الصوتي', en: 'The Future of Audio Entertainment' },
        subSlogan: { ar: 'ادخل العالم الجديد.. تواصل، العب، واربح', en: 'Connect, Play, Win' },
        google: { ar: 'دخول عبر Google', en: 'Login with Google' },
        emailBtn: { ar: 'دخول بالبريد', en: 'Login with Email' },
        createAcc: { ar: 'انضم للمجرة', en: 'Join Flex Fun' },
        login: { ar: 'تسجيل الدخول', en: 'Sign In' },
        signup: { ar: 'تسجيل جديد', en: 'Sign Up' },
        email: { ar: 'البريد الإلكتروني', en: 'Email' },
        pass: { ar: 'كلمة المرور', en: 'Password' },
        back: { ar: 'عودة', en: 'Back' },
        terms: { ar: 'بالمتابعة، أنت توافق على شروط الخدمة.', en: 'By continuing, you agree to Terms.' },
        langName: { ar: 'English', en: 'العربية' },
        haveAcc: { ar: 'لديك حساب؟', en: 'Have an account?' },
        noAcc: { ar: 'جديد هنا؟', en: 'New here?' },
        switchLogin: { ar: 'دخول', en: 'Login' },
        switchSignup: { ar: 'انشاء', en: 'Sign up' }
    };
    return dict[key][language];
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="relative h-screen w-full bg-gray-900 flex flex-col justify-center items-center overflow-hidden font-sans pb-24">
      
      {/* VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/3252345/3252345-uhd_2560_1440_25fps.mp4" type="video/mp4" />
        </video>
        {/* Softer, more comfortable gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/40 via-slate-900/50 to-gray-900/90 backdrop-blur-[2px]"></div>
      </div>

      {/* Language Toggle - Glassy */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-8 right-8 z-30 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold transition border border-white/10 shadow-lg"
      >
        <Globe className="w-3 h-3 text-white" />
        <span>{t('langName')}</span>
      </button>

      {/* Main Content Container - Glassmorphism */}
      <div className={`z-20 w-full max-w-sm px-6 flex flex-col items-center transition-all duration-700 ${mode !== 'welcome' ? 'mt-2' : ''}`}>
        
        {/* Logo Section */}
        <div className={`flex flex-col items-center text-center mb-6 transition-all duration-500 ${mode !== 'welcome' ? 'scale-75 mb-2' : ''}`}>
            <div className="relative w-24 h-24 mb-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 to-accent-500 rounded-[1.5rem] rotate-6 opacity-60 blur-lg animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center shadow-2xl z-10">
                     <Hexagon className="w-12 h-12 text-white drop-shadow-md" strokeWidth={1.5} />
                </div>
            </div>
            
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 drop-shadow-lg font-outfit">
              Flex Fun
            </h1>
            {mode === 'welcome' && (
                <div className="space-y-1 animate-in fade-in zoom-in duration-700">
                    <p className="text-white/90 text-sm font-medium drop-shadow-md">{t('slogan')}</p>
                    <p className="text-brand-200 text-xs font-light drop-shadow">{t('subSlogan')}</p>
                </div>
            )}
        </div>

        {/* Dynamic Glass Card for Forms/Actions */}
        <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-in slide-in-from-bottom-10 fade-in duration-500">
            
            {mode === 'welcome' && (
                <div className="space-y-3">
                    <button 
                      onClick={handleGoogleLogin}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl relative overflow-hidden group"
                    >
                      <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {t('google')}
                    </button>

                    <button 
                      onClick={() => setMode('email_login')}
                      className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition border border-white/10 shadow-lg"
                    >
                      <Mail className="w-5 h-5" />
                      {t('emailBtn')}
                    </button>
                </div>
            )}

            {(mode === 'email_login' || mode === 'email_signup') && (
                <div className="animate-in fade-in">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">
                        {mode === 'email_login' ? t('login') : t('createAcc')}
                    </h3>

                    <div className="space-y-3">
                        <div className="relative group">
                            <Mail className="absolute top-3.5 left-4 rtl:right-4 rtl:left-auto w-5 h-5 text-gray-400 group-focus-within:text-brand-300 transition" />
                            <input 
                              type="email" 
                              placeholder={t('email')}
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:border-brand-500/50 focus:bg-black/30 focus:outline-none transition"
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute top-3.5 left-4 rtl:right-4 rtl:left-auto w-5 h-5 text-gray-400 group-focus-within:text-brand-300 transition" />
                            <input 
                              type="password" 
                              placeholder={t('pass')}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:border-brand-500/50 focus:bg-black/30 focus:outline-none transition"
                            />
                        </div>

                        <button 
                          onClick={handleEmailAuth}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                           {loading ? <span className="animate-spin">⏳</span> : (mode === 'email_login' ? t('login') : t('signup'))}
                           {!loading && <ArrowRight className="w-5 h-5 rtl:rotate-180" />}
                        </button>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-400">
                            {mode === 'email_login' ? t('noAcc') : t('haveAcc')}
                        </p>
                        <button 
                          onClick={() => setMode(mode === 'email_login' ? 'email_signup' : 'email_login')}
                          className="text-brand-300 font-bold hover:text-white transition bg-white/5 px-4 py-1 rounded-full border border-white/5 text-sm"
                        >
                            {mode === 'email_login' ? t('switchSignup') : t('switchLogin')}
                        </button>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-3 flex justify-center">
                       <button onClick={() => setMode('welcome')} className="text-xs text-gray-500 hover:text-white transition">
                          {t('back')}
                       </button>
                    </div>
                </div>
            )}
        </div>
        
        {mode === 'welcome' && (
             <p className="text-[10px] text-white/40 text-center mt-6 max-w-xs leading-relaxed">{t('terms')}</p>
        )}

      </div>
    </div>
  );
};

export default LoginView;