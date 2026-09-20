import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEFAULT_SILHOUETTE_AVATAR } from '../context/AuthContext';
import { LaTierritaLogo } from './LaTierritaLogo';
import {
  User,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  FileText,
  MapPin,
  Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COLOMBIAN_CITIES, SPANISH_CITIES } from '../data/citiesData';

interface RegisterViewProps {
  onGoToLogin: () => void;
}

const MONTHS = [
  { value: '01', label: 'Ene' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Abr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Ago' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dic' }
];

export const RegisterView: React.FC<RegisterViewProps> = ({ onGoToLogin }) => {
  const {
    registerWithEmail,
    checkUsernameExists
  } = useAuth();

  // Current Step: 1 | 2 | 3 | 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // 1. Primera Parte (Correo, Contraseña, Social)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSocialAuth, setIsSocialAuth] = useState(false);

  // 2. Segunda Parte (Nombre de usuario único)
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');

  // 3. Tercera Parte (Nombre, Apellido, Fecha de nacimiento dd/mm/aaaa mínimo 18 años)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [isAgeValid, setIsAgeValid] = useState<boolean | null>(null);
  const [originCity, setOriginCity] = useState('');
  const [currentCity, setCurrentCity] = useState('Madrid');

  // 4. Cuarta Parte (Foto de perfil opcional, subir desde galería)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Generate Year options (1920 up to current year - 18)
  const currentYear = new Date().getFullYear();
  const maxAllowedYear = currentYear - 18;
  const years = Array.from({ length: maxAllowedYear - 1920 + 1 }, (_, i) => String(maxAllowedYear - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // Calculate age when day, month, year change
  useEffect(() => {
    if (birthDay && birthMonth && birthYear) {
      const dayNum = parseInt(birthDay, 10);
      const monthNum = parseInt(birthMonth, 10) - 1;
      const yearNum = parseInt(birthYear, 10);

      const birthDateObj = new Date(yearNum, monthNum, dayNum);
      const today = new Date();

      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }

      setCalculatedAge(age);
      if (age >= 18 && age <= 120) {
        setIsAgeValid(true);
      } else {
        setIsAgeValid(false);
      }
    } else {
      setCalculatedAge(null);
      setIsAgeValid(null);
    }
  }, [birthDay, birthMonth, birthYear]);

  // Username validation debouncing
  useEffect(() => {
    const clean = username.replace('@', '').trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Mínimo 3 caracteres');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Solo minúsculas, números y _');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const taken = await checkUsernameExists(clean);
        if (taken) {
          setUsernameStatus('taken');
          setUsernameMessage('Usuario no disponible. Elige otro.');
        } else {
          setUsernameStatus('available');
          setUsernameMessage(`@${clean} disponible`);
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkUsernameExists]);

  const parseFirebaseError = (err: unknown): string => {
    const errorStr = (err as { code?: string; message?: string })?.code || '';
    const message = (err as { message?: string })?.message || '';

    if (
      errorStr === 'auth/email-already-in-use' ||
      errorStr === 'email_exists' ||
      message.toLowerCase().includes('already registered') ||
      message.toLowerCase().includes('already exists')
    ) {
      return 'Ya existe una cuenta registrada con este correo. Inicia sesión.';
    }
    if (errorStr === 'auth/invalid-email' || message.toLowerCase().includes('invalid email')) {
      return 'Correo electrónico no válido.';
    }
    if (errorStr === 'auth/weak-password' || message.toLowerCase().includes('password should be')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (message.toLowerCase().includes('rate limit')) {
      return 'Has realizado demasiados intentos. Por favor espera unos minutos.';
    }
    return message || 'Ocurrió un error. Inténtalo de nuevo.';
  };

  // Step 1: Submit email & password
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    if (!isSocialAuth && password.length < 6) {
      setErrorMessage('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setStep(2);
  };

  // Google Signup in Step 1
  const handleGoogleSignup = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setErrorMessage((err as Error)?.message || 'Ocurrió un error al iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit username
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = username.replace('@', '').trim().toLowerCase();
    if (!clean) {
      setErrorMessage('Ingresa un nombre de usuario.');
      return;
    }

    if (clean.length < 3) {
      setErrorMessage('El usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setErrorMessage('Solo letras minúsculas, números y guiones bajos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const taken = await checkUsernameExists(clean);
      if (taken) {
        setErrorMessage('Este usuario ya está en uso. Por favor elige otro.');
        return;
      }
      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Submit Nombre, Apellido, Fecha de nacimiento
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Por favor ingresa tu apellido.');
      return;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      setErrorMessage('Selecciona tu fecha de nacimiento completa (dd/mm/aaaa).');
      return;
    }
    if (calculatedAge === null || calculatedAge < 18) {
      setErrorMessage('Debes tener al menos 18 años cumplidos para registrarte.');
      return;
    }
    if (!originCity) {
      setErrorMessage('Por favor selecciona tu ciudad de origen en Colombia.');
      return;
    }
    if (!currentCity) {
      setErrorMessage('Por favor selecciona tu ciudad actual en España.');
      return;
    }

    setStep(4);
  };

  // Step 4: Handle gallery photo upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('El archivo debe ser una imagen válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Step 4: Finalize registration
  const handleFinalizeRegistration = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const cleanUsername = username.replace('@', '').trim().toLowerCase();
    const formattedBirthDate = `${birthDay.padStart(2, '0')}/${birthMonth.padStart(2, '0')}/${birthYear}`;
    const defaultAvatar = DEFAULT_SILHOUETTE_AVATAR;

    try {
      await registerWithEmail({
        email: email.trim(),
        password: isSocialAuth ? undefined : password,
        username: cleanUsername,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        birthDate: formattedBirthDate,
        age: calculatedAge || 18,
        avatar: avatarPreview || defaultAvatar,
        city: currentCity || 'Madrid',
        originCity: originCity || 'Colombia'
      });
    } catch (err) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="register-view-page"
      className="h-[100dvh] max-h-[100dvh] w-full bg-[#001428] text-white flex flex-col justify-between items-center relative overflow-hidden selection:bg-amber-400 selection:text-neutral-950 px-3 sm:px-4 py-2 sm:py-3.5"
    >
      {/* Background Decorative Ambient Circles */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-72 h-72 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex items-center justify-between shrink-0 z-10">
        <button
          id="btn-back-step"
          type="button"
          onClick={() => {
            if (step > 1) {
              setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
              setErrorMessage(null);
            } else {
              onGoToLogin();
            }
          }}
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white/70 hover:text-white px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>{step === 1 ? 'Iniciar Sesión' : 'Atrás'}</span>
        </button>

        {/* Step Pill Counter */}
        <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-[11px] font-bold text-amber-400">
          Paso {step} de 4
        </div>
      </div>

      {/* Main Content Area (Auto-fits vertical viewport with NO scroll) */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-center items-center flex-1 min-h-0 z-10 py-1 sm:py-2">
        
        {/* Logo (Same size and style as in LoginView) */}
        <div id="register-logo-header" className="flex justify-center items-center mb-3 sm:mb-4 shrink-0">
          <LaTierritaLogo size="lg" className="h-16 sm:h-20 drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="w-full grid grid-cols-4 gap-1.5 mb-2.5 sm:mb-3 shrink-0">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Main Step Card */}
        <div className="w-full bg-[#001c38] border border-white/15 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col justify-start max-h-[calc(100dvh-130px)] overflow-y-auto">
          
          {/* Error Message Box (compact) */}
          {errorMessage && (
            <div className="mb-2 p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1.5 shrink-0 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          {/* =========================================================================
              1. PRIMERA PARTE: Correo, Contraseña, Google/Apple, Términos, Botón Crear cuenta
             ========================================================================= */}
          {step === 1 && (
            <div className="space-y-2 sm:space-y-2.5 animate-in fade-in duration-200">
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">Crear cuenta</h2>
                <p className="text-[11px] text-white/60">Ingresa tu correo y define tu contraseña</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-2 sm:space-y-2.5 text-left">
                
                {/* Correo Electrónico */}
                <div className="space-y-0.5">
                  <label htmlFor="input-reg-email" className="text-[11px] font-bold text-white/80 block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-0.5">
                  <label htmlFor="input-reg-password" className="text-[11px] font-bold text-white/80 block">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-8 pr-9 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* o registrarse con Google */}
                <div className="relative py-0.5 flex items-center justify-center">
                  <div className="w-full border-t border-white/15" />
                  <span className="bg-[#001c38] px-2 text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-wider absolute">
                    o registrarse con
                  </span>
                </div>

                {/* Botón Social: Google */}
                <div>
                  <button
                    id="btn-register-google"
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isSubmitting}
                    className="w-full py-1.5 sm:py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </button>
                </div>

                {/* Mensaje: al registrarte estas aceptando los terminos y condiciones */}
                <div className="pt-0.5 text-center">
                  <p className="text-[10px] text-white/60 leading-tight">
                    Al registrarte estás aceptando los{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium cursor-pointer"
                    >
                      términos y condiciones
                    </button>
                    .
                  </p>
                </div>

                {/* Botón Continuar */}
                <button
                  id="btn-register-step1-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 sm:py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Inicia sesión */}
              <div className="pt-1.5 border-t border-white/10 text-center">
                <p className="text-[11px] text-white/70">
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    id="link-go-to-login"
                    type="button"
                    onClick={onGoToLogin}
                    className="font-black text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Inicia sesión.
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              2. SEGUNDA PARTE: Nombre de usuario (Único ej: @pepito), Botón siguiente
             ========================================================================= */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">Nombre de usuario</h2>
                <p className="text-[11px] text-white/60">
                  Elige tu usuario único en La Tierrita
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label htmlFor="input-reg-username" className="text-[11px] font-bold text-white/80 block">
                    Nombre de usuario (Único ej: @pepito)
                  </label>
                  <div className="relative">
                    <span className="text-amber-400 font-black text-sm absolute left-3 top-1/2 -translate-y-1/2 select-none">
                      @
                    </span>
                    <input
                      id="input-reg-username"
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="pepito"
                      className="w-full pl-8 pr-9 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-white/40 outline-none transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && (
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {usernameStatus === 'available' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Feedback Helper Message */}
                  {usernameMessage && (
                    <div
                      className={`text-[10px] font-semibold flex items-center gap-1 pt-0.5 ${
                        usernameStatus === 'available'
                          ? 'text-emerald-400'
                          : usernameStatus === 'taken' || usernameStatus === 'invalid'
                          ? 'text-rose-400'
                          : 'text-white/60'
                      }`}
                    >
                      {usernameStatus === 'available' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3 shrink-0" />
                      )}
                      <span>{usernameMessage}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-white/40">
                    Solo letras minúsculas (a-z), números (0-9) y guiones bajos (_).
                  </p>
                </div>

                {/* Botón Siguiente */}
                <button
                  id="btn-register-step2-submit"
                  type="submit"
                  disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'invalid' || !username.trim()}
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Siguiente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* =========================================================================
              3. TERCERA PARTE: Nombre, Apellido, Fecha de nacimiento dd/mm/aaaa (Min 18 años)
             ========================================================================= */}
          {step === 3 && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">Datos personales</h2>
                <p className="text-[11px] text-white/60">
                  Cuéntanos cómo te llamas y tu fecha de nacimiento
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-2 text-left">
                
                {/* Nombre y Apellido en grid responsive */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label htmlFor="input-reg-firstname" className="text-[11px] font-bold text-white/80 block">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-reg-firstname"
                        type="text"
                        required
                        autoFocus
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Carlos"
                        className="w-full pl-7 pr-2.5 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label htmlFor="input-reg-lastname" className="text-[11px] font-bold text-white/80 block">
                      Apellido
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-reg-lastname"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Rodríguez"
                        className="w-full pl-7 pr-2.5 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Fecha de nacimiento (Selector de dd/mm/aaaa) Mínimo 18 años */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-white/80 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>Fecha de nacimiento</span>
                    </label>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                      Mín. 18 años
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Selector de Día (dd) */}
                    <div>
                      <select
                        id="select-reg-birth-day"
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        required
                        className="w-full px-1.5 py-1.5 sm:py-2 bg-[#001428] border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white outline-none cursor-pointer text-center"
                      >
                        <option value="" disabled className="bg-[#001428] text-white/40">
                          Día
                        </option>
                        {days.map((d) => (
                          <option key={d} value={d} className="bg-[#001428] text-white">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Mes (mm) */}
                    <div>
                      <select
                        id="select-reg-birth-month"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        required
                        className="w-full px-1 py-1.5 sm:py-2 bg-[#001428] border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white outline-none cursor-pointer text-center"
                      >
                        <option value="" disabled className="bg-[#001428] text-white/40">
                          Mes
                        </option>
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value} className="bg-[#001428] text-white">
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Año (aaaa) */}
                    <div>
                      <select
                        id="select-reg-birth-year"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        required
                        className="w-full px-1.5 py-1.5 sm:py-2 bg-[#001428] border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white outline-none cursor-pointer text-center"
                      >
                        <option value="" disabled className="bg-[#001428] text-white/40">
                          Año
                        </option>
                        {years.map((y) => (
                          <option key={y} value={y} className="bg-[#001428] text-white">
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Real-time Age Validation Badge */}
                  {isAgeValid !== null && (
                    <div
                      className={`text-[10px] font-semibold flex items-center gap-1 p-1.5 rounded-lg mt-1 ${
                        isAgeValid
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {isAgeValid ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Tienes {calculatedAge} años (Mayor de 18)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Debes tener mínimo 18 años cumplidos.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Ciudad Origen (Todas las ciudades de Colombia) */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="select-reg-origin-city" className="text-[11px] font-bold text-white/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>Ciudad Origen</span>
                    </label>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                      🇨🇴 Colombia
                    </span>
                  </div>
                  <div>
                    <select
                      id="select-reg-origin-city"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      required
                      className="w-full px-2 py-1.5 sm:py-2 bg-[#001428] border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#001428] text-white/40">
                        Selecciona tu ciudad de origen en Colombia
                      </option>
                      {COLOMBIAN_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-[#001428] text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ciudad Actual (Todas las ciudades de España) */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="select-reg-current-city" className="text-[11px] font-bold text-white/80 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-400" />
                      <span>Ciudad Actual</span>
                    </label>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                      🇪🇸 España
                    </span>
                  </div>
                  <div>
                    <select
                      id="select-reg-current-city"
                      value={currentCity}
                      onChange={(e) => setCurrentCity(e.target.value)}
                      required
                      className="w-full px-2 py-1.5 sm:py-2 bg-[#001428] border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#001428] text-white/40">
                        Selecciona tu ciudad actual en España
                      </option>
                      {SPANISH_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-[#001428] text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botón Siguiente */}
                <button
                  id="btn-register-step3-submit"
                  type="submit"
                  disabled={!firstName.trim() || !lastName.trim() || !isAgeValid || !originCity || !currentCity}
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* =========================================================================
              4. CUARTA PARTE: Foto de perfil (opcional) (Opción de subir desde galería), Botón Finalizar
             ========================================================================= */}
          {step === 4 && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">Foto de perfil</h2>
                <p className="text-[11px] text-white/60">
                  Agrega una foto (opcional). Puedes subirla desde tu galería.
                </p>
              </div>

              {/* Avatar Upload Container */}
              <div className="flex flex-col items-center justify-center py-2 space-y-2.5">
                
                {/* Avatar Preview Ring */}
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-500 shadow-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={avatarPreview || DEFAULT_SILHOUETTE_AVATAR || undefined}
                      alt="Vista previa de perfil"
                      className="w-full h-full object-cover rounded-full bg-slate-800"
                    />
                  </div>

                  {/* Quick Camera Overlay Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full shadow-md border-2 border-[#001c38] transition-all cursor-pointer hover:scale-110"
                    title="Subir foto desde galería"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hidden File Input for Device Gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload from Gallery Action Buttons */}
                <div className="flex items-center gap-1.5 w-full">
                  <button
                    id="btn-upload-gallery"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 sm:py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>Subir de galería</span>
                  </button>

                  {avatarPreview && (
                    <button
                      id="btn-remove-avatar"
                      type="button"
                      onClick={() => {
                        setAvatarPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="py-1.5 sm:py-2 px-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Quitar foto"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-white/50 text-center">
                  Omitible: podrás configurarla más tarde en tu perfil.
                </p>
              </div>

              {/* Botón Finalizar */}
              <button
                id="btn-register-finalize"
                type="button"
                onClick={handleFinalizeRegistration}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Finalizar</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer Security Badge (compact, fixed at bottom without scrolling) */}
      <div className="shrink-0 text-center flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-white/40 font-medium z-10 py-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>Tus datos están protegidos en la nube de Firebase</span>
      </div>

      {/* =========================================================================
          MODAL: Términos y Condiciones
         ========================================================================= */}
      {showTermsModal && (
        <div
          id="modal-terms-conditions"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#001c38] border border-white/20 rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl relative text-left max-h-[80vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-black text-white">Términos y Condiciones</h3>
            </div>

            <div className="overflow-y-auto space-y-2 text-xs text-white/70 pr-2 leading-relaxed flex-1">
              <p>
                Bienvenido a <strong className="text-white">La Tierrita</strong>. Al registrarte y utilizar nuestra plataforma, aceptas cumplir con los siguientes términos:
              </p>
              <p>
                <strong className="text-white">1. Requisitos de edad:</strong> Debes tener al menos 18 años para registrarte y utilizar esta plataforma comunitaria.
              </p>
              <p>
                <strong className="text-white">2. Respeto y Convivencia:</strong> Promovemos un espacio seguro y solidario entre colombianos e hispanohablantes en España. No se tolerará acoso, discriminación, spam ni conductas inapropiadas.
              </p>
              <p>
                <strong className="text-white">3. Privacidad y Seguridad:</strong> Tus datos de acceso e información personal son almacenados de forma segura con encriptación en Google Cloud Firestore y Firebase Auth.
              </p>
              <p>
                <strong className="text-white">4. Uso de la cuenta:</strong> Eres responsable de mantener la confidencialidad de tu contraseña y de las actividades realizadas en tu perfil.
              </p>
            </div>

            <div className="pt-3 mt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
