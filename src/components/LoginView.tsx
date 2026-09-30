import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LaTierritaLogo } from './LaTierritaLogo';
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  ShieldCheck
} from 'lucide-react';

interface LoginViewProps {
  onGoToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGoToRegister }) => {
  const {
    loginWithEmailOrUsername,
    loginWithGoogle,
    resetPassword,
    continueAsGuest
  } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuestTerms, setShowGuestTerms] = useState(false);

  // Forgot Password Dialog Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const parseFirebaseError = (err: unknown): string => {
    const errorStr = (err as { code?: string; message?: string })?.code || '';
    switch (errorStr) {
      case 'auth/username-not-found':
        return 'No existe ninguna cuenta con ese nombre de usuario.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido inhabilitada temporalmente.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Credenciales incorrectas. Verifica tu correo/usuario y contraseña.';
      case 'auth/wrong-password':
        return 'La contraseña ingresada no es correcta.';
      case 'auth/popup-closed-by-user':
        return 'Se canceló la ventana de autenticación.';
      case 'auth/operation-not-allowed':
      case 'auth/unauthorized-domain':
        return 'Este método de acceso aún no está habilitado en Firebase.';
      default:
        return (err as { message?: string })?.message || 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Ingresa tu correo o usuario y tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmailOrUsername(identifier, password);
    } catch (err) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess('¡Listo! Hemos enviado el enlace para restablecer tu contraseña.');
    } catch (err) {
      setForgotError(parseFirebaseError(err));
    } finally {
      setForgotLoading(false);
    }
  };

  if (showGuestTerms) {
    return (
      <div
        id="guest-terms-page"
        className="h-screen h-[100dvh] w-full bg-[#001428] text-white flex flex-col justify-center items-center overflow-hidden relative selection:bg-amber-400 selection:text-neutral-950 px-4 py-3"
      >
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm sm:max-w-md bg-[#001c38] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative z-10 flex flex-col max-h-[90vh]">
          <div className="text-center mb-4 shrink-0">
            <LaTierritaLogo size="sm" className="h-10 sm:h-12 mx-auto mb-2" />
            <h2 className="text-base sm:text-lg font-black text-amber-400 flex items-center justify-center gap-1.5">
              <span>Ingresar como Invitado 👤</span>
            </h2>
            <p className="text-[11px] text-white/60 mt-1">
              Conoce las condiciones y limitaciones de tu cuenta temporal
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs leading-relaxed text-white/80 scrollbar-thin">
            {/* Expiration Note */}
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 font-medium">
              <span className="font-bold block mb-1">🕒 Asignación y Caducidad:</span>
              Al ingresar se te asignará un usuario temporal aleatorio con formato <strong>User-000000</strong> (6 dígitos). Este nombre de usuario <strong>caducará al tercer día</strong>. Si después de ese tiempo no deseas registrarte, podrás volver a ingresar como invitado y se te asignará un nuevo nombre de usuario.
            </div>

            {/* Section Breakdown of Limitations */}
            <div className="space-y-3">
              {/* Inicio */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-amber-400 text-xs block mb-1">🏠 En Inicio:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-emerald-400">
                    <span className="font-bold">✓</span>
                    <span className="text-white/80">Podrás ver todo el contenido publicado en esta sección (publicaciones e historias).</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás comentar o dar like a ninguna publicación o historia.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">Tampoco podrás visitar ningún perfil desde esta sección.</span>
                  </li>
                </ul>
              </div>

              {/* Chats */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-sky-400 text-xs block mb-1">💬 En Bandeja de Chats:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-emerald-400">
                    <span className="font-bold">✓</span>
                    <span className="text-white/80">Tendrás acceso y podrás participar en el <strong>Chat General</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No tendrás acceso al chat por ciudad (ya que no estás registrado).</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás iniciar chats privados.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás ingresar o crear grupos de chat.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">Tampoco podrás visitar ningún perfil desde esta sección.</span>
                  </li>
                </ul>
              </div>

              {/* Notificaciones */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-purple-400 text-xs block mb-1">🔔 En Notificaciones:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No tendrás acceso (no recibirás notificaciones ya que no estás registrado).</span>
                  </li>
                </ul>
              </div>

              {/* Explorar */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-emerald-400 text-xs block mb-1">🔍 En Explorar:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-emerald-400">
                    <span className="font-bold">✓</span>
                    <span className="text-white/80">Podrás ver todo el contenido publicado en esa sección.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás comentar o dar like a ninguna publicación.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás buscar usuarios en la barra de búsqueda.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">Tampoco podrás visitar ningún perfil desde esta sección.</span>
                  </li>
                </ul>
              </div>

              {/* Perfil */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-indigo-400 text-xs block mb-1">👤 En Perfil:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-emerald-400">
                    <span className="font-bold">✓</span>
                    <span className="text-white/80">Tendrás un perfil temporal asignado por tres días.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás editar el perfil, ya que es de usuario invitado.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás publicar publicaciones ni historias.</span>
                  </li>
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">Nadie podrá seguir a este usuario ni tú seguirás a @latierrita_app.</span>
                  </li>
                </ul>
              </div>

              {/* Anuncios */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-amber-400 text-xs block mb-1">📢 En Anuncios:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás ver ni publicar anuncios clasificados.</span>
                  </li>
                </ul>
              </div>

              {/* Lugares */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5">
                <span className="font-extrabold text-teal-400 text-xs block mb-1">📍 En Lugares:</span>
                <ul className="space-y-1 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5 text-rose-400">
                    <span className="font-bold">✗</span>
                    <span className="text-white/65">No podrás ver lugares ni sugerir sitios en la app.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 mt-4 shrink-0 font-sans">
            <button
              type="button"
              onClick={() => setShowGuestTerms(false)}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer text-center"
            >
              Regresar
            </button>
            <button
              type="button"
              onClick={() => continueAsGuest()}
              className="py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer text-center shadow-lg"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="login-view-page"
      className="h-screen h-[100dvh] w-full bg-[#001428] text-white flex flex-col justify-center items-center overflow-hidden relative selection:bg-amber-400 selection:text-neutral-950 px-4 py-3"
    >
      {/* Background Decorative Ambient Circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Main Container - Centered and fully contained with NO scroll */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-center items-center relative z-10 my-auto">
        
        {/* 1. Logo Centrado (SIN texto de La Tierrita ESCO ni descripción) */}
        <div id="login-logo-header" className="flex justify-center items-center mb-4 sm:mb-5">
          <LaTierritaLogo size="lg" className="h-16 sm:h-20 drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
        </div>

        {/* 2. Formulario de Inicio de Sesión */}
        <div className="w-full bg-[#001c38] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          
          <div className="mb-3.5 sm:mb-4 text-left">
            <h2 className="text-base sm:text-lg font-black text-white">Iniciar Sesión</h2>
          </div>

          {/* Feedback error message */}
          {errorMessage && (
            <div className="mb-3 p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
            
            {/* Correo electrónico o usuario */}
            <div className="space-y-1 text-left">
              <label htmlFor="input-login-identifier" className="text-xs font-bold text-white/80 block">
                Correo electrónico o usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="ejemplo@correo.com o tu_usuario"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-white placeholder-white/40 transition-all outline-none"
                />
              </div>
            </div>

            {/* Contraseña con diálogo de ¿Olvidaste tu contraseña? */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="input-login-password" className="text-xs font-bold text-white/80">
                  Contraseña
                </label>
                <button
                  id="btn-trigger-forgot-dialog"
                  type="button"
                  onClick={() => {
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setForgotError(null);
                    setForgotSuccess(null);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña secreta"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-white placeholder-white/40 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Iniciar sesión */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* o conéctate con */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="w-full border-t border-white/15" />
              <span className="bg-[#001c38] px-2.5 text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider absolute">
                o conéctate con
              </span>
            </div>

            {/* Botón Social: Google */}
            <div>
              <button
                id="btn-social-google"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

            {/* Botón Invitado: Ingresar como invitado */}
            <div className="pt-0.5">
              <button
                id="btn-login-guest"
                type="button"
                onClick={() => setShowGuestTerms(true)}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 hover:text-amber-300 border border-white/10 rounded-2xl text-xs sm:text-sm font-black text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <User className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Ingresar como Invitado</span>
              </button>
            </div>

          </form>

          {/* 3. ¿Aún no tienes cuenta? Crear una. (Lleva a la página de registro) */}
          <div className="mt-4 pt-3.5 border-t border-white/10 text-center">
            <p className="text-xs text-white/70">
              ¿Aún no tienes cuenta?{' '}
              <button
                id="link-go-to-register"
                type="button"
                onClick={onGoToRegister}
                className="font-black text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer transition-colors"
              >
                Crear una.
              </button>
            </p>
          </div>

        </div>

        {/* Footer Security Badge */}
        <div className="mt-3 text-center flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-white/40 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticación cifrada y segura</span>
        </div>

      </div>

      {/* =========================================================================
          MODAL: Diálogo de ¿Olvidaste tu contraseña?
         ========================================================================= */}
      {showForgotModal && (
        <div
          id="modal-forgot-password"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#001c38] border border-white/20 rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 mb-3.5">
              <h3 className="text-sm sm:text-base font-black text-white">¿Olvidaste tu contraseña?</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Ingresa el correo electrónico asociado a tu cuenta para restablecerla.
              </p>
            </div>

            {forgotError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/80 block">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="tu_correo@ejemplo.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-2 px-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-1/2 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Enviar enlace</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
