import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Trash2,
  Megaphone,
  Upload,
  Image as ImageIcon,
  Users,
  Shield,
  HelpCircle,
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Lock,
  Search,
  ExternalLink,
  Sliders,
  Check,
  MessageSquare,
  Sparkles,
  ChevronRight,
  UserCheck,
  UserX,
  BadgeCheck,
  Eye,
  Clock,
  Key,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  AtSign,
  Save,
  RefreshCw,
  UserPlus,
  Edit3,
  ShieldAlert,
  Send,
  ArrowLeft
} from 'lucide-react';
import { AdCategory, StaffRole, TicketType, UserProfile, SpanishCity, SupportTicket } from '../types';
import { SPANISH_CITIES } from '../data/citiesData';
import { optimizeBannerImage } from '../lib/imageOptimizer';

export const StaffAdminModal: React.FC<{ isFullScreenRoute?: boolean }> = ({ isFullScreenRoute }) => {
  const {
    isStaffAdminOpen,
    setIsStaffAdminOpen,
    isStaffMode,
    setIsStaffMode,
    adBanners,
    refreshBanners,
    addAdBanner,
    deleteAdBanner,
    addStaffPost,
    deleteStaffPost,
    posts,
    otherUsers,
    currentUser,
    supportTickets,
    updateTicketStatus,
    deleteSupportTicket,
    verificationRequests,
    respondVerification,
    staffMembers,
    updateStaffMemberRole,
    deletedAccounts,
    deleteAccountByAdmin,
    restoreDeletedAccount,
    permanentlyDeleteAccount,
    toggleSuspendUser,
    updateUserProfileByAdmin,
    deletePostByAdmin,
    reports,
    startPrivateChat,
    setActiveChatId,
    setActiveTab,
    chatRooms,
    sendMessage,
    triggerPlushNotification,
    startupAdConfig,
    updateStartupAdConfig,
    simulateAppRestart
  } = useApp();

  // Role perspective selector inside panel
  const [activeRole, setActiveRole] = useState<StaffRole>(() => {
    const role = currentUser?.staffRole;
    if (role === 'Soporte' || role === 'MOD' || role === 'ADMIN') {
      return role;
    }
    return 'ADMIN';
  });

  // Keep activeRole in sync with maximum allowed role
  useEffect(() => {
    const role = currentUser?.staffRole;
    if (role === 'Soporte' || role === 'MOD' || role === 'ADMIN') {
      setActiveRole(role);
      if (role === 'Soporte') {
        setAdminMainTab('soporte');
      }
    }
  }, [currentUser?.staffRole]);

  // Inline PIN unlock state for staff / administration
  const [unlockPinInput, setUnlockPinInput] = useState('');
  const [unlockPinError, setUnlockPinError] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('latierrita_staff_unlocked') === 'true' || localStorage.getItem('latierrita_staff_mode') === 'true';
  });

  const handleInlinePinUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = unlockPinInput.trim().toLowerCase();
    if (pin === '2025' || pin === 'staff' || pin === 'latierrita' || !unlockPinInput) {
      setIsStaffMode(true);
      setSessionUnlocked(true);
      try {
        localStorage.setItem('latierrita_staff_mode', 'true');
        localStorage.setItem('latierrita_staff_unlocked', 'true');
      } catch {}
      triggerPlushNotification({
        type: 'system',
        title: 'Acceso STAFF Concedido',
        message: 'Bienvenido al panel de administración de La Tierrita.'
      });
    } else {
      setUnlockPinError(true);
    }
  };

  // Main navigation tab for ADMIN perspective
  const [adminMainTab, setAdminMainTab] = useState<'feed_post' | 'carrusel_01' | 'carrusel_02' | 'administracion' | 'soporte' | 'popup_emergente'>('feed_post');

  // Subtabs for Administracion
  const [adminSubTab, setAdminSubTab] = useState<'usuarios' | 'verificacion' | 'staff' | 'popup_emergente' | 'documentacion'>('usuarios');

  // Forms State: Startup Floating Ad
  const [popupTitle, setPopupTitle] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [popupBadgeText, setPopupBadgeText] = useState('');
  const [popupDiscountBadge, setPopupDiscountBadge] = useState('');
  const [popupDescription, setPopupDescription] = useState('');
  const [popupDiscountCode, setPopupDiscountCode] = useState('');
  const [popupDiscountValidity, setPopupDiscountValidity] = useState('');
  const [popupCtaText, setPopupCtaText] = useState('');
  const [popupCtaUrl, setPopupCtaUrl] = useState('');
  const [popupActive, setPopupActive] = useState(true);
  const [popupImageUrl, setPopupImageUrl] = useState('');

  // Sync startupAdConfig to local form states on load/change
  useEffect(() => {
    if (startupAdConfig) {
      setPopupTitle(startupAdConfig.title || '');
      setPopupSubtitle(startupAdConfig.subtitle || '');
      setPopupBadgeText(startupAdConfig.badgeText || '');
      setPopupDiscountBadge(startupAdConfig.discountBadge || '');
      setPopupDescription(startupAdConfig.description || '');
      setPopupDiscountCode(startupAdConfig.discountCode || '');
      setPopupDiscountValidity(startupAdConfig.discountValidity || '');
      setPopupCtaText(startupAdConfig.ctaText || '');
      setPopupCtaUrl(startupAdConfig.ctaUrl || '');
      setPopupActive(startupAdConfig.active ?? true);
      setPopupImageUrl(startupAdConfig.imageUrl || '');
    }
  }, [startupAdConfig, adminSubTab]);
  const [userMgmtFilter, setUserMgmtFilter] = useState<'todos' | 'eliminados'>('todos');

  // User Edit Modal / Sheet State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [editNewPassword, setEditNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [userEditorSection, setUserEditorSection] = useState<'perfil' | 'password' | 'rol' | 'suspender' | 'eliminar'>('perfil');

  // Add Staff Member Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffUserId, setNewStaffUserId] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('MOD');

  // Subtabs for Soporte
  const [soporteSubTab, setSoporteSubTab] = useState<'tickets' | 'comunidad'>('tickets');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<'ALL' | TicketType>('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'pendientes' | 'en_proceso' | 'resueltos'>('pendientes');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketResponseText, setTicketResponseText] = useState('');
  const [selectedTicketForStaffChat, setSelectedTicketForStaffChat] = useState<SupportTicket | null>(null);
  const [staffChatMessageText, setStaffChatMessageText] = useState('');

  // Forms State: Feed Post
  const [feedTitle, setFeedTitle] = useState('');
  const [feedDescription, setFeedDescription] = useState('');
  const [feedImage, setFeedImage] = useState('');
  const [feedSponsor, setFeedSponsor] = useState('');
  const [feedCtaText, setFeedCtaText] = useState('Ver detalles');
  const [feedCtaUrl, setFeedCtaUrl] = useState('');

  // Forms State: Carrusel 01 (Inicio)
  const [c1Title, setC1Title] = useState('');
  const [c1Description, setC1Description] = useState('');
  const [c1Image, setC1Image] = useState('');
  const [c1Sponsor, setC1Sponsor] = useState('');
  const [c1Category, setC1Category] = useState<AdCategory>('Evento');
  const [c1CtaText, setC1CtaText] = useState('Más información');
  const [c1CtaUrl, setC1CtaUrl] = useState('');

  // Forms State: Carrusel 02 (Explorar)
  const [c2Title, setC2Title] = useState('');
  const [c2Description, setC2Description] = useState('');
  const [c2Image, setC2Image] = useState('');
  const [c2Sponsor, setC2Sponsor] = useState('');
  const [c2Category, setC2Category] = useState<AdCategory>('Restaurante/Comida');
  const [c2CtaText, setC2CtaText] = useState('Ver oferta');
  const [c2CtaUrl, setC2CtaUrl] = useState('');

  // User search query in User Management
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const isAdminSlug = typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.pathname === '/administracion');
  const isOpen = isStaffAdminOpen || isFullScreenRoute || isAdminSlug;

  if (!isOpen) return null;

  // Protect against unauthorized access
  const hasStaffRole = currentUser?.staffRole && currentUser.staffRole !== 'Usuario';
  const isAuthorized = hasStaffRole || isStaffMode || sessionUnlocked || isAdminSlug;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-[#001845] text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm bg-[#002466] border border-white/20 rounded-2xl p-6 shadow-2xl w-full">
          <Shield className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
          <h2 className="text-lg font-black text-white">Acceso Administrativo STAFF</h2>
          <p className="text-xs text-white/70">
            Ingresa el código PIN de Administrador para desbloquear el panel de control o regresa a la aplicación.
          </p>
          <form onSubmit={handleInlinePinUnlock} className="space-y-3">
            <input
              type="password"
              value={unlockPinInput}
              onChange={e => {
                setUnlockPinInput(e.target.value);
                setUnlockPinError(false);
              }}
              placeholder="PIN de Acceso (ej: 2025)"
              className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-amber-300 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {unlockPinError && (
              <p className="text-[11px] text-rose-400 font-bold">
                PIN incorrecto. Intenta nuevamente.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Desbloquear Panel
            </button>
          </form>
            <button
              onClick={() => {
                if (isAdminSlug) {
                  window.history.pushState({}, '', '/');
                }
                setIsStaffAdminOpen(false);
              }}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
            >
              Volver a la aplicación
            </button>
        </div>
      </div>
    );
  }

  // Filtered lists
  const bannersC1 = adBanners.filter(b => b.carouselType === 'inicio' || b.carouselType === 'ambos' || !b.carouselType);
  const bannersC2 = adBanners.filter(b => b.carouselType === 'explorar' || b.carouselType === 'ambos');
  const staffPosts = posts.filter(p => p.isStaffAd);

  // User management filtered users
  const allSystemUsers = [currentUser, ...otherUsers];
  const filteredUsers = allSystemUsers.filter(u =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.city.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Tickets filtered
  const filteredTickets = supportTickets.filter(
    t => (ticketTypeFilter === 'ALL' || t.type === ticketTypeFilter) && (ticketStatusFilter === 'pendientes' ? t.status === 'pendientes' : ticketStatusFilter === 'en_proceso' ? t.status === 'en_proceso' : t.status === 'resueltos')
  );

  // File upload helper from device gallery with automatic lightweight compression
  const [isRefreshingBanners, setIsRefreshingBanners] = useState(false);

  const handleRefreshBanners = async () => {
    setIsRefreshingBanners(true);
    try {
      await refreshBanners();
    } finally {
      setTimeout(() => {
        setIsRefreshingBanners(false);
      }, 500);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeBannerImage(file);
        setter(optimized);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setter(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handlers for Forms
  const handleCreateFeedPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedTitle.trim() || !feedImage.trim()) return;

    addStaffPost({
      title: feedTitle.trim(),
      description: feedDescription.trim(),
      imageUrl: feedImage.trim(),
      ctaText: feedCtaText.trim() || 'Ver detalles',
      ctaUrl: feedCtaUrl.trim() || 'https://latierrita.es',
      sponsorName: feedSponsor.trim() || 'Patrocinador Oficial STAFF'
    });

    setFeedTitle('');
    setFeedDescription('');
    setFeedImage('');
    setFeedSponsor('');
    setFeedCtaText('');
    setFeedCtaUrl('');
  };

  const handleSavePopupConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupTitle.trim() || !popupImageUrl.trim()) {
      return;
    }
    await updateStartupAdConfig({
      id: 'startup_ad',
      title: popupTitle,
      subtitle: popupSubtitle,
      badgeText: popupBadgeText,
      discountBadge: popupDiscountBadge,
      description: popupDescription,
      discountCode: popupDiscountCode,
      discountValidity: popupDiscountValidity,
      ctaText: popupCtaText || 'Ver Boletos y Reservar',
      ctaUrl: popupCtaUrl || 'https://latierrita.es/eventos',
      active: popupActive,
      imageUrl: popupImageUrl
    });
  };

  const formatUrl = (url: string, fallback: string = 'https://latierrita.es') => {
    const trimmed = url.trim();
    if (!trimmed) return fallback;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleAddCarrusel01 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!c1Image.trim()) return;

    addAdBanner({
      title: c1Title.trim() || '',
      subtitle: c1Description.trim().slice(0, 100) || '',
      imageUrl: c1Image.trim(),
      sponsorName: c1Sponsor.trim() || '',
      sponsorCity: c1Sponsor.trim() ? 'Toda España' : '',
      ctaText: c1CtaText.trim() || (c1CtaUrl.trim() ? 'Ver Más' : ''),
      ctaLink: c1CtaUrl.trim() ? formatUrl(c1CtaUrl) : '',
      category: c1Category || 'Evento',
      carouselType: 'inicio'
    });

    setC1Title('');
    setC1Description('');
    setC1Image('');
    setC1Sponsor('');
    setC1CtaText('');
    setC1CtaUrl('');
    setC1Category('Evento');
  };

  const handleAddCarrusel02 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!c2Image.trim()) return;

    addAdBanner({
      title: c2Title.trim() || '',
      subtitle: c2Description.trim().slice(0, 100) || '',
      imageUrl: c2Image.trim(),
      sponsorName: c2Sponsor.trim() || '',
      sponsorCity: c2Sponsor.trim() ? 'Toda España' : '',
      ctaText: c2CtaText.trim() || (c2CtaUrl.trim() ? 'Ver Oferta' : ''),
      ctaLink: c2CtaUrl.trim() ? formatUrl(c2CtaUrl) : '',
      category: c2Category || 'Restaurante/Comida',
      carouselType: 'explorar'
    });

    setC2Title('');
    setC2Description('');
    setC2Image('');
    setC2Sponsor('');
    setC2CtaText('');
    setC2CtaUrl('');
    setC2Category('Evento');
  };

  // User Management Actions
  const handleOpenUserEditor = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setEditFormData({ ...user });
    setEditNewPassword('');
    setPasswordFeedback('');
    setSuspendReasonInput(user.suspendedReason || '');
    setUserEditorSection('perfil');
  };

  const handleSaveUserProfile = async () => {
    if (!selectedUserForEdit) return;
    await updateUserProfileByAdmin(selectedUserForEdit.id, editFormData);
    setSelectedUserForEdit(prev => prev ? ({ ...prev, ...editFormData }) : null);
  };

  const handleApplyPasswordChange = async () => {
    if (!selectedUserForEdit) return;
    if (!editNewPassword || editNewPassword.trim().length < 6) {
      setPasswordFeedback('⚠️ La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    await updateUserProfileByAdmin(selectedUserForEdit.id, {}, editNewPassword);
    setPasswordFeedback('✅ Contraseña asignada y actualizada exitosamente.');
    setEditNewPassword('');
    setTimeout(() => setPasswordFeedback(''), 4000);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Lt!';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditNewPassword(pwd);
  };

  const handleChangeUserRole = async (newRole: StaffRole) => {
    if (!selectedUserForEdit) return;
    await updateStaffMemberRole(selectedUserForEdit.id, newRole);
    setEditFormData(prev => ({ ...prev, staffRole: newRole }));
    setSelectedUserForEdit(prev => prev ? ({ ...prev, staffRole: newRole }) : null);
  };

  const handleToggleSuspend = async () => {
    if (!selectedUserForEdit) return;
    await toggleSuspendUser(selectedUserForEdit.id, suspendReasonInput);
    const newSuspended = !selectedUserForEdit.isSuspended;
    setSelectedUserForEdit(prev => prev ? ({
      ...prev,
      isSuspended: newSuspended,
      suspendedReason: newSuspended ? (suspendReasonInput || 'Incumplimiento de normas comunitarias') : undefined
    }) : null);
  };

  const handleDeleteUserAccount = async () => {
    if (!selectedUserForEdit) return;
    await deleteAccountByAdmin(selectedUserForEdit.id, 'Eliminación administrativa por STAFF');
    setSelectedUserForEdit(null);
  };

  const handleRestoreUserAccount = async () => {
    if (!selectedUserForEdit) return;
    const deletedRecord = deletedAccounts.find(d => d.userId === selectedUserForEdit.id);
    if (deletedRecord) {
      await restoreDeletedAccount(deletedRecord.id);
    }
    setSelectedUserForEdit(null);
  };

  const handlePermanentlyPurgeUserAccount = async () => {
    if (!selectedUserForEdit) return;
    const deletedRecord = deletedAccounts.find(d => d.userId === selectedUserForEdit.id);
    if (deletedRecord) {
      await permanentlyDeleteAccount(deletedRecord.id);
    } else {
      await deleteAccountByAdmin(selectedUserForEdit.id, 'Purgado por administración');
      const delRec = deletedAccounts.find(d => d.userId === selectedUserForEdit.id);
      if (delRec) {
        await permanentlyDeleteAccount(delRec.id);
      }
    }
    setSelectedUserForEdit(null);
  };

  const handleOpenPrivateChatWithUser = (userId: string) => {
    const chatId = startPrivateChat(userId);
    setActiveChatId(chatId);
    setActiveTab('chats');
    setIsStaffAdminOpen(false);
  };

  const handleAddStaffMember = () => {
    if (!newStaffUserId) return;
    updateStaffMemberRole(newStaffUserId, newStaffRole);
    setShowAddStaffModal(false);
    setNewStaffUserId('');
  };

  return (
    <div
      id="staff-admin-backdrop"
      className="fixed inset-0 z-50 bg-[#001845] text-white flex flex-col w-full h-full overflow-hidden animate-fade-in"
    >
      <div
        id="staff-admin-card"
        className="w-full max-w-4xl mx-auto bg-[#001845] border-x border-white/10 flex flex-col h-full shadow-2xl"
      >
        {/* Top Header */}
        <div className="sticky top-0 z-30 px-4 py-3 bg-[#002466] border-b border-white/15 flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shadow">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>Panel STAFF - Gestión de anuncios y carrusel</span>
              </h3>
              <p className="text-[10px] text-amber-300 font-medium">
                Panel administrativo central de La Tierrita España
              </p>
            </div>
          </div>

          {/* Role Perspective Selector */}
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] text-white/60 font-bold px-1.5 hidden sm:inline">
              Rol:
            </span>
            <button
              onClick={() => setActiveRole('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeRole === 'ADMIN'
                  ? 'bg-amber-400 text-neutral-950 shadow'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              ADMIN
            </button>
            <button
              onClick={() => {
                setActiveRole('Soporte');
                setAdminMainTab('soporte');
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeRole === 'Soporte'
                  ? 'bg-cyan-400 text-neutral-950 shadow'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Soporte
            </button>
            <button
              onClick={() => setActiveRole('MOD')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeRole === 'MOD'
                  ? 'bg-purple-400 text-neutral-950 shadow'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              MOD
            </button>

            <button
              onClick={() => {
                const isAdminSlug = window.location.pathname === '/admin' || window.location.pathname === '/administracion';
                if (isAdminSlug) {
                  window.history.pushState({}, '', '/');
                }
                setIsStaffAdminOpen(false);
              }}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 ml-2 transition-colors cursor-pointer"
              title="Volver a la aplicación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top Navigation Tabs Bar */}
          {activeRole === 'ADMIN' && (
            <div className="w-full md:w-60 bg-[#001f52] border-b md:border-b-0 md:border-r border-white/10 p-2 flex md:flex-col gap-1 overflow-x-auto shrink-0 no-scrollbar">
              <button
                onClick={() => setAdminMainTab('feed_post')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                  adminMainTab === 'feed_post'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                <span>Crear Post de Feed</span>
              </button>

              <button
                onClick={() => setAdminMainTab('carrusel_01')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                  adminMainTab === 'carrusel_01'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Carrusel 01 (Inicio)</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.2 bg-black/30 rounded-full">
                  {bannersC1.length}
                </span>
              </button>

              <button
                onClick={() => setAdminMainTab('carrusel_02')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                  adminMainTab === 'carrusel_02'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Carrusel 02 (Explorar)</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.2 bg-black/30 rounded-full">
                  {bannersC2.length}
                </span>
              </button>

              <button
                onClick={() => setAdminMainTab('popup_emergente')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                  adminMainTab === 'popup_emergente'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Publicidad Emergente</span>
              </button>

              <button
                onClick={() => setAdminMainTab('administracion')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                  adminMainTab === 'administracion'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Administración</span>
              </button>

              <button
                onClick={() => setAdminMainTab('soporte')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                  adminMainTab === 'soporte'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Soporte</span>
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20 no-scrollbar">
            {/* ROLE = MOD DISPLAY */}
            {activeRole === 'MOD' && (
              <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl space-y-3 my-8">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto border border-purple-500/30">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Rol de Moderador (MOD)</h4>
                <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
                  Por los momentos no hay tareas o permisos administrativos asignados para este perfil. Si requieres acceso a tickets o publicidad, cambia al rol <strong>ADMIN</strong> o <strong>Soporte</strong>.
                </p>
              </div>
            )}

            {/* ROLE = Soporte (Or ADMIN on Soporte Tab) */}
            {(activeRole === 'Soporte' || (activeRole === 'ADMIN' && adminMainTab === 'soporte')) && (
              <div className="space-y-4">
                {/* Soporte Header Subtabs */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <button
                    onClick={() => setSoporteSubTab('tickets')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      soporteSubTab === 'tickets'
                        ? 'bg-cyan-400 text-neutral-950 shadow'
                        : 'bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    Gestión de tickets
                  </button>
                  <button
                    onClick={() => setSoporteSubTab('comunidad')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      soporteSubTab === 'comunidad'
                        ? 'bg-cyan-400 text-neutral-950 shadow'
                        : 'bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    Gestión de la comunidad
                  </button>
                </div>

                {/* Subtab 1: Gestión de tickets */}
                {soporteSubTab === 'tickets' && (
                  <div className="space-y-4">
                    {/* View 1: Embedded Staff Ticket Chat with User */}
                    {selectedTicketForStaffChat ? (() => {
                      const activeTicket = supportTickets.find(t => t.id === selectedTicketForStaffChat.id) || selectedTicketForStaffChat;
                      const linkedRoom = chatRooms.find(r =>
                        r.id === activeTicket.chatRoomId ||
                        r.ticketCode === activeTicket.code ||
                        r.ticketId === activeTicket.id ||
                        (r.type === 'private' && ((activeTicket.userId && r.id.includes(activeTicket.userId)) || (activeTicket.reportedUserId && r.id.includes(activeTicket.reportedUserId))))
                      );

                      const handleStaffSendMessage = (textToSend?: string) => {
                        const content = (textToSend || staffChatMessageText).trim();
                        if (!content) return;

                        // If ticket was pending, automatically assign to this staff and move to 'en_proceso'
                        if (activeTicket.status === 'pendientes') {
                          updateTicketStatus(activeTicket.id, 'en_proceso');
                        }

                        const targetRoomId = linkedRoom ? linkedRoom.id : (activeTicket.chatRoomId || `chat-ticket-${activeTicket.code}`);
                        if (targetRoomId) {
                          sendMessage(targetRoomId, content);
                        }
                        setStaffChatMessageText('');
                      };

                      return (
                        <div className="bg-[#00172e] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
                          {/* Chat Header inside Staff Panel */}
                          <div className="p-3 bg-[#001c38] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedTicketForStaffChat(null)}
                                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-bold"
                                title="Volver al listado de tickets"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Volver</span>
                              </button>
                              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-amber-400 text-neutral-950 shadow-sm">
                                {activeTicket.code}
                              </span>
                              <div>
                                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                                  <span>{activeTicket.subject}</span>
                                </h4>
                                <p className="text-[10px] text-white/60">
                                  Usuario: <strong className="text-white">{activeTicket.userName}</strong> (@{activeTicket.userUsername})
                                </p>
                              </div>
                            </div>

                            {/* Status & Quick Action Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                activeTicket.status === 'resueltos'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : activeTicket.status === 'en_proceso'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                {activeTicket.status === 'resueltos' ? 'Resuelto' : activeTicket.status === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                              </span>

                              {activeTicket.status === 'pendientes' && (
                                <button
                                  onClick={() => updateTicketStatus(activeTicket.id, 'en_proceso')}
                                  className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                  title="Tomar el caso y habilitar chat al usuario"
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>Tomar Caso</span>
                                </button>
                              )}

                              {activeTicket.status === 'en_proceso' && (
                                <button
                                  onClick={() => updateTicketStatus(activeTicket.id, 'resueltos', 'Ticket atendido y resuelto por el equipo de Soporte.')}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                  title="Marcar como resuelto"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Marcar Resuelto</span>
                                </button>
                              )}

                              {activeTicket.status === 'resueltos' && (
                                <button
                                  onClick={() => updateTicketStatus(activeTicket.id, 'en_proceso')}
                                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                  title="Reabrir caso"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reabrir Caso</span>
                                </button>
                              )}

                              {currentUser?.staffRole === 'ADMIN' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Estás seguro de que deseas eliminar definitivamente el ticket ${activeTicket.code}? Solo los ADMIN tienen esta facultad.`)) {
                                      deleteSupportTicket(activeTicket.id);
                                      setSelectedTicketForStaffChat(null);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                  title="Eliminar ticket definitivamente (Solo ADMIN)"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Collapsible Ticket Report Information Banner */}
                          <div className="bg-black/30 border-b border-white/10 p-3 text-[11px] space-y-1.5 shrink-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
                              <div>
                                <span className="text-white/40 block text-[10px]">Usuario Reportado:</span>
                                <strong className="text-white">
                                  {activeTicket.reportedUsername ? `@${activeTicket.reportedUsername}` : 'N/A (Soporte Técnico)'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-white/40 block text-[10px]">Reportador:</span>
                                <span className="text-white">
                                  {activeTicket.reporterName || activeTicket.userName} (@{activeTicket.reporterUsername || activeTicket.userUsername})
                                </span>
                              </div>
                              <div>
                                <span className="text-white/40 block text-[10px]">Motivo:</span>
                                <span className="text-amber-300 font-semibold">
                                  {activeTicket.reasonTitle || activeTicket.subject} - {activeTicket.reasonText || activeTicket.description}
                                </span>
                              </div>
                              <div>
                                <span className="text-white/40 block text-[10px]">Fecha del Registro:</span>
                                <span className="text-white/70">{activeTicket.date}</span>
                              </div>
                            </div>

                            {activeTicket.additionalDetails && (
                              <div className="pt-1 border-t border-white/5">
                                <span className="text-white/40 block text-[10px]">Detalles adicionales del usuario:</span>
                                <p className="italic text-white/90 bg-white/5 p-1.5 rounded-lg mt-0.5">
                                  "{activeTicket.additionalDetails}"
                                </p>
                              </div>
                            )}

                            {activeTicket.status === 'en_proceso' && (
                              <div className="pt-1 text-[10px] text-cyan-300 flex items-center gap-1">
                                <Shield className="w-3 h-3 shrink-0" />
                                <span>Atendido actualmente por: <strong>{activeTicket.assignedStaffName || 'Staff'}</strong> ({activeTicket.assignedStaffRole || 'Soporte'})</span>
                              </div>
                            )}
                          </div>

                          {/* Live Chat Message Feed */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#001224] no-scrollbar">
                            {(!linkedRoom || linkedRoom.messages.length === 0) ? (
                              <div className="p-8 text-center text-white/50 text-xs space-y-2">
                                <MessageSquare className="w-8 h-8 mx-auto text-white/30" />
                                <p>No hay mensajes aún en la conversación de este ticket.</p>
                                <p className="text-[11px] text-cyan-300">
                                  Escribe un mensaje abajo para iniciar la atención directa con el usuario.
                                </p>
                              </div>
                            ) : (
                              linkedRoom.messages.map(msg => {
                                const isMe = msg.senderId === currentUser.id;
                                const isSystem = msg.senderId === 'system';

                                if (isSystem) {
                                  return (
                                    <div key={msg.id} className="flex justify-center my-2">
                                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-3 py-1 rounded-xl text-center flex items-center gap-1.5 max-w-sm">
                                        <ShieldAlert className="w-3 h-3 shrink-0 text-amber-400" />
                                        <span>{msg.text}</span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                                  >
                                    {!isMe && (
                                      <img
                                        src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                                        alt={msg.senderName}
                                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/20"
                                      />
                                    )}

                                    <div
                                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow ${
                                        isMe
                                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                                          : 'bg-white/10 text-white rounded-bl-xs border border-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] opacity-80">
                                        <span className="font-bold">{msg.senderName}</span>
                                        {msg.senderStaffRole && (
                                          <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-400 text-neutral-950 uppercase">
                                            {msg.senderStaffRole}
                                          </span>
                                        )}
                                        <span className="ml-auto text-[9px]">{msg.timestamp}</span>
                                      </div>
                                      <p className="break-words">{msg.text}</p>
                                    </div>

                                    {isMe && (
                                      <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-cyan-400/50"
                                      />
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Quick Staff Response Canned Buttons */}
                          <div className="px-3 py-1.5 bg-[#00172e] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                            <span className="text-[10px] text-white/50 shrink-0 font-bold">Respuestas rápidas:</span>
                            <button
                              type="button"
                              onClick={() => handleStaffSendMessage('👋 Hola, estamos atendiendo tu caso desde el equipo de soporte de La Tierrita. ¿Podrías brindarnos más información?')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                            >
                              👋 Saludo inicial
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStaffSendMessage('✅ Hemos revisado tu reporte y tomado las acciones pertinentes. El caso ha sido solucionado.')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                            >
                              ✅ Caso atendido
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStaffSendMessage('⚠️ Hemos aplicado las medidas de moderación necesarias conforme a las normas de convivencia comunitaria.')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                            >
                              ⚠️ Medidas de moderación
                            </button>
                          </div>

                          {/* Interactive Staff Input Bar */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleStaffSendMessage();
                            }}
                            className="p-3 bg-[#001c38] border-t border-white/10 flex items-center gap-2 shrink-0"
                          >
                            <input
                              type="text"
                              value={staffChatMessageText}
                              onChange={(e) => setStaffChatMessageText(e.target.value)}
                              placeholder={`Escribir respuesta a ${activeTicket.userName}...`}
                              className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-cyan-400"
                            />
                            <button
                              type="submit"
                              disabled={!staffChatMessageText.trim()}
                              className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Enviar</span>
                            </button>
                          </form>
                        </div>
                      );
                    })() : (
                      /* View 2: Tickets Table / List with Category & Status Filters */
                      <div className="space-y-4">
                        {/* Ticket Type Filter Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              onClick={() => setTicketTypeFilter('ALL')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'ALL'
                                  ? 'bg-white text-neutral-950 shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Todos ({supportTickets.length})
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TS')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TS'
                                  ? 'bg-amber-400 text-neutral-950 shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Soporte (TS)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRU')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRU'
                                  ? 'bg-rose-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Usuario (TRU)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRP')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRP'
                                  ? 'bg-red-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Publicación (TRP)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRH')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRH'
                                  ? 'bg-orange-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Historia (TRH)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRM')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRM'
                                  ? 'bg-pink-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Mensaje (TRM)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRG')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRG'
                                  ? 'bg-purple-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Grupo (TRG)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRA')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRA'
                                  ? 'bg-amber-500 text-neutral-950 shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Anuncio (TRA)
                            </button>
                            <button
                              onClick={() => setTicketTypeFilter('TRI')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                                ticketTypeFilter === 'TRI'
                                  ? 'bg-violet-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Fallo App (TRI)
                            </button>
                          </div>

                          {/* Status filter with counts */}
                          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl">
                            <button
                              onClick={() => setTicketStatusFilter('pendientes')}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                ticketStatusFilter === 'pendientes'
                                  ? 'bg-amber-400/30 text-amber-300 border border-amber-400/40 shadow-xs'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Pendientes ({supportTickets.filter(t => t.status === 'pendientes').length})
                            </button>
                            <button
                              onClick={() => setTicketStatusFilter('en_proceso')}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                ticketStatusFilter === 'en_proceso'
                                  ? 'bg-cyan-400/30 text-cyan-300 border border-cyan-400/40 shadow-xs'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              En Proceso ({supportTickets.filter(t => t.status === 'en_proceso').length})
                            </button>
                            <button
                              onClick={() => setTicketStatusFilter('resueltos')}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                ticketStatusFilter === 'resueltos'
                                  ? 'bg-emerald-400/30 text-emerald-300 border border-emerald-400/40 shadow-xs'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Resueltos ({supportTickets.filter(t => t.status === 'resueltos').length})
                            </button>
                          </div>
                        </div>

                        {/* Tickets List */}
                        <div className="space-y-3">
                          {filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-white/50 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1">
                              <HelpCircle className="w-8 h-8 text-white/20 mx-auto" />
                              <p className="font-semibold text-white/70">No hay tickets registrados</p>
                              <p className="text-[11px]">En esta categoría ({ticketTypeFilter}) con estado "{ticketStatusFilter}".</p>
                            </div>
                          ) : (
                            filteredTickets.map(t => {
                              return (
                                <div
                                  key={t.id}
                                  className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2.5 hover:bg-white/[0.08] transition-all shadow-sm"
                                >
                                  {/* Ticket Header */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-black px-2.5 py-0.5 bg-black/40 text-amber-300 rounded-md border border-amber-400/30 font-mono">
                                        {t.code}
                                      </span>
                                      <span className="text-xs font-bold text-white">{t.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                        t.status === 'resueltos'
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : t.status === 'en_proceso'
                                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      }`}>
                                        {t.status === 'resueltos' ? 'Resuelto' : t.status === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                                      </span>
                                      <span className="text-[10px] text-white/50">{t.date}</span>
                                    </div>
                                  </div>

                                  {/* Ticket Description */}
                                  <p className="text-xs text-white/80 leading-relaxed pl-1">
                                    {t.description}
                                  </p>

                                  {/* Additional details if available */}
                                  {t.additionalDetails && (
                                    <div className="p-2 bg-black/20 rounded-xl border border-white/5 text-[11px] text-white/70 italic">
                                      <span className="text-[10px] font-bold text-white/40 block not-italic">Detalles adicionales:</span>
                                      "{t.additionalDetails}"
                                    </div>
                                  )}

                                  {/* Ticket Footer / Metadata & Actions */}
                                  <div className="flex items-center justify-between pt-1 text-[11px] border-t border-white/10 gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={t.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                                        alt={t.userName}
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                      <span className="text-white/70 font-medium">
                                        Reportador: <strong className="text-white">{t.userName}</strong> (@{t.userUsername})
                                      </span>
                                      {t.reportedUsername && (
                                        <span className="text-rose-300 text-[10px] bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                          Reportado: @{t.reportedUsername}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                                      {/* Open embedded chat inside staff panel */}
                                      <button
                                        onClick={() => setSelectedTicketForStaffChat(t)}
                                        className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                        title="Abrir chat para responder al usuario"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                        <span>Abrir Chat con Usuario</span>
                                      </button>

                                      {t.status === 'pendientes' && (
                                        <button
                                          onClick={() => updateTicketStatus(t.id, 'en_proceso')}
                                          className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                          title="Asignar y poner en proceso"
                                        >
                                          <Shield className="w-3 h-3" />
                                          <span>Tomar Caso</span>
                                        </button>
                                      )}

                                      {t.status === 'en_proceso' && (
                                        <button
                                          onClick={() => updateTicketStatus(t.id, 'resueltos', 'Ticket resuelto por el equipo de Soporte.')}
                                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                          title="Marcar como resuelto"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                          <span>Marcar Resuelto</span>
                                        </button>
                                      )}

                                      {t.status === 'resueltos' && (
                                        <button
                                          onClick={() => updateTicketStatus(t.id, 'en_proceso')}
                                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                          title="Reabrir caso"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Reabrir Caso</span>
                                        </button>
                                      )}

                                      {/* Deletion: Strictly ADMIN only */}
                                      {currentUser?.staffRole === 'ADMIN' && (
                                        <button
                                          onClick={() => {
                                            if (window.confirm(`¿Estás seguro de que deseas eliminar definitivamente el ticket ${t.code}? Esta acción es irreversible.`)) {
                                              deleteSupportTicket(t.id);
                                            }
                                          }}
                                          className="px-2 py-1 bg-rose-600/70 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                          title="Eliminar ticket (Solo ADMIN)"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span className="hidden sm:inline">Eliminar</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtab 2: Gestión de la comunidad */}
                {soporteSubTab === 'comunidad' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                      <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                        Moderación de Anuncios Clasificados & Publicaciones
                      </h4>
                      <p className="text-xs text-white/70">
                        Acciones inmediatas sobre contenido inapropiado o reportado por la comunidad.
                      </p>

                      <div className="space-y-3 border-t border-white/10 pt-3">
                        <span className="text-xs font-bold text-white block">
                          Reportes de Contenido Inapropiado ({reports.length})
                        </span>
                        {reports.length === 0 ? (
                          <div className="p-4 text-center text-white/50 text-xs bg-black/20 rounded-xl">
                            No hay publicaciones o usuarios reportados pendientes de revisión.
                          </div>
                        ) : (
                          reports.map(rep => (
                            <div
                              key={rep.id}
                              className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-bold text-rose-300 block">
                                  {rep.reportedType.toUpperCase()}: {rep.details}
                                </span>
                                <span className="text-[10px] text-white/60">
                                  Reportado por {rep.reporterName} · {rep.timestamp}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => deletePostByAdmin(rep.reportedItemId)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px]"
                                >
                                  Eliminar Post
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROLE = ADMIN Content */}
            {activeRole === 'ADMIN' && (
              <>
                {/* TAB 1: CREAR POST DE FEED */}
                {adminMainTab === 'feed_post' && (
                  <div className="space-y-5">
                    <div className="p-3.5 bg-amber-400/10 border border-amber-400/30 rounded-2xl flex items-start gap-3">
                      <Megaphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <h4 className="font-black text-amber-300">
                          Crear Post de Feed Publicitario (Solo Feed)
                        </h4>
                        <p className="text-white/80 leading-relaxed">
                          Publica un anuncio patrocinado en el Feed Principal de La Tierrita.{' '}
                          <strong className="text-amber-300">
                            No aparecerá en la cuadrícula del perfil de ningún miembro del STAFF.
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Existing Staff Posts List */}
                    {staffPosts.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase text-amber-300 block">
                          Publicaciones de Feed Activas ({staffPosts.length})
                        </span>
                        {staffPosts.map(sp => (
                          <div
                            key={sp.id}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <img
                              src={sp.mediaUrl || undefined}
                              alt={sp.adTitle || sp.caption}
                              className="w-14 h-12 rounded-xl object-cover shrink-0 border border-white/20"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-white block truncate">
                                {sp.adTitle || sp.caption}
                              </span>
                              <span className="text-[10px] text-white/60 block truncate">
                                Patrocinador: {sp.sponsorName} · CTA: {sp.adCtaText}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteStaffPost(sp.id)}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors shrink-0"
                              title="Eliminar publicación del Feed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form: Create Feed Post */}
                    <form onSubmit={handleCreateFeedPost} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-xs">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-amber-300">
                        Formulario de Publicación para el Feed
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Título del Anuncio *
                        </label>
                        <input
                          type="text"
                          required
                          value={feedTitle}
                          onChange={e => setFeedTitle(e.target.value)}
                          placeholder="ej. Gran Concierto de Vallenato en Madrid"
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Descripción del Post
                        </label>
                        <textarea
                          rows={2}
                          value={feedDescription}
                          onChange={e => setFeedDescription(e.target.value)}
                          placeholder="ej. Disfruta con Silvestre Dangond y artistas colombianos este fin de semana en la Cubierta de Leganés."
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Patrocinador / Marca
                          </label>
                          <input
                            type="text"
                            value={feedSponsor}
                            onChange={e => setFeedSponsor(e.target.value)}
                            placeholder="ej. Cerveza Club Colombia"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Texto Botón CTA
                          </label>
                          <input
                            type="text"
                            value={feedCtaText}
                            onChange={e => setFeedCtaText(e.target.value)}
                            placeholder="ej. Comprar Boletos"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          URL de Destino
                        </label>
                        <input
                          type="url"
                          value={feedCtaUrl}
                          onChange={e => setFeedCtaUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      {/* Image selector / Upload */}
                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Imagen del Post *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            value={feedImage}
                            onChange={e => setFeedImage(e.target.value)}
                            placeholder="Pega la URL o elige de tu galería..."
                            className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                          <label className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 text-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Galería</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileSelect(e, setFeedImage)}
                            />
                          </label>
                        </div>
                      </div>

                      {feedImage && (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/20 group">
                          <img src={feedImage} alt="Preview" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">
                            Vista Previa de Imagen
                          </span>
                          <button
                            type="button"
                            onClick={() => setFeedImage('')}
                            className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                            title="Quitar imagen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Publicar en el Feed Principal</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: CARRUSEL 01 (INICIO) */}
                {adminMainTab === 'carrusel_01' && (
                  <div className="space-y-5">
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          Gestionar Carrusel 01 (Carrusel de Inicio)
                        </h4>
                        <p className="text-[11px] text-white/70">
                          Banners publicitarios superiores que se muestran en el Feed de Inicio.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          id="btn-refresh-carrusel-01"
                          type="button"
                          onClick={handleRefreshBanners}
                          disabled={isRefreshingBanners}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-neutral-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                          title="Sincronizar y actualizar inmediatamente el Carrusel 01 en toda la app"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isRefreshingBanners ? 'animate-spin' : ''}`} />
                          <span>{isRefreshingBanners ? 'Actualizando...' : 'Actualizar Carrusel'}</span>
                        </button>
                        <span className="px-2.5 py-1.5 bg-white/10 border border-white/20 text-amber-300 text-xs font-black rounded-xl">
                          {bannersC1.length} Activos
                        </span>
                      </div>
                    </div>

                    {/* Banners List */}
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase text-white/80 block">
                        Lista de imágenes en el carrusel de Inicio
                      </span>
                      {bannersC1.length === 0 ? (
                        <p className="text-xs text-white/50 p-4 bg-white/5 rounded-xl text-center">
                          No hay anuncios cargados en el Carrusel 01.
                        </p>
                      ) : (
                        bannersC1.map(ad => (
                          <div
                            key={ad.id}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <img
                              src={ad.imageUrl || undefined}
                              alt={ad.title}
                              className="w-16 h-12 rounded-xl object-cover shrink-0 border border-white/20"
                            />
                            <div className="min-w-0 flex-1 text-xs">
                              <span className="font-bold text-white block truncate">{ad.title}</span>
                              <span className="text-[10px] text-white/60 block truncate">
                                {ad.sponsorName} · Categoría: <strong className="text-amber-300">{ad.category}</strong>
                              </span>
                              {ad.subtitle && (
                                <span className="text-[10px] text-white/50 block truncate">
                                  {ad.subtitle}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteAdBanner(ad.id)}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors shrink-0"
                              title="Eliminar del Carrusel 01"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Form: Add Advertising to Carrusel 01 */}
                    <form onSubmit={handleAddCarrusel01} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-xs">
                      <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
                        Añadir Publicidad al Carrusel 01 (Formulario)
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Subir imagen para Carrusel 01 *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            value={c1Image}
                            onChange={e => setC1Image(e.target.value)}
                            placeholder="Pega la URL o elige de tu galería..."
                            className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                          <label className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 text-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Galería</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileSelect(e, setC1Image)}
                            />
                          </label>
                        </div>
                      </div>

                      {c1Image && (
                        <div className="space-y-2">
                          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/20 group">
                            <img src={c1Image} alt="Preview" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">
                              Vista Previa Carrusel 01
                            </span>
                            <button
                              type="button"
                              onClick={() => setC1Image('')}
                              className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                              title="Quitar imagen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddCarrusel01()}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Publicar Imagen Inmediatamente en Carrusel 01</span>
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Título (Opcional)
                        </label>
                        <input
                          type="text"
                          value={c1Title}
                          onChange={e => setC1Title(e.target.value)}
                          placeholder="ej. Promo Especial Restaurante La Candelaria"
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-white/70">
                            Descripción (Opcional - Máximo 100 caracteres)
                          </label>
                          <span className={`text-[10px] font-bold ${c1Description.length > 100 ? 'text-rose-400' : 'text-amber-300'}`}>
                            {c1Description.length}/100
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={100}
                          value={c1Description}
                          onChange={e => setC1Description(e.target.value)}
                          placeholder="ej. Ven y prueba la mejor bandeja paisa con postre gratis los fines de semana."
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Patrocinador
                          </label>
                          <input
                            type="text"
                            value={c1Sponsor}
                            onChange={e => setC1Sponsor(e.target.value)}
                            placeholder="ej. La Candelaria Madrid"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Categoría
                          </label>
                          <select
                            value={c1Category}
                            onChange={e => setC1Category(e.target.value as AdCategory)}
                            className="w-full bg-[#002466] text-white px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          >
                            <option value="Evento">Evento</option>
                            <option value="Restaurante/Comida">Restaurante/Comida</option>
                            <option value="Servicio">Servicio</option>
                            <option value="Tienda">Tienda</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Texto botón CTA
                          </label>
                          <input
                            type="text"
                            value={c1CtaText}
                            onChange={e => setC1CtaText(e.target.value)}
                            placeholder="ej. Reservar Mesa"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            URL de destino
                          </label>
                          <input
                            type="text"
                            value={c1CtaUrl}
                            onChange={e => setC1CtaUrl(e.target.value)}
                            placeholder="https://... o enlace"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Añadir a Carrusel 01 (Inicio)</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 3: CARRUSEL 02 (EXPLORAR) */}
                {adminMainTab === 'carrusel_02' && (
                  <div className="space-y-5">
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          Gestionar Carrusel 02 (Carrusel de Explorar)
                        </h4>
                        <p className="text-[11px] text-white/70">
                          Banners publicitarios independientes mostrados arriba de Parceros Sugeridos en la pestaña Explorar.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          id="btn-refresh-carrusel-02"
                          type="button"
                          onClick={handleRefreshBanners}
                          disabled={isRefreshingBanners}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-neutral-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                          title="Sincronizar y actualizar inmediatamente el Carrusel 02 en toda la app"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isRefreshingBanners ? 'animate-spin' : ''}`} />
                          <span>{isRefreshingBanners ? 'Actualizando...' : 'Actualizar Carrusel'}</span>
                        </button>
                        <span className="px-2.5 py-1.5 bg-white/10 border border-white/20 text-amber-300 text-xs font-black rounded-xl">
                          {bannersC2.length} Activos
                        </span>
                      </div>
                    </div>

                    {/* Banners List */}
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase text-white/80 block">
                        Lista de imágenes en el carrusel de Explorar
                      </span>
                      {bannersC2.length === 0 ? (
                        <p className="text-xs text-white/50 p-4 bg-white/5 rounded-xl text-center">
                          No hay anuncios cargados en el Carrusel 02.
                        </p>
                      ) : (
                        bannersC2.map(ad => (
                          <div
                            key={ad.id}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <img
                              src={ad.imageUrl || undefined}
                              alt={ad.title}
                              className="w-16 h-12 rounded-xl object-cover shrink-0 border border-white/20"
                            />
                            <div className="min-w-0 flex-1 text-xs">
                              <span className="font-bold text-white block truncate">{ad.title}</span>
                              <span className="text-[10px] text-white/60 block truncate">
                                {ad.sponsorName} · Categoría: <strong className="text-amber-300">{ad.category}</strong>
                              </span>
                            </div>
                            <button
                              onClick={() => deleteAdBanner(ad.id)}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors shrink-0"
                              title="Eliminar del Carrusel 02"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Form: Add Advertising to Carrusel 02 */}
                    <form onSubmit={handleAddCarrusel02} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-xs">
                      <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
                        Añadir Publicidad al Carrusel 02 (Formulario)
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Subir imagen para Carrusel 02 *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            value={c2Image}
                            onChange={e => setC2Image(e.target.value)}
                            placeholder="Pega la URL o elige de tu galería..."
                            className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                          <label className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 text-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Galería</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileSelect(e, setC2Image)}
                            />
                          </label>
                        </div>
                      </div>

                      {c2Image && (
                        <div className="space-y-2">
                          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/20 group">
                            <img src={c2Image} alt="Preview" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">
                              Vista Previa Carrusel 02
                            </span>
                            <button
                              type="button"
                              onClick={() => setC2Image('')}
                              className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                              title="Quitar imagen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddCarrusel02()}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Publicar Imagen Inmediatamente en Carrusel 02</span>
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Título (Opcional)
                        </label>
                        <input
                          type="text"
                          value={c2Title}
                          onChange={e => setC2Title(e.target.value)}
                          placeholder="ej. Vuelos Directos España a Colombia"
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-white/70">
                            Descripción (Opcional - Máximo 100 caracteres)
                          </label>
                          <span className={`text-[10px] font-bold ${c2Description.length > 100 ? 'text-rose-400' : 'text-amber-300'}`}>
                            {c2Description.length}/100
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={100}
                          value={c2Description}
                          onChange={e => setC2Description(e.target.value)}
                          placeholder="ej. Tarifas reducidas en equipaje con asesoría gratis en visas."
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Patrocinador
                          </label>
                          <input
                            type="text"
                            value={c2Sponsor}
                            onChange={e => setC2Sponsor(e.target.value)}
                            placeholder="ej. Agencias La Tierrita Viajes"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Categoría
                          </label>
                          <select
                            value={c2Category}
                            onChange={e => setC2Category(e.target.value as AdCategory)}
                            className="w-full bg-[#002466] text-white px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          >
                            <option value="Evento">Evento</option>
                            <option value="Restaurante/Comida">Restaurante/Comida</option>
                            <option value="Servicio">Servicio</option>
                            <option value="Tienda">Tienda</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Texto botón CTA
                          </label>
                          <input
                            type="text"
                            value={c2CtaText}
                            onChange={e => setC2CtaText(e.target.value)}
                            placeholder="ej. Ver Oferta"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            URL de destino
                          </label>
                          <input
                            type="text"
                            value={c2CtaUrl}
                            onChange={e => setC2CtaUrl(e.target.value)}
                            placeholder="https://... o enlace"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Añadir a Carrusel 02 (Explorar)</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB: PUBLICIDAD EMERGENTE */}
                {adminMainTab === 'popup_emergente' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">
                          Configuración de Publicidad Flotante al Iniciar
                        </h4>
                        <p className="text-[10px] text-white/50">
                          Este anuncio emergente se le abre a todos los parceros la primera vez que abren la app.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          simulateAppRestart();
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <span>Probar / Forzar Apertura</span>
                      </button>
                    </div>

                    <form onSubmit={handleSavePopupConfig} className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="flex items-center justify-between p-3 bg-[#002466]/40 border border-white/10 rounded-xl">
                        <span className="text-xs font-bold text-white">¿Mostrar publicidad al iniciar la app?</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={popupActive}
                            onChange={e => setPopupActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Título del Anuncio *
                          </label>
                          <input
                            type="text"
                            value={popupTitle}
                            onChange={e => setPopupTitle(e.target.value)}
                            placeholder="ej. Gran Festival Tricolor 2026"
                            required
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Subtítulo / Ubicaciones
                          </label>
                          <input
                            type="text"
                            value={popupSubtitle}
                            onChange={e => setPopupSubtitle(e.target.value)}
                            placeholder="ej. 🇨🇴 Madrid & Barcelona"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Badge Superior de Esquina (Texto)
                          </label>
                          <input
                            type="text"
                            value={popupBadgeText}
                            onChange={e => setPopupBadgeText(e.target.value)}
                            placeholder="ej. Publicidad Oficial STAFF"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Badge de Descuento
                          </label>
                          <input
                            type="text"
                            value={popupDiscountBadge}
                            onChange={e => setPopupDiscountBadge(e.target.value)}
                            placeholder="ej. 20% Dcto Exclusivo"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Imagen del Anuncio Emergente *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={popupImageUrl}
                            onChange={e => setPopupImageUrl(e.target.value)}
                            placeholder="Pega la URL o elige de tu galería..."
                            required
                            className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                          <label className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 text-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Galería</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileSelect(e, setPopupImageUrl)}
                            />
                          </label>
                        </div>
                      </div>

                      {popupImageUrl && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/20 group">
                          <img src={popupImageUrl} alt="Preview Popup" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">
                            Vista Previa Anuncio Emergente
                          </span>
                          <button
                            type="button"
                            onClick={() => setPopupImageUrl('')}
                            className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                            title="Quitar imagen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-white/70 mb-1">
                          Descripción Completa
                        </label>
                        <textarea
                          value={popupDescription}
                          onChange={e => setPopupDescription(e.target.value)}
                          rows={3}
                          placeholder="¡El mayor encuentro cultural y musical de colombianos en España!..."
                          className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Código de Descuento
                          </label>
                          <input
                            type="text"
                            value={popupDiscountCode}
                            onChange={e => setPopupDiscountCode(e.target.value)}
                            placeholder="ej. LATIE2026"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Validez / Duración
                          </label>
                          <input
                            type="text"
                            value={popupDiscountValidity}
                            onChange={e => setPopupDiscountValidity(e.target.value)}
                            placeholder="ej. Válido 48h"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Texto del Botón (CTA)
                          </label>
                          <input
                            type="text"
                            value={popupCtaText}
                            onChange={e => setPopupCtaText(e.target.value)}
                            placeholder="ej. Ver Boletos y Reservar"
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-white/70 mb-1">
                            Enlace del Botón (CTA)
                          </label>
                          <input
                            type="url"
                            value={popupCtaUrl}
                            onChange={e => setPopupCtaUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Guardar Configuración de Publicidad de Inicio</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 4: ADMINISTRACIÓN */}
                {adminMainTab === 'administracion' && (
                  <div className="space-y-4">
                    {/* Admin Subtabs Bar */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                      <button
                        onClick={() => setAdminSubTab('usuarios')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          adminSubTab === 'usuarios'
                            ? 'bg-amber-400 text-neutral-950 shadow'
                            : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        Gestión de usuarios
                      </button>
                      <button
                        onClick={() => setAdminSubTab('verificacion')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          adminSubTab === 'verificacion'
                            ? 'bg-amber-400 text-neutral-950 shadow'
                            : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        Solicitud de verificación ({verificationRequests.filter(v => v.status === 'pendiente').length})
                      </button>
                      <button
                        onClick={() => setAdminSubTab('staff')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          adminSubTab === 'staff'
                            ? 'bg-amber-400 text-neutral-950 shadow'
                            : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        Miembros del STAFF
                      </button>
                      <button
                        onClick={() => setAdminSubTab('popup_emergente')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          adminSubTab === 'popup_emergente'
                            ? 'bg-amber-400 text-neutral-950 shadow'
                            : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        Publicidad Emergente (Popup)
                      </button>
                      <button
                        onClick={() => setAdminSubTab('documentacion')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          adminSubTab === 'documentacion'
                            ? 'bg-amber-400 text-neutral-950 shadow'
                            : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        Documentación
                      </button>
                    </div>

                    {/* Subtab: Gestión de usuarios */}
                    {adminSubTab === 'usuarios' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => setUserMgmtFilter('todos')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                userMgmtFilter === 'todos'
                                  ? 'bg-amber-400 text-neutral-950 shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Gestionar todos los usuarios ({allSystemUsers.length})
                            </button>
                            <button
                              onClick={() => setUserMgmtFilter('eliminados')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                userMgmtFilter === 'eliminados'
                                  ? 'bg-rose-500 text-white shadow'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              Gestionar cuentas eliminadas ({deletedAccounts.length})
                            </button>
                          </div>
                        </div>

                        {userMgmtFilter === 'todos' ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                              <input
                                type="text"
                                value={userSearchQuery}
                                onChange={e => setUserSearchQuery(e.target.value)}
                                placeholder="Buscar usuario por nombre, @username o ciudad..."
                                className="w-full bg-white/10 text-white placeholder-white/40 pl-9 pr-3 py-2 rounded-xl text-xs border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                            </div>

                            <p className="text-[11px] text-white/60">
                              💡 Haz clic en cualquier usuario para ver toda su información, editar perfil, cambiar contraseña, rol, suspender o eliminar su cuenta.
                            </p>

                            <div className="space-y-2">
                              {filteredUsers.map(u => (
                                <div
                                  key={u.id}
                                  onClick={() => handleOpenUserEditor(u)}
                                  className="p-3 bg-white/5 hover:bg-white/[0.09] border border-white/10 rounded-2xl flex items-center justify-between gap-3 text-xs cursor-pointer transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={u.avatar || undefined}
                                      alt={u.name}
                                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                                          {u.name}
                                        </span>
                                        {u.isVerified && (
                                          <BadgeCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        )}
                                        {u.isSuspended && (
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                            Suspendido
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-white/60 block">
                                        @{u.username} · {u.city} {u.originCity ? `(${u.originCity})` : ''}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${
                                      u.staffRole === 'ADMIN'
                                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                        : u.staffRole === 'MOD'
                                        ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                                        : u.staffRole === 'Soporte'
                                        ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                                        : 'bg-white/10 text-white/70 border-white/10'
                                    }`}>
                                      {u.staffRole || 'Usuario'}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenUserEditor(u);
                                      }}
                                      className="px-2.5 py-1 bg-white/10 group-hover:bg-amber-400 group-hover:text-neutral-950 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Gestionar</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Retention Policy Banner */}
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div className="text-[11px] text-amber-200/90 leading-relaxed">
                                <span className="font-bold text-amber-300 block mb-0.5">Período de retención de 7 días activo:</span>
                                Al eliminarse una cuenta, su nombre de usuario e información quedan protegidos durante 7 días para posibilitar su recuperación. Cumplido este plazo o al pulsar &quot;Purgar Ahora&quot;, el nombre de usuario se liberará de forma definitiva.
                              </div>
                            </div>

                            {deletedAccounts.length === 0 ? (
                              <p className="text-xs text-white/50 text-center p-4 bg-white/5 rounded-xl">
                                No hay cuentas eliminadas en el baúl de retención.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {deletedAccounts.map(d => {
                                  let daysRemainingText = '7 días';
                                  let isExpired = false;
                                  if (d.retentionExpiresAt) {
                                    const diffMs = new Date(d.retentionExpiresAt).getTime() - Date.now();
                                    if (diffMs <= 0) {
                                      daysRemainingText = 'Plazo vencido';
                                      isExpired = true;
                                    } else {
                                      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                      daysRemainingText = `${days} día${days > 1 ? 's' : ''} restantes`;
                                    }
                                  }

                                  const formattedDate = d.deletedAt?.includes('T') 
                                    ? new Date(d.deletedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : d.deletedAt;

                                  const userObj: UserProfile = {
                                    id: d.userId,
                                    username: d.username,
                                    name: d.name,
                                    avatar: d.avatar,
                                    email: d.email || '',
                                    city: (d.profileData?.city as SpanishCity) || 'Madrid',
                                    originCity: d.profileData?.originCity || 'Colombia',
                                    bio: d.profileData?.bio || '',
                                    followersCount: d.profileData?.followersCount || 0,
                                    followingCount: d.profileData?.followingCount || 0,
                                    postsCount: d.profileData?.postsCount || 0,
                                    isDeleted: true,
                                    ...d.profileData
                                  };

                                  return (
                                    <div
                                      key={d.id}
                                      onClick={() => handleOpenUserEditor(userObj)}
                                      className="p-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-all"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <img
                                          src={d.avatar || undefined}
                                          alt={d.name}
                                          className="w-10 h-10 rounded-full object-cover opacity-70 border border-white/10 shrink-0"
                                        />
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-white text-xs">{d.name}</span>
                                            <span className="text-amber-400 font-mono text-[11px]">@{d.username}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                                              isExpired ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            }`}>
                                              <Clock className="w-2.5 h-2.5" />
                                              <span>{daysRemainingText}</span>
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-white/60 block mt-0.5">
                                            Eliminado el {formattedDate} · <span className="text-rose-300/80">{d.reason}</span>
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                                        <button
                                          onClick={() => restoreDeletedAccount(d.id)}
                                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                          title="Restaurar y reactivar esta cuenta"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Restaurar</span>
                                        </button>
                                        <button
                                          onClick={() => permanentlyDeleteAccount(d.id)}
                                          className="px-2.5 py-1.5 bg-rose-600/70 hover:bg-rose-600 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                          title="Purgar ahora y liberar el nombre de usuario de forma permanente"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>Purgar</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtab: Solicitud de verificación */}
                    {adminSubTab === 'verificacion' && (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-amber-300 block">
                          Solicitudes de Insignia Oficial de Verificación
                        </span>

                        {verificationRequests.length === 0 ? (
                          <div className="p-4 text-center text-white/50 bg-white/5 rounded-2xl text-xs">
                            No hay solicitudes de verificación pendientes.
                          </div>
                        ) : (
                          verificationRequests.map(v => (
                            <div
                              key={v.id}
                              className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img src={v.avatar || undefined} alt={v.name} className="w-8 h-8 rounded-full object-cover" />
                                  <div>
                                    <span className="font-bold text-white block">{v.name} (@{v.username})</span>
                                    <span className="text-[10px] text-white/60">{v.city} · Solicitado el {v.date}</span>
                                  </div>
                                </div>

                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  v.status === 'pendiente' ? 'bg-amber-400/20 text-amber-300' : v.status === 'aprobado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {v.status.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-white/80 bg-black/20 p-2 rounded-xl text-[11px] leading-relaxed">
                                <strong>Motivo:</strong> {v.reason} ({v.documentType}: {v.documentNumber})
                              </p>

                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {v.status === 'pendiente' ? (
                                  <>
                                    <button
                                      onClick={() => respondVerification(v.id, true)}
                                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Aprobar</span>
                                    </button>
                                    <button
                                      onClick={() => respondVerification(v.id, false)}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Rechazar</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-white/50 italic">
                                    Solicitud procesada como: <strong>{v.status}</strong>
                                  </span>
                                )}

                                {/* Botón: Abrir Chat Privado */}
                                <button
                                  onClick={() => handleOpenPrivateChatWithUser(v.userId)}
                                  className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-lg text-[10px] flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ml-auto"
                                  title="Abrir chat privado con este usuario"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Abrir Chat Privado</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Subtab: Miembros del STAFF */}
                    {adminSubTab === 'staff' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300">
                            Equipo del STAFF de La Tierrita ({staffMembers.length})
                          </span>
                          <button
                            onClick={() => setShowAddStaffModal(true)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Añadir Miembro al STAFF</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {staffMembers.map(st => (
                            <div
                              key={st.id}
                              className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <img src={st.avatar || undefined} alt={st.name} className="w-9 h-9 rounded-full object-cover" />
                                <div>
                                  <span className="font-bold text-white block">{st.name}</span>
                                  <span className="text-[10px] text-white/60 block">
                                    @{st.username} · PIN: <strong className="text-amber-300">{st.pin}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-white/60 font-medium hidden sm:inline">Rango:</label>
                                <select
                                  value={st.role}
                                  onChange={e => updateStaffMemberRole(st.id, e.target.value as StaffRole)}
                                  className="bg-[#002466] text-amber-300 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none cursor-pointer"
                                >
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="Soporte">Soporte</option>
                                  <option value="MOD">MOD</option>
                                  <option value="Usuario">Usuario (Remover de STAFF)</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subtab: Publicidad Emergente (Popup) */}
                    {adminSubTab === 'popup_emergente' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-amber-300">
                              Configuración de Publicidad Flotante al Iniciar
                            </h4>
                            <p className="text-[10px] text-white/50">
                              Este anuncio emergente se le abre a todos los parceros la primera vez que abren la app.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              simulateAppRestart();
                            }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <span>Probar / Forzar Apertura</span>
                          </button>
                        </div>

                        <form onSubmit={handleSavePopupConfig} className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <div className="flex items-center justify-between p-3 bg-[#002466]/40 border border-white/10 rounded-xl">
                            <span className="text-xs font-bold text-white">¿Mostrar publicidad al iniciar la app?</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={popupActive}
                                onChange={e => setPopupActive(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Título del Anuncio *
                              </label>
                              <input
                                type="text"
                                value={popupTitle}
                                onChange={e => setPopupTitle(e.target.value)}
                                placeholder="ej. Gran Festival Tricolor 2026"
                                required
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Subtítulo / Ubicaciones
                              </label>
                              <input
                                type="text"
                                value={popupSubtitle}
                                onChange={e => setPopupSubtitle(e.target.value)}
                                placeholder="ej. 🇨🇴 Madrid & Barcelona"
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Badge Superior de Esquina (Texto)
                              </label>
                              <input
                                type="text"
                                value={popupBadgeText}
                                onChange={e => setPopupBadgeText(e.target.value)}
                                placeholder="ej. Publicidad Oficial STAFF"
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Badge de Descuento
                              </label>
                              <input
                                type="text"
                                value={popupDiscountBadge}
                                onChange={e => setPopupDiscountBadge(e.target.value)}
                                placeholder="ej. 20% Dcto Exclusivo"
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-white/70 mb-1">
                              Imagen del Anuncio Emergente *
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={popupImageUrl}
                                onChange={e => setPopupImageUrl(e.target.value)}
                                placeholder="Pega la URL o elige de tu galería..."
                                required
                                className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                              <label className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 text-xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Galería</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => handleFileSelect(e, setPopupImageUrl)}
                                />
                              </label>
                            </div>
                          </div>

                          {popupImageUrl && (
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/20 group">
                              <img src={popupImageUrl} alt="Preview Popup" className="w-full h-full object-cover" />
                              <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">
                                Vista Previa Anuncio Emergente
                              </span>
                              <button
                                type="button"
                                onClick={() => setPopupImageUrl('')}
                                className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                                title="Quitar imagen"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-white/70 mb-1">
                              Descripción Completa
                            </label>
                            <textarea
                              value={popupDescription}
                              onChange={e => setPopupDescription(e.target.value)}
                              rows={3}
                              placeholder="¡El mayor encuentro cultural y musical de colombianos en España!..."
                              className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Código de Descuento
                              </label>
                              <input
                                type="text"
                                value={popupDiscountCode}
                                onChange={e => setPopupDiscountCode(e.target.value)}
                                placeholder="ej. LATIE2026"
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Validez / Duración
                              </label>
                              <input
                                type="text"
                                value={popupDiscountValidity}
                                onChange={e => setPopupDiscountValidity(e.target.value)}
                                placeholder="ej. Válido 48h"
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Texto del Botón (CTA)
                              </label>
                              <input
                                type="text"
                                value={popupCtaText}
                                onChange={e => setPopupCtaText(e.target.value)}
                                placeholder="ej. Ver Boletos y Reservar"
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-white/70 mb-1">
                                Enlace del Botón (CTA)
                              </label>
                              <input
                                type="url"
                                value={popupCtaUrl}
                                onChange={e => setPopupCtaUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Guardar Configuración de Publicidad de Inicio</span>
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Subtab: Documentación */}
                    {adminSubTab === 'documentacion' && (
                      <div className="space-y-3 text-xs text-white/80 leading-relaxed">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                          <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>Manual Interno & Políticas del STAFF</span>
                          </h4>
                          <p>
                            1. <strong>Directrices de Publicidad:</strong> Todos los anuncios de carrusel deben contener imagen en alta resolución y un CTA de mínimo 10 caracteres.
                          </p>
                          <p>
                            2. <strong>Moderación de Publicaciones:</strong> Eliminar publicaciones que infrinjan derechos de autor o atenten contra la seguridad de miembros.
                          </p>
                          <p>
                            3. <strong>Respuesta a Tickets:</strong> Los tickets prioritarios (Soporte o Reportes Graves) deben atenderse en menos de 24 horas.
                          </p>
                          <p>
                            4. <strong>Gestión de Cuentas:</strong> Se aplica política de retención de 7 días antes de purgar definitivamente cualquier usuario.
                          </p>
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2.5">
                          <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span>⚠️ IMPORTANTE: Resolver Bloqueo de Publicaciones (RLS de Supabase)</span>
                          </h4>
                          <p>
                            Si notas que tú o los usuarios de la comunidad publican fotos o historias, pero al refrescar la página <strong>desaparecen</strong> o <strong>los demás parceros no pueden verlas</strong>, se debe a que la base de datos de tu VPS tiene activado el sistema de seguridad de filas (RLS) de Supabase en las tablas <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">posts</code> y <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">stories</code>, pero faltan las políticas que autorizan la inserción.
                          </p>
                          <p>
                            Para resolverlo de forma inmediata, entra al panel de tu Supabase (SQL Editor) o accede por terminal y ejecuta la siguiente consulta SQL:
                          </p>
                          <pre className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-[10px] text-emerald-300 overflow-x-auto whitespace-pre leading-normal">
{`-- 1. Políticas de escritura (INSERT) libre para posts e historias
CREATE POLICY "Permitir inserciones públicas posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserciones públicas stories" ON stories FOR INSERT WITH CHECK (true);

-- 2. Asegurar lectura pública (SELECT) para todos
CREATE POLICY "Permitir lectura pública posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública stories" ON stories FOR SELECT USING (true);

-- 3. Opcional: Desactivar RLS por completo si quieres máxima compatibilidad
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;`}
                          </pre>
                          <p className="text-white/60">
                            *Nota: Al aplicar este SQL, el bloqueo se levantará inmediatamente en tiempo real y todas las publicaciones quedarán grabadas de forma permanente para todos los usuarios.*
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL / SHEET: DETALLE Y EDICIÓN COMPLETA DE USUARIO */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          <div className="bg-[#001f5c] border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
            {/* Header */}
            <div className="p-4 bg-[#002b80] border-b border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForEdit.avatar || undefined}
                  alt={selectedUserForEdit.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-white">{selectedUserForEdit.name}</h3>
                    {selectedUserForEdit.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-white/70">
                    <span className="text-amber-300 font-mono">@{selectedUserForEdit.username}</span>
                    <span>·</span>
                    <span className="text-white/50">{selectedUserForEdit.email || 'Sin correo'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPrivateChatWithUser(selectedUserForEdit.id)}
                  className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow"
                  title="Abrir chat privado"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chat Privado</span>
                </button>
                <button
                  onClick={() => setSelectedUserForEdit(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* User Editor Navigation Tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#001845] border-b border-white/10 overflow-x-auto text-xs">
              <button
                onClick={() => setUserEditorSection('perfil')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  userEditorSection === 'perfil'
                    ? 'bg-amber-400 text-neutral-950 shadow'
                    : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                ✏️ Editar Perfil
              </button>
              <button
                onClick={() => setUserEditorSection('password')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  userEditorSection === 'password'
                    ? 'bg-amber-400 text-neutral-950 shadow'
                    : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                🔑 Cambiar Contraseña
              </button>
              <button
                onClick={() => setUserEditorSection('rol')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  userEditorSection === 'rol'
                    ? 'bg-amber-400 text-neutral-950 shadow'
                    : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                🛡️ Cambiar Rol ({selectedUserForEdit.staffRole || 'Usuario'})
              </button>
              <button
                onClick={() => setUserEditorSection('suspender')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  userEditorSection === 'suspender'
                    ? 'bg-amber-400 text-neutral-950 shadow'
                    : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                {selectedUserForEdit.isSuspended ? '🟢 Activar Cuenta' : '⏸️ Suspender Cuenta'}
              </button>
              <button
                onClick={() => setUserEditorSection('eliminar')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  userEditorSection === 'eliminar'
                    ? 'bg-rose-500 text-white shadow'
                    : 'bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                🗑️ Eliminar / Purgar
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* SECTION 1: EDIT PROFILE */}
              {userEditorSection === 'perfil' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Nombre de Usuario (@)</label>
                      <input
                        type="text"
                        value={editFormData.username || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, username: e.target.value.replace('@', '') }))}
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={editFormData.phone || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+34 600 000 000"
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Ciudad de Residencia en España</label>
                      <select
                        value={editFormData.city || 'Madrid'}
                        onChange={e => setEditFormData(prev => ({ ...prev, city: e.target.value as SpanishCity }))}
                        className="w-full bg-[#001845] text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                      >
                        {SPANISH_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Ciudad de Origen en Colombia</label>
                      <input
                        type="text"
                        value={editFormData.originCity || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, originCity: e.target.value }))}
                        placeholder="Ej: Medellín, Bogotá, Cali..."
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">URL Avatar / Foto de Perfil</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editFormData.avatar || ''}
                        onChange={e => setEditFormData(prev => ({ ...prev, avatar: e.target.value }))}
                        className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random()*1000)}?w=400&auto=format&fit=crop&q=80` }))}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Aleatorio</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">Biografía</label>
                    <textarea
                      rows={2}
                      value={editFormData.bio || ''}
                      onChange={e => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Biografía del usuario..."
                      className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">Sitio Web / Enlace</label>
                    <input
                      type="text"
                      value={editFormData.website || ''}
                      onChange={e => setEditFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {/* Verification checkbox */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <div>
                        <span className="font-bold text-white block">Insignia Oficial de Verificación</span>
                        <span className="text-[10px] text-white/60">Marca la cuenta como verificada por el STAFF</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(editFormData.isVerified)}
                      onChange={e => setEditFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                      className="w-5 h-5 accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveUserProfile}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios del Perfil</span>
                  </button>
                </div>
              )}

              {/* SECTION 2: CHANGE PASSWORD */}
              {userEditorSection === 'password' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      <span>Asignar o Cambiar Contraseña del Usuario</span>
                    </h4>
                    <p className="text-white/70 text-xs">
                      Permite al STAFF establecer una nueva contraseña directamente para la cuenta de <strong>@{selectedUserForEdit.username}</strong>.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-white block mb-1">Nueva Contraseña</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editNewPassword}
                          onChange={e => setEditNewPassword(e.target.value)}
                          placeholder="Introduce la nueva contraseña..."
                          className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateRandomPassword}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Generar Segura</span>
                        </button>
                      </div>
                    </div>

                    {passwordFeedback && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold ${
                        passwordFeedback.includes('✅')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {passwordFeedback}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleApplyPasswordChange}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Guardar Nueva Contraseña</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 3: CHANGE ROLE */}
              {userEditorSection === 'rol' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Asignar Rol y Privilegios en el STAFF</span>
                    </h4>
                    <p className="text-white/70 text-xs">
                      Selecciona el nivel de acceso y rango administrativo para <strong>@{selectedUserForEdit.username}</strong>:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Usuario Regular */}
                      <button
                        type="button"
                        onClick={() => handleChangeUserRole('Usuario')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          (!selectedUserForEdit.staffRole || selectedUserForEdit.staffRole === 'Usuario')
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">Usuario</span>
                          {(!selectedUserForEdit.staffRole || selectedUserForEdit.staffRole === 'Usuario') && (
                            <Check className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-white/60">Miembro regular de la comunidad sin permisos de STAFF.</span>
                      </button>

                      {/* MOD */}
                      <button
                        type="button"
                        onClick={() => handleChangeUserRole('MOD')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selectedUserForEdit.staffRole === 'MOD'
                            ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">MOD (Moderador)</span>
                          {selectedUserForEdit.staffRole === 'MOD' && (
                            <Check className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-white/60">Moderación de clasificados, reportes y publicaciones.</span>
                      </button>

                      {/* Soporte */}
                      <button
                        type="button"
                        onClick={() => handleChangeUserRole('Soporte')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selectedUserForEdit.staffRole === 'Soporte'
                            ? 'bg-emerald-400/20 border-emerald-400 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">Soporte</span>
                          {selectedUserForEdit.staffRole === 'Soporte' && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-white/60">Atención de tickets TS y solicitudes de usuarios.</span>
                      </button>

                      {/* ADMIN */}
                      <button
                        type="button"
                        onClick={() => handleChangeUserRole('ADMIN')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selectedUserForEdit.staffRole === 'ADMIN'
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">ADMIN (Administrador)</span>
                          {selectedUserForEdit.staffRole === 'ADMIN' && (
                            <Check className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-white/60">Control total del panel STAFF, carruseles y gestión de usuarios.</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: SUSPEND / ACTIVATE */}
              {userEditorSection === 'suspender' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Estado de la Cuenta y Sanciones</span>
                    </h4>

                    {selectedUserForEdit.isSuspended ? (
                      <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <UserX className="w-5 h-5" />
                          <span>Esta cuenta se encuentra actualmente SUSPENDIDA</span>
                        </div>
                        <p className="text-white/80 text-xs">
                          <strong>Motivo:</strong> {selectedUserForEdit.suspendedReason || 'Incumplimiento de normas comunitarias'}
                        </p>
                        {selectedUserForEdit.suspendedAt && (
                          <span className="text-[10px] text-white/50 block">
                            Suspendida el {new Date(selectedUserForEdit.suspendedAt).toLocaleDateString('es-ES')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleToggleSuspend}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all mt-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Activar / Reactivar Cuenta Ahora</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white/70 text-xs">
                          La cuenta de <strong>@{selectedUserForEdit.username}</strong> está <strong>Activa</strong>. Puedes suspenderla temporalmente para restringir su acceso.
                        </p>

                        <div>
                          <label className="text-[11px] font-bold text-amber-300 block mb-1">Motivo de la Suspensión</label>
                          <input
                            type="text"
                            value={suspendReasonInput}
                            onChange={e => setSuspendReasonInput(e.target.value)}
                            placeholder="Ej: Violación de normas comunitarias, conducta indebida..."
                            className="w-full bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleSuspend}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Suspender Cuenta Temporalmente</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 5: DELETE / RESTORE / PURGE */}
              {userEditorSection === 'eliminar' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <h4 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Gestión de Eliminación y Retención (7 Días)</span>
                    </h4>

                    {selectedUserForEdit.isDeleted ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl space-y-1">
                          <span className="font-bold text-amber-300 block">Esta cuenta está marcada como Eliminada (En Retención)</span>
                          <span className="text-[10px] text-white/70">
                            Puedes restaurarla para devolverle el acceso o purgarla inmediatamente.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleRestoreUserAccount}
                            className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Recuperar / Restaurar Cuenta</span>
                          </button>
                          <button
                            type="button"
                            onClick={handlePermanentlyPurgeUserAccount}
                            className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar Definitivamente (Purgar Ya)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white/70 text-xs">
                          Opciones de eliminación para <strong>@{selectedUserForEdit.username}</strong>:
                        </p>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                          <span className="font-bold text-white block text-xs">1. Eliminar Cuenta (Retención de 7 Días)</span>
                          <p className="text-[11px] text-white/60">
                            Desactiva la cuenta y la envía al baúl de retención por 7 días, permitiendo recuperarla si el usuario lo solicita.
                          </p>
                          <button
                            type="button"
                            onClick={handleDeleteUserAccount}
                            className="w-full py-2 bg-amber-500/30 hover:bg-amber-500 text-amber-200 hover:text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-amber-400/40"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Eliminar Cuenta (Con Retención 7 Días)</span>
                          </button>
                        </div>

                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                          <span className="font-bold text-rose-300 block text-xs">2. Eliminar Definitivamente (Purgar Inmediatamente)</span>
                          <p className="text-[11px] text-white/60">
                            Elimina por completo todos los registros de la base de datos y libera el nombre de usuario de forma permanente.
                          </p>
                          <button
                            type="button"
                            onClick={handlePermanentlyPurgeUserAccount}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar Definitivamente</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#001845] border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-[11px] text-white/50">ID: {selectedUserForEdit.id}</span>
              <button
                type="button"
                onClick={() => setSelectedUserForEdit(null)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl cursor-pointer transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AÑADIR MIEMBRO AL STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#001f5c] border border-white/20 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Añadir Nuevo Miembro al STAFF</span>
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Seleccionar Usuario</label>
              <select
                value={newStaffUserId}
                onChange={e => setNewStaffUserId(e.target.value)}
                className="w-full bg-[#001845] text-white px-3 py-2 rounded-xl border border-white/20 text-xs focus:ring-1 focus:ring-amber-400"
              >
                <option value="">-- Elige un usuario registrado --</option>
                {allSystemUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username}) - {u.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Rango a Asignar</label>
              <select
                value={newStaffRole}
                onChange={e => setNewStaffRole(e.target.value as StaffRole)}
                className="w-full bg-[#001845] text-amber-300 font-bold px-3 py-2 rounded-xl border border-white/20 text-xs focus:ring-1 focus:ring-amber-400"
              >
                <option value="MOD">MOD (Moderador)</option>
                <option value="Soporte">Soporte</option>
                <option value="ADMIN">ADMIN (Administrador)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddStaffMember}
                disabled={!newStaffUserId}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 rounded-xl text-xs font-black cursor-pointer shadow transition-all"
              >
                Asignar al STAFF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
