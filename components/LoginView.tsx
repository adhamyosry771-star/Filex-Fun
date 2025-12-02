import React, { useState } from 'react';
import { Smartphone, Globe, Mail, Lock, ArrowRight, User as UserIcon, Hexagon, Zap } from 'lucide-react';
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
        // User closed the popup, no need to alert
        console.log("Popup closed");
      } else {
        alert(language === 'ar' ? 'حدث خطأ في تسجيل الدخول عبر جوجل. يرجى المحاولة مرة أخرى.' : 'Google login error. Please try again.');
        console.error("Google Login Error:", error);
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
    } catch (e) {
        setLoading(false);
    }
  };

  const t = (key: string) => {
    const dict: Record<string, { ar: string, en: string }> = {
        slogan: { ar: 'مستقبل الترفيه الصوتي', en: 'The Future of Audio Entertainment' },
        subSlogan: { ar: 'ادخل العالم الجديد.. تواصل، العب، واربح', en: 'Connect, Play, Win' },
        google: { ar: 'دخول عبر Google', en: 'Login with Google' },
        emailBtn: { ar: 'دخول بالبريد', en: 'Login with Email' },
        guestBtn: { ar: 'دخول كزائر', en: 'Guest Login' },
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
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="relative h-screen w-full bg-gray-900 flex flex-col justify-end pb-12 items-center overflow-hidden font-sans">
      
      {/* VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          {/* Friends hiking/mountains video */}
          <source src="https://videos.pexels.com/video-files/3252345/3252345-uhd_2560_1440_25fps.mp4" type="video/mp4" />
        </video>
        {/* Overlay: Stronger gradients to ensure white text is readable over the dynamic video */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/30 via-black/40 to-black/90"></div>
      </div>

      {/* Language Toggle */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-8 right-8 z-30 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold hover:bg-white/20 transition border border-white/20"
      >
        <Globe className="w-3 h-3 text-white" />
        <span>{t('langName')}</span>
      </button>

      {/* Logo */}
      <div className={`z-20 flex flex-col items-center w-full px-8 text-center transition-all duration-700 ${mode !== 'welcome' ? 'mb-4 scale-75' : 'mb-16'}`}>
        <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 to-accent-500 rounded-3xl rotate-12 opacity-80 blur-sm"></div>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl flex items-center justify-center shadow-2xl z-10">
                 <Hexagon className="w-12 h-12 text-white fill-brand-600/20" />
            </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
          Flex Fun
        </h1>
        {mode === 'welcome' && (
            <div className="space-y-2 animate-in fade-in zoom-in duration-700">
                <p className="text-white text-lg font-bold drop-shadow-md">{t('slogan')}</p>
                <p className="text-brand-200 text-sm font-medium drop-shadow">{t('subSlogan')}</p>
            </div>
        )}
      </div>

      {/* ACTION AREA */}
      {mode === 'welcome' && (
          <div className="z-20 w-full max-w-sm px-6 space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition shadow-xl relative overflow-hidden group cursor-pointer z-50"
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
              className="w-full bg-white/10 backdrop-blur-md text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition border border-white/20 shadow-lg"
            >
              <Mail className="w-5 h-5" />
              {t('emailBtn')}
            </button>
            
            <p className="text-[10px] text-gray-400 text-center mt-6 px-4">{t('terms')}</p>
          </div>
      )}

      {/* EMAIL FORMS */}
      {(mode === 'email_login' || mode === 'email_signup') && (
          <div className="z-20 w-full max-w-sm px-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div className="bg-black/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-8 text-center">
                      {mode === 'email_login' ? t('login') : t('createAcc')}
                  </h3>

                  <div className="space-y-5">
                      <div className="relative group">
                          <Mail className="absolute top-3.5 left-4 rtl:right-4 rtl:left-auto w-5 h-5 text-gray-400 group-focus-within:text-brand-400 transition" />
                          <input 
                            type="email" 
                            placeholder={t('email')}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-12 text-white focus:border-brand-500 focus:bg-white/10 focus:outline-none transition"
                          />
                      </div>
                      <div className="relative group">
                          <Lock className="absolute top-3.5 left-4 rtl:right-4 rtl:left-auto w-5 h-5 text-gray-400 group-focus-within:text-brand-400 transition" />
                          <input 
                            type="password" 
                            placeholder={t('pass')}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-12 text-white focus:border-brand-500 focus:bg-white/10 focus:outline-none transition"
                          />
                      </div>

                      <button 
                        onClick={handleEmailAuth}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-brand-600 to-accent-600 text-white font-bold py-4 rounded-xl hover:scale-105 transition flex items-center justify-center gap-2 shadow-lg mt-2"
                      >
                         {loading ? <span className="animate-spin">⏳</span> : (mode === 'email_login' ? t('login') : t('signup'))}
                         {!loading && <ArrowRight className="w-5 h-5 rtl:rotate-180" />}
                      </button>
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-4">
                      <p className="text-sm text-gray-300">
                          {mode === 'email_login' ? t('noAcc') : t('haveAcc')}
                      </p>
                      <button 
                        onClick={() => setMode(mode === 'email_login' ? 'email_signup' : 'email_login')}
                        className="text-brand-400 font-bold hover:text-white transition"
                      >
                          {mode === 'email_login' ? t('switchSignup') : t('switchLogin')}
                      </button>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4 flex justify-center">
                     <button onClick={() => setMode('welcome')} className="text-xs text-gray-400 hover:text-white transition">
                        {t('back')}
                     </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LoginView;