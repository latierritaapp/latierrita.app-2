import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Heart,
  PlusSquare,
  Shield,
  Settings,
  ArrowLeft,
  MapPin,
  Megaphone,
  MessageCircle,
  Search,
  X,
  Send,
  BadgeCheck,
  MoreHorizontal,
  Share2,
  ShieldAlert,
  UserX
} from 'lucide-react';
import { LaTierritaLogo } from './LaTierritaLogo';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    exploreSearchQuery,
    setExploreSearchQuery,
    placesSubTab,
    setPlacesSubTab,
    chatTypeTab,
    setChatTypeTab,
    chatRooms,
    setActiveChatId,
    groupInvites,
    unreadNotificationsCount,
    setIsCreatePostOpen,
    setIsCreateMenuOpen,
    setIsStaffAdminOpen,
    isStaffMode,
    setIsStaffMode,
    currentUser,
    selectedUserProfile,
    setSelectedUserProfile,
    setIsSettingsOpen,
    otherUsers,
    openReportModal,
    blockUser,
    triggerPlushNotification
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const isExploreView = activeTab === 'explore';
  const isProfileView = activeTab === 'profile';
  const isChatsView = activeTab === 'chats';
  const isPlacesView = activeTab === 'places';
  const displayedUser = selectedUserProfile
    ? ((selectedUserProfile.id === currentUser.id || selectedUserProfile.username === currentUser.username)
        ? currentUser
        : (otherUsers.find(u => u.id === selectedUserProfile.id || u.username === selectedUserProfile.username || (selectedUserProfile.email && u.email === selectedUserProfile.email)) || selectedUserProfile))
    : currentUser;

  const isVisitingOtherProfile = isProfileView && Boolean(selectedUserProfile) && selectedUserProfile?.id !== currentUser.id && selectedUserProfile?.username !== currentUser.username;

  const pendingInvitesCount = (groupInvites || []).filter(i => i.status === 'pending').length;

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Enlace copiado',
      message: `El enlace al perfil de @${displayedUser.username} se copió al portapapeles.`
    });
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 glass-header shadow-lg transition-all text-white">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 relative flex items-center justify-between">
        {/* CASE 1: EXPLORAR HEADER (Logo a la izquierda, barra de búsqueda al lado derecho, sin botón + ni corazón) */}
        {isExploreView ? (
          <div className="w-full flex items-center justify-between gap-3">
            {/* Logo al lado izquierdo */}
            <button
              id="nav-brand-logo-explore"
              onClick={() => setActiveTab('feed')}
              className="flex items-center shrink-0 focus:outline-none transition-transform active:scale-95 py-0.5"
              title="Ir al inicio de La Tierrita"
            >
              <LaTierritaLogo className="h-9 sm:h-10 w-auto max-w-[130px] sm:max-w-[160px] drop-shadow-md hover:brightness-105 transition-all" />
            </button>

            {/* Barra de búsqueda al lado derecho */}
            <div className="flex-1 max-w-xs sm:max-w-sm relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-navbar-explore-search"
                type="text"
                value={exploreSearchQuery}
                onChange={e => setExploreSearchQuery(e.target.value)}
                placeholder="Buscar parceros, ciudades..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white/10 hover:bg-white/15 focus:bg-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/15 transition-all"
              />
              {exploreSearchQuery && (
                <button
                  onClick={() => setExploreSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : isPlacesView ? (
          /* CASE 2: LUGARES & ANUNCIOS HEADER */
          <div className="w-full flex items-center justify-center gap-2">
            <button
              id="btn-header-tab-places"
              onClick={() => setPlacesSubTab('places')}
              className={`flex-1 max-w-[200px] py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                placesSubTab === 'places'
                  ? 'bg-amber-400 text-neutral-950 font-black ring-1 ring-amber-300'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${placesSubTab === 'places' ? 'stroke-[2.5]' : ''}`} />
              <span>Lugares</span>
            </button>

            <button
              id="btn-header-tab-ads"
              onClick={() => setPlacesSubTab('ads')}
              className={`flex-1 max-w-[200px] py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                placesSubTab === 'ads'
                  ? 'bg-amber-400 text-neutral-950 font-black ring-1 ring-amber-300'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
              }`}
            >
              <Megaphone className={`w-3.5 h-3.5 ${placesSubTab === 'ads' ? 'stroke-[2.5]' : ''}`} />
              <span>Anuncios</span>
            </button>
          </div>
        ) : isChatsView ? (
          /* CASE 2: CHATS HEADER WITH 3 SUB-TABS (NO LOGO) */
          <div className="w-full grid grid-cols-3 gap-1.5 py-1">
            {/* Tab 1: Chat general */}
            <button
              id="btn-nav-chat-general"
              onClick={() => {
                setChatTypeTab('general');
                const gen = chatRooms.find(r => r.type === 'general');
                if (gen) setActiveChatId(gen.id);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 active:scale-95 ${
                chatTypeTab === 'general'
                  ? 'bg-amber-400 text-neutral-950 shadow font-black'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              <span className="truncate">Comunidad</span>
            </button>

            {/* Tab 2: Chat por ciudad */}
            <button
              id="btn-nav-chat-city"
              onClick={() => {
                setChatTypeTab('city');
                const cityRoom =
                  chatRooms.find(r => r.type === 'city' && r.city === currentUser.city) ||
                  chatRooms.find(r => r.type === 'city');
                if (cityRoom) setActiveChatId(cityRoom.id);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 truncate active:scale-95 ${
                chatTypeTab === 'city'
                  ? 'bg-rose-500 text-white shadow font-black'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              <span className="truncate">{currentUser.city || 'Ciudad'}</span>
            </button>

            {/* Tab 3: Chats privados */}
            <button
              id="btn-nav-chat-private"
              onClick={() => {
                setChatTypeTab('messages');
                setActiveChatId(null);
              }}
              className={`relative py-2 px-1 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 active:scale-95 ${
                chatTypeTab === 'messages'
                  ? 'bg-sky-400 text-neutral-950 shadow font-black'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
              title="Chats privados y grupales"
            >
              <Send className="w-4 h-4 shrink-0" />
              {pendingInvitesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-sky-300 ring-1 ring-white shrink-0 animate-pulse" />
              )}
            </button>
          </div>
        ) : (
          /* CASE 3: STANDARD HEADER (Feed, Explore, Notifications, Profile) */
          <>
            {/* 1. Izquierda */}
            <div className="flex items-center min-w-[40px]">
              {isVisitingOtherProfile ? (
                <button
                  id="btn-nav-profile-back"
                  onClick={() => setSelectedUserProfile(null)}
                  className="flex items-center gap-1 text-xs font-bold text-white hover:text-amber-400 transition-colors active:scale-95 py-1 px-2.5 rounded-full bg-white/10 hover:bg-white/20"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                  <span>Volver</span>
                </button>
              ) : (
                <button
                  id="btn-nav-create-menu"
                  onClick={() => setIsCreateMenuOpen(true)}
                  className="p-2 text-white/90 hover:text-amber-400 rounded-full hover:bg-white/10 transition-all active:scale-95"
                  title="Crear contenido"
                >
                  <PlusSquare className="w-6 h-6 stroke-[2]" />
                </button>
              )}
            </div>

            {/* 2. Centro */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[60%] truncate text-center">
              {isProfileView ? (
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white select-none">
                    @{displayedUser.username ? displayedUser.username.replace(/^@+/, '').split('@')[0] : 'usuario'}
                  </span>
                  {displayedUser.isVerified && (
                    <span title="Usuario Verificado" className="inline-flex shrink-0">
                      <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0 inline-block" />
                    </span>
                  )}
                </div>
              ) : (
                <button
                  id="nav-brand-logo"
                  onClick={() => setActiveTab('feed')}
                  className="flex items-center justify-center focus:outline-none transition-transform active:scale-95 py-0.5"
                  title="Ir al inicio de La Tierrita"
                >
                  <LaTierritaLogo className="h-9 sm:h-10 w-auto max-w-[170px] drop-shadow-md hover:brightness-105 transition-all" />
                </button>
              )}
            </div>

            {/* 3. Derecha */}
            <div className="flex items-center justify-end min-w-[40px] gap-1.5">
              {isVisitingOtherProfile ? (
                <div className="relative">
                  <button
                    id="btn-nav-profile-options"
                    onClick={() => setShowUserMenu(prev => !prev)}
                    className="p-2 text-white/90 hover:text-amber-400 rounded-full hover:bg-white/10 transition-colors active:scale-95"
                    title="Opciones del usuario"
                  >
                    <MoreHorizontal className="w-6 h-6 stroke-[2]" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl py-1 z-50 animate-fade-in-up">
                      <button
                        onClick={handleShareProfile}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-white hover:bg-white/10 flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4 text-amber-400" />
                        <span>Compartir perfil</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          openReportModal({
                            id: displayedUser.id,
                            type: 'user',
                            title: `Usuario @${displayedUser.username}`,
                            reportedUserId: displayedUser.id,
                            reportedUserName: displayedUser.name,
                            initialTicketType: 'TRU'
                          });
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-amber-300 hover:bg-white/10 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Reportar usuario</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          blockUser(displayedUser.id, displayedUser.username);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-white/10 flex items-center gap-2"
                      >
                        <UserX className="w-4 h-4 text-rose-400" />
                        <span>Bloquear usuario</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : isProfileView ? (
                <button
                  id="btn-nav-settings"
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-white/90 hover:text-amber-400 rounded-full hover:bg-white/10 transition-colors active:scale-95"
                  title="Configuración y opciones"
                >
                  <Settings className="w-6 h-6 stroke-[2]" />
                </button>
              ) : (
                <>
                  {/* Staff Mode Pill */}
                  {currentUser && currentUser.staffRole && currentUser.staffRole !== 'Usuario' && (
                    <button
                      id="btn-toggle-staff-mode"
                      onClick={() => {
                        setIsStaffMode(prev => !prev);
                        if (!isStaffMode) setIsStaffAdminOpen(true);
                      }}
                      className={`hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${
                        isStaffMode
                          ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                          : 'bg-white/15 text-white/90 hover:bg-white/25 hover:text-white'
                      }`}
                      title="Panel de administración de publicidad STAFF"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>STAFF</span>
                    </button>
                  )}

                  {/* Botón de Notificaciones */}
                  <button
                    id="btn-nav-notifications"
                    onClick={() => setActiveTab('notifications')}
                    className={`relative p-2 text-white/90 hover:text-rose-400 rounded-full hover:bg-white/10 transition-colors active:scale-95 ${
                      activeTab === 'notifications' ? 'text-rose-400' : ''
                    }`}
                    title="Notificaciones"
                  >
                    <Heart className={`w-5 h-5 ${activeTab === 'notifications' ? 'fill-rose-400 text-rose-400' : ''}`} />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#003087]" />
                    )}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
