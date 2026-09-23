import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LaTierritaLogo } from './LaTierritaLogo';
import { TICKET_CATEGORIES } from '../data/ticketData';
import {
  X,
  Lock,
  UserX,
  CheckCircle,
  Bell,
  Volume2,
  Info,
  HelpCircle,
  Flag,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Play,
  AlertTriangle,
  Send,
  Sliders,
  Check
} from 'lucide-react';

type SettingsSubView =
  | 'menu'
  | 'privacy'
  | 'blocked'
  | 'verification'
  | 'tones'
  | 'more_info'
  | 'support'
  | 'report'
  | 'staff_auth';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentUser,
    updateProfile,
    blockedUserIds,
    unblockUser,
    isStaffMode,
    setIsStaffMode,
    setIsStaffAdminOpen,
    triggerPlushNotification,
    openReportModal,
    createSupportTicket,
    setActiveTab,
    setChatTypeTab
  } = useApp();
  const { logout, deleteAccount } = useAuth();

  const [subView, setSubView] = useState<SettingsSubView>('menu');

  // Subview states
  // 1. Privacidad
  const [isPrivateAccount, setIsPrivateAccount] = useState(currentUser.isPrivateAccount || false);
  const [allowDirectMessages, setAllowDirectMessages] = useState('everyone'); // 'everyone' | 'following'
  const [showActiveStatus, setShowActiveStatus] = useState(true);

  // 3. Verificación
  const [verificationName, setVerificationName] = useState('');
  const [verificationCategory, setVerificationCategory] = useState('Emprendimiento Colombiano');
  const [verificationDocUrl, setVerificationDocUrl] = useState('');
  const [verificationReason, setVerificationReason] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  // 4. Tonos
  const [selectedTone, setSelectedTone] = useState(currentUser.notificationTone || 'Alegre Campesino (Bambuco)');
  const NOTIFICATION_TONES = [
    { id: 'bambuco', name: 'Alegre Campesino (Bambuco)', freq: [523.25, 659.25, 783.99] },
    { id: 'tiple', name: 'Tiple Andino', freq: [440, 554.37, 659.25] },
    { id: 'cumbia', name: 'Cumbia Suave', freq: [392, 493.88, 587.33] },
    { id: 'chime', name: 'Chime Moderno', freq: [587.33, 880, 1174.66] },
    { id: 'campanilla', name: 'Campanilla Sutil', freq: [698.46, 880] },
    { id: 'silencio', name: 'Silencioso', freq: [] }
  ];

  // 6. Soporte (TS)
  const [selectedTSOptionIdx, setSelectedTSOptionIdx] = useState<number>(0);
  const [tsAdditionalDetails, setTsAdditionalDetails] = useState('');
  const [createdTsCode, setCreatedTsCode] = useState<string | null>(null);
  const [supportSent, setSupportSent] = useState(false);

  // 7. Reportar
  const [reportIssue, setReportIssue] = useState('');
  const [reportCategory, setReportCategory] = useState('Problema técnico o fallo en la app');
  const [reportSent, setReportSent] = useState(false);

  // 8. Staff Auth
  const [staffPin, setStaffPin] = useState('');
  const [staffPinError, setStaffPinError] = useState(false);

  // 9. Cerrar sesión confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 10. Eliminar cuenta confirmation
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  if (!isSettingsOpen) return null;

  // Reproducir sonido sintetizado con Web Audio API para previsualizar tono
  const playTonePreview = (freqs: number[]) => {
    if (!freqs || freqs.length === 0) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch {
      // Ignorar si el audio no está disponible
    }
  };

  const handleClose = () => {
    setIsSettingsOpen(false);
    setSubView('menu');
    setShowLogoutConfirm(false);
    setShowDeleteAccountConfirm(false);
  };

  const handleSavePrivacy = () => {
    updateProfile({ isPrivateAccount });
    triggerPlushNotification({
      type: 'system',
      title: 'Privacidad actualizada',
      message: `Tu cuenta ahora es ${isPrivateAccount ? 'privada' : 'pública'}.`
    });
    setSubView('menu');
  };

  const handleSelectTone = (toneName: string, freqs: number[]) => {
    setSelectedTone(toneName);
    updateProfile({ notificationTone: toneName });
    playTonePreview(freqs);
    triggerPlushNotification({
      type: 'system',
      title: 'Tono seleccionado',
      message: `Tono de notificación cambiado a "${toneName}".`
    });
  };

  const handleSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationName.trim()) return;
    setVerificationSent(true);
    triggerPlushNotification({
      type: 'system',
      title: 'Solicitud enviada',
      message: 'Tu solicitud de verificación fue remitida al equipo directivo de La Tierrita.'
    });
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const tsOption = TICKET_CATEGORIES.TS.options[selectedTSOptionIdx] || TICKET_CATEGORIES.TS.options[0];
    try {
      const code = await createSupportTicket(
        'TS',
        tsOption.title,
        tsOption.text,
        'Alta',
        {
          reportedUsername: 'N/A (Soporte Técnico)',
          reasonTitle: tsOption.title,
          reasonText: tsOption.text,
          additionalDetails: tsAdditionalDetails.trim()
        }
      );
      setCreatedTsCode(code);
      setSupportSent(true);
      triggerPlushNotification({
        type: 'system',
        title: `Ticket Creado (${code})`,
        message: 'Se ha creado un chat privado en tu bandeja con la información de tu ticket.'
      });
    } catch (err) {
      console.error('Failed to create support ticket:', err);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClose();
    openReportModal({
      id: `report-app-${Date.now()}`,
      type: 'support',
      title: 'Aplicación La Tierrita (Reporte General)'
    });
  };

  const handleStaffUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffPin === '2025' || staffPin.toLowerCase() === 'staff' || staffPin === 'latierrita') {
      setIsStaffMode(true);
      setIsSettingsOpen(false);
      setIsStaffAdminOpen(true);
      triggerPlushNotification({
        type: 'system',
        title: 'Acceso STAFF Concedido',
        message: 'Panel de administración publicitaria y control comunitario activado.'
      });
    } else {
      setStaffPinError(true);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsSettingsOpen(false);
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Sesión finalizada',
      message: 'Has cerrado sesión exitosamente. Hasta pronto, parcero.'
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'ELIMINAR') return;
    setShowDeleteAccountConfirm(false);
    setIsSettingsOpen(false);
    try {
      await deleteAccount('Solicitud voluntaria de eliminación');
    } catch (e) {
      console.error(e);
      await logout();
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta en período de retención (7 días)',
      message: 'Tu cuenta ha sido desactivada. Tu información y nombre de usuario estarán guardados y reservados por 7 días por si deseas recuperarla.'
    });
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#001845] text-white flex flex-col w-full h-full overflow-hidden animate-fade-in"
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-2xl mx-auto bg-[#001845] dark:bg-neutral-900 border-x border-white/10 flex flex-col h-full shadow-2xl"
      >
        {/* Header compacto */}
        <div className="sticky top-0 z-20 px-4 py-3 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            {subView !== 'menu' ? (
              <button
                id="btn-settings-back"
                onClick={() => setSubView('menu')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white/90 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            ) : (
              <Sliders className="w-4 h-4 text-amber-400" />
            )}
            <h3 className="text-xs sm:text-sm font-black text-white">
              {subView === 'menu' && 'Configuración y Opciones'}
              {subView === 'privacy' && 'Privacidad de la cuenta'}
              {subView === 'blocked' && 'Cuentas bloqueadas'}
              {subView === 'verification' && 'Solicitar verificación'}
              {subView === 'tones' && 'Tonos de notificación'}
              {subView === 'more_info' && 'Más información'}
              {subView === 'support' && 'Soporte y Ayuda'}
              {subView === 'report' && 'Reportar un problema'}
              {subView === 'staff_auth' && 'Administración STAFF'}
            </h3>
          </div>
          <button
            id="btn-settings-close"
            onClick={handleClose}
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Cerrar configuración"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENIDO COMPRIMIDO */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 no-scrollbar space-y-1.5 pb-20">
          {/* ================================================================
              VISTA PRINCIPAL: MENÚ COMPRIMIDO (10 OPCIONES)
              ================================================================ */}
          {subView === 'menu' && (
            <div className="space-y-1">
              {/* 1. Privacidad de la cuenta */}
              <button
                id="opt-privacy"
                onClick={() => setSubView('privacy')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Privacidad de la cuenta
                    </span>
                    <span className="text-[10px] text-white/60">
                      Cuenta pública/privada y visibilidad
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Cuentas bloqueadas */}
              <button
                id="opt-blocked"
                onClick={() => setSubView('blocked')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                    <UserX className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Cuentas bloqueadas
                    </span>
                    <span className="text-[10px] text-white/60">
                      {blockedUserIds.length} usuarios bloqueados
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Solicitar verificación */}
              <button
                id="opt-verification"
                onClick={() => setSubView('verification')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Solicitar verificación
                    </span>
                    <span className="text-[10px] text-white/60">
                      Obtener insignia de perfil verificado
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 4. Tonos de notificación */}
              <button
                id="opt-tones"
                onClick={() => setSubView('tones')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Tonos de notificación
                    </span>
                    <span className="text-[10px] text-white/60 truncate max-w-[200px] block">
                      {selectedTone}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 5. Más información */}
              <button
                id="opt-more-info"
                onClick={() => setSubView('more_info')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Más información
                    </span>
                    <span className="text-[10px] text-white/60">
                      Términos, privacidad y versión v2.4
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 6. Soporte */}
              <button
                id="opt-support"
                onClick={() => setSubView('support')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Soporte
                    </span>
                    <span className="text-[10px] text-white/60">
                      Centro de ayuda y contacto directo
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 7. Reportar */}
              <button
                id="opt-report"
                onClick={() => setSubView('report')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Flag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Reportar
                    </span>
                    <span className="text-[10px] text-white/60">
                      Informar de un fallo o infracción
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <div className="pt-1.5 border-t border-white/15 my-1" />

              {/* 9. Cerrar sesión */}
              <button
                id="opt-logout"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-white/80 flex items-center justify-center shrink-0">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    Cerrar sesión
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 10. Eliminar Cuenta */}
              <button
                id="opt-delete-account"
                onClick={() => setShowDeleteAccountConfirm(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-500/20 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-400 block">
                      Eliminar Cuenta
                    </span>
                    <span className="text-[10px] text-rose-300/70">
                      Borrado irreversible de perfil y publicaciones
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* ================================================================
              1. SUBVIEW: PRIVACIDAD DE LA CUENTA
              ================================================================ */}
          {subView === 'privacy' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-blue-500/15 border border-blue-500/30 rounded-xl text-xs text-blue-200 leading-relaxed">
                Controla quién puede ver tus fotos, publicaciones y enviarte mensajes directos en La Tierrita España.
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Cuenta privada
                  </span>
                  <span className="text-[10px] text-white/60 block max-w-[240px]">
                    Si tu cuenta es privada, solo las personas que apruebes podrán ver tus publicaciones.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivateAccount}
                    onChange={e => setIsPrivateAccount(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              <div className="space-y-1 p-2.5 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white block">
                  Quién puede enviarte mensajes privados
                </span>
                <div className="space-y-1 pt-1">
                  <label className="flex items-center gap-2 text-xs text-white/90 cursor-pointer">
                    <input
                      type="radio"
                      name="dm_privacy"
                      checked={allowDirectMessages === 'everyone'}
                      onChange={() => setAllowDirectMessages('everyone')}
                      className="text-amber-400 focus:ring-amber-400"
                    />
                    <span>Cualquier colombiano de la comunidad</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/90 cursor-pointer">
                    <input
                      type="radio"
                      name="dm_privacy"
                      checked={allowDirectMessages === 'following'}
                      onChange={() => setAllowDirectMessages('following')}
                      className="text-amber-400 focus:ring-amber-400"
                    />
                    <span>Solo personas a las que sigues</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Mostrar estado de actividad
                  </span>
                  <span className="text-[10px] text-white/60 block max-w-[240px]">
                    Permite que otros parceros vean cuando estás activo en los chats.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showActiveStatus}
                    onChange={e => setShowActiveStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              <button
                onClick={handleSavePrivacy}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black rounded-xl shadow-md transition-all"
              >
                Guardar preferencias de privacidad
              </button>
            </div>
          )}

          {/* ================================================================
              2. SUBVIEW: CUENTAS BLOQUEADAS
              ================================================================ */}
          {subView === 'blocked' && (
            <div className="space-y-3">
              <p className="text-xs text-white/70">
                Las cuentas que bloquees no podrán ver tu perfil, tus historias ni enviarte mensajes directos.
              </p>

              {blockedUserIds.length === 0 ? (
                <div className="p-6 text-center bg-white/5 rounded-xl border border-white/10">
                  <UserX className="w-7 h-7 text-white/40 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">
                    No tienes cuentas bloqueadas
                  </p>
                  <p className="text-[10px] text-white/60 mt-0.5">
                    Si alguien te molesta en la app, puedes bloquearlo desde su perfil o chat.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUserIds.map(uid => (
                    <div
                      key={uid}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">
                          {uid.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Usuario ID: {uid}
                          </span>
                          <span className="text-[10px] text-rose-400 font-medium">Bloqueado</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          unblockUser(uid);
                          triggerPlushNotification({
                            type: 'system',
                            title: 'Usuario desbloqueado',
                            message: `Has desbloqueado al usuario ${uid}.`
                          });
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        Desbloquear
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              3. SUBVIEW: SOLICITAR VERIFICACIÓN
              ================================================================ */}
          {subView === 'verification' && (
            <div>
              {currentUser.isVerified ? (
                <div className="p-5 text-center bg-blue-500/20 rounded-xl border border-blue-500/40 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-400 text-neutral-950 flex items-center justify-center mx-auto text-lg font-black">
                    ✓
                  </div>
                  <h4 className="text-xs font-black text-blue-200">
                    ¡Tu perfil ya está verificado!
                  </h4>
                  <p className="text-[11px] text-blue-200/80">
                    Cuentas con la insignia oficial azul de La Tierrita para la comunidad colombiana en España.
                  </p>
                </div>
              ) : verificationSent ? (
                <div className="p-5 text-center bg-emerald-500/20 rounded-xl border border-emerald-500/40 space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-xs font-black text-emerald-200">
                    Solicitud en revisión
                  </h4>
                  <p className="text-[11px] text-emerald-200/80">
                    El equipo administrativo revisará tu documentación y te notificará en un plazo de 48 a 72 horas.
                  </p>
                  <button
                    onClick={() => setSubView('menu')}
                    className="mt-2 px-3 py-1.5 bg-emerald-400 text-neutral-950 text-xs font-bold rounded-xl"
                  >
                    Volver a Configuración
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendVerification} className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[10px] text-amber-200">
                      La insignia verificada confirma la autenticidad de emprendedores, creadores y figuras colombianas en España.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/70">Nombre legal o del negocio</label>
                    <input
                      type="text"
                      required
                      value={verificationName}
                      onChange={e => setVerificationName(e.target.value)}
                      placeholder="ej. Juan Camilo Ospina o Arepas Mi Tierra"
                      className="w-full px-3 py-2 text-xs bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/70">Categoría</label>
                    <select
                      value={verificationCategory}
                      onChange={e => setVerificationCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#002466] text-white rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="Emprendimiento Colombiano">Emprendimiento o Empresa Colombiana</option>
                      <option value="Gastronomía / Restaurante">Gastronomía / Restaurante</option>
                      <option value="Creador de Contenido">Creador de Contenido / Influencer</option>
                      <option value="Profesional / Servicios">Profesional (Abogado, Asesor, Médico)</option>
                      <option value="Organización Comunitaria">Organización o Colectivo Cultural</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/70">Documento de respaldo o enlace oficial</label>
                    <input
                      type="text"
                      value={verificationDocUrl}
                      onChange={e => setVerificationDocUrl(e.target.value)}
                      placeholder="Enlace a web oficial, registro de autónomo o Instagram"
                      className="w-full px-3 py-2 text-xs bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/70">Motivo de la solicitud</label>
                    <textarea
                      rows={2}
                      value={verificationReason}
                      onChange={e => setVerificationReason(e.target.value)}
                      placeholder="Explica brevemente por qué tu perfil debe ser verificado..."
                      className="w-full px-3 py-2 text-xs bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all"
                  >
                    Enviar Solicitud de Verificación
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================================================================
              4. SUBVIEW: TONOS DE NOTIFICACIÓN
              ================================================================ */}
          {subView === 'tones' && (
            <div className="space-y-3">
              <p className="text-xs text-white/70">
                Elige el tono que sonará al recibir mensajes en tus chats de parceros y notificaciones en La Tierrita:
              </p>

              <div className="space-y-1.5">
                {NOTIFICATION_TONES.map(tone => {
                  const isSelected = selectedTone === tone.name;
                  return (
                    <div
                      key={tone.id}
                      onClick={() => handleSelectTone(tone.name, tone.freq)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border border-purple-400/50'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-purple-500 text-white font-bold'
                              : 'bg-white/10 text-white/70'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs ${isSelected ? 'font-black text-purple-200' : 'font-semibold text-white'}`}>
                          {tone.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {tone.freq.length > 0 && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              playTonePreview(tone.freq);
                            }}
                            className="p-1.5 text-white/70 hover:text-purple-300 rounded-lg hover:bg-white/10"
                            title="Probar sonido"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-purple-400 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
              5. SUBVIEW: MÁS INFORMACIÓN
              ================================================================ */}
          {subView === 'more_info' && (
            <div className="space-y-3 text-xs text-white/90 leading-relaxed">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className="text-base font-black text-amber-300 block">
                  La Tierrita
                </span>
                <span className="text-[10px] font-bold text-white/60">
                  Versión 2.4.0 (Edición España)
                </span>
              </div>

              <div className="space-y-1 p-3 bg-white/5 rounded-xl border border-white/10">
                <h5 className="font-extrabold text-white">Sobre La Tierrita</h5>
                <p className="text-[11px] text-white/70">
                  La Tierrita es la plataforma social y comunitaria creada para conectar y apoyar a los más de 500.000 colombianos que residen, estudian y emprenden en España.
                </p>
              </div>

              <div className="space-y-1 p-3 bg-white/5 rounded-xl border border-white/10">
                <h5 className="font-extrabold text-white">Normas Comunitarias</h5>
                <p className="text-[11px] text-white/70">
                  Promovemos la fraternidad, la empatía y la solidaridad. Queda terminantemente prohibido el acoso, los discursos de odio y el contenido no autorizado.
                </p>
              </div>

              <div className="space-y-1 p-3 bg-white/5 rounded-xl border border-white/10">
                <h5 className="font-extrabold text-white">Privacidad y Protección de Datos</h5>
                <p className="text-[11px] text-white/70">
                  Cumplimos con el RGPD de la Unión Europea. Todos los mensajes de chats cuentan con cifrado simétrico verificable.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================
              6. SUBVIEW: SOPORTE (TS)
              ================================================================ */}
          {subView === 'support' && (
            <div className="space-y-3">
              {supportSent ? (
                <div className="p-5 text-center bg-indigo-500/20 rounded-2xl border border-indigo-500/40 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 text-indigo-300 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">Ticket Creado</span>
                    <h4 className="text-base font-black text-white font-mono">
                      {createdTsCode || 'TS-0001'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-indigo-100/80 leading-relaxed max-w-xs mx-auto">
                    Se ha creado una conversación privada en tu bandeja con la etiqueta <span className="font-mono font-bold text-amber-300">{createdTsCode}</span>.
                  </p>
                  <div className="p-2 bg-indigo-950/50 rounded-xl border border-indigo-400/20 text-[10px] text-indigo-200 text-left">
                    🔒 <strong>Nota:</strong> El chat se encuentra en espera. Un miembro del equipo de Staff (Admin o Soporte) tomará tu caso para habilitar los mensajes.
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSupportSent(false);
                        setTsAdditionalDetails('');
                        setSelectedTSOptionIdx(0);
                        setSubView('menu');
                      }}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        setChatTypeTab('messages');
                        setActiveTab('chats');
                      }}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black rounded-xl transition-all shadow-md"
                    >
                      Ir al Chat
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendSupport} className="space-y-3">
                  <p className="text-xs text-white/80">
                    Selecciona el motivo de tu consulta para abrir un ticket de soporte directo con nuestro equipo:
                  </p>

                  <div className="space-y-2">
                    {TICKET_CATEGORIES.TS.options.map((opt, idx) => {
                      const isSelected = selectedTSOptionIdx === idx;
                      return (
                        <label
                          key={idx}
                          onClick={() => setSelectedTSOptionIdx(idx)}
                          className={`block p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="tsOption"
                              checked={isSelected}
                              onChange={() => setSelectedTSOptionIdx(idx)}
                              className="mt-0.5 accent-amber-400 cursor-pointer"
                            />
                            <div>
                              <span className={`text-xs font-black block ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                                {opt.title}
                              </span>
                              <span className="text-[11px] text-white/60 block mt-0.5">
                                {opt.text}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-white/70">
                        Detalles adicionales <span className="text-white/40">(Opcional)</span>
                      </label>
                      <span className="text-[10px] font-mono text-white/40">
                        {tsAdditionalDetails.length}/250
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={250}
                      value={tsAdditionalDetails}
                      onChange={e => setTsAdditionalDetails(e.target.value)}
                      placeholder="Breve explicación de máximo 250 caracteres..."
                      className="w-full px-3 py-2 text-xs bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Crear Ticket de Soporte (TS)</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================================================================
              7. SUBVIEW: REPORTAR
              ================================================================ */}
          {subView === 'report' && (
            <div className="space-y-3">
              {reportSent ? (
                <div className="p-5 text-center bg-amber-500/20 rounded-xl border border-amber-500/40 space-y-2">
                  <CheckCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-xs font-black text-amber-200">
                    Reporte Registrado
                  </h4>
                  <p className="text-[11px] text-amber-200/80">
                    Gracias por ayudarnos a mantener segura y limpia la comunidad.
                  </p>
                  <button
                    onClick={() => {
                      setReportSent(false);
                      setReportIssue('');
                      setSubView('menu');
                    }}
                    className="mt-2 px-3 py-1.5 bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl"
                  >
                    Volver
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReport} className="space-y-3">
                  <p className="text-xs text-white/70">
                    Si experimentas algún fallo técnico, error visual o comportamiento indebido en la app, repórtalo aquí:
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/70">Categoría del problema</label>
                    <select
                      value={reportCategory}
                      onChange={e => setReportCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#002466] text-white rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="Problema técnico o fallo en la app">Problema técnico o fallo en la app</option>
                      <option value="Publicación inapropiada o estafa">Publicación inapropiada o estafa</option>
                      <option value="Problema con el chat o mensajes">Problema con el chat o mensajes</option>
                      <option value="Otro asunto">Otro asunto</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/70">Descripción detallada</label>
                    <textarea
                      rows={3}
                      required
                      value={reportIssue}
                      onChange={e => setReportIssue(e.target.value)}
                      placeholder="Explica qué sucedió para solucionarlo..."
                      className="w-full px-3 py-2 text-xs bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Enviar Reporte</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================================================================
              8. SUBVIEW: STAFF AUTH PIN
              ================================================================ */}
          {subView === 'staff_auth' && (
            <form onSubmit={handleStaffUnlock} className="space-y-3.5 text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-400/30">
                <Shield className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-black text-white">Acceso de Administración STAFF</h4>
                <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                  Introduce el PIN de seguridad o clave de staff para desbloquear el panel de control publicitario y comunitario.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <input
                  type="password"
                  maxLength={12}
                  value={staffPin}
                  onChange={e => {
                    setStaffPin(e.target.value);
                    setStaffPinError(false);
                  }}
                  placeholder="PIN de Staff (ej. 2025)"
                  className="w-full text-center tracking-widest text-base font-bold py-2.5 bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                {staffPinError && (
                  <p className="text-[11px] text-rose-400 font-bold">
                    PIN incorrecto. Prueba con "2025" o "staff".
                  </p>
                )}
              </div>

              <div className="max-w-xs mx-auto pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all"
                >
                  Verificar y Entrar al Panel Staff
                </button>
              </div>
            </form>
          )}

          {/* ================================================================
              CONFIRMACIÓN DE CIERRE DE SESIÓN
              ================================================================ */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-xs bg-[#002466] border border-white/20 rounded-2xl p-5 shadow-2xl text-white space-y-4 text-center">
                <div className="w-10 h-10 rounded-full bg-white/10 text-amber-400 flex items-center justify-center mx-auto">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">¿Cerrar sesión en La Tierrita?</h4>
                  <p className="text-[11px] text-white/70 mt-1">
                    Tendrás que volver a iniciar sesión cuando regreses.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 font-bold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              CONFIRMACIÓN DE ELIMINAR CUENTA
              ================================================================ */}
          {showDeleteAccountConfirm && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#002466] border border-rose-500/50 rounded-2xl p-5 shadow-2xl text-white space-y-4 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-400">¿Solicitar desactivación y eliminación?</h4>
                  <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                    Tu cuenta será desactivada y se mantendrá guardada en un <strong className="text-amber-300">período de retención de 7 días</strong> para que puedas recuperarla si lo necesitas. Durante este tiempo tu nombre de usuario seguirá reservado. Pasados los 7 días, se eliminará de forma definitiva. Escribe <strong className="text-white">ELIMINAR</strong> para confirmar:
                  </p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={e => setDeleteConfirmationText(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  className="w-full text-center text-xs font-bold py-2 bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowDeleteAccountConfirm(false);
                      setDeleteConfirmationText('');
                    }}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 font-bold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={deleteConfirmationText !== 'ELIMINAR'}
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-black text-xs rounded-xl"
                  >
                    Borrar cuenta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
