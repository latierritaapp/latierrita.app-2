import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp, isFictitiousUser } from '../context/AppContext';
import {
  Heart,
  Plus,
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
  UserX,
  Users,
  ChevronRight
} from 'lucide-react';
import { LaTierritaLogo } from './LaTierritaLogo';
import { VerifiedBadge } from './VerifiedBadge';
import { UserProfile } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    exploreSearchQuery,
    setExploreSearchQuery,
    chatSearchQuery,
    setChatSearchQuery,
    placesSearchQuery,
    setPlacesSearchQuery,
    adsSearchQuery,
    setAdsSearchQuery,
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
    posts,
    openReportModal,
    blockUser,
    triggerPlushNotification
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isExploreView = activeTab === 'explore';
  const isProfileView = activeTab === 'profile';
  const isChatsView = activeTab === 'chats';
  const isPlacesView = activeTab === 'places';
  const displayedUser = selectedUserProfile
    ? ((selectedUserProfile.id === currentUser.id || selectedUserProfile.username === currentUser.username)
        ? currentUser
        : (otherUsers.find(u => u.id === selectedUserProfile.id || u.username === selectedUserProfile.username || (selectedUserProfile.email && u.email === selectedUserProfile.email)) || selectedUserProfile))
    : currentUser;

  const isGuestUser = Boolean(
    currentUser?.isGuest ||
    currentUser?.id?.startsWith('guest-') ||
    currentUser?.id === 'user-guest' ||
    (currentUser?.username && /^user-\d+$/i.test(currentUser.username))
  );

  const isVisitingOtherProfile = isProfileView && Boolean(selectedUserProfile) && selectedUserProfile?.id !== currentUser.id && selectedUserProfile?.username !== currentUser.username;

  const pendingInvitesCount = (groupInvites || []).filter(i => i.status === 'pending').length;

  const unreadMessagesCount = useMemo(() => {
    return (chatRooms || [])
      .filter(r => r.type === 'private')
      .reduce((acc, r) => acc + (r.unreadCount || 0), 0);
  }, [chatRooms]);

  // Compile a comprehensive list of unique real users available for search
  const allSearchableUsers = useMemo(() => {
    const list: UserProfile[] = [];
    const seen = new Set<string>();

    const addIfNew = (u: UserProfile | null | undefined) => {
      if (!u || !u.id || !u.username) return;
      if (u.isDeleted || (u as any).is_deleted) return;
      const key = (u.username || u.id).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(u);
      }
    };

    // 1. Official / staff account if present
    const official = (otherUsers || []).find(u => u.email === 'latierritaapp@gmail.com' || u.username === 'latierrita_app');
    if (official) addIfNew(official);

    // 2. All other registered users
    (otherUsers || []).forEach(u => addIfNew(u));

    // 3. Authors from posts in case someone registered and posted recently
    (posts || []).forEach(p => {
      if (p.userId && p.username) {
        addIfNew({
          id: p.userId,
          username: p.username,
          name: p.username,
          avatar: p.userAvatar || '',
          bio: '',
          city: p.userCity || 'España',
          originCity: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isVerified: (p as any).isVerified || false,
          staffRole: (p as any).staffRole,
          createdAt: ''
        });
      }
    });

    // 4. Current user
    if (currentUser) {
      addIfNew(currentUser);
    }

    return list;
  }, [currentUser, otherUsers, posts]);

  // Filtered users matching search query (matches name, username, city, or originCity)
  const queryClean = exploreSearchQuery.trim().toLowerCase().replace(/^@/, '');
  const suggestedUsers = useMemo(() => {
    if (!queryClean) return [];

    return allSearchableUsers
      .filter(u => {
        if (currentUser && (u.id === currentUser.id || (u.username && currentUser.username && u.username.toLowerCase() === currentUser.username.toLowerCase()))) {
          return false;
        }
        const uUsername = (u.username || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        const uCity = (u.city || '').toLowerCase();
        const uOrigin = (u.originCity || '').toLowerCase();
        return (
          uUsername.includes(queryClean) ||
          uName.includes(queryClean) ||
          uCity.includes(queryClean) ||
          uOrigin.includes(queryClean)
        );
      })
      .slice(0, 8);
  }, [allSearchableUsers, queryClean, currentUser]);

  // Navigate directly to the selected user's profile
  const handleSelectSuggestedUser = (user: UserProfile) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acceso Limitado',
        message: 'Como invitado no puedes buscar usuarios ni visitar perfiles. Regístrate en la app para acceder a todas las funciones.'
      });
      setIsSearchDropdownOpen(false);
      setExploreSearchQuery('');
      return;
    }
    if (user.id === currentUser.id || user.username === currentUser.username) {
      setSelectedUserProfile(null);
    } else {
      setSelectedUserProfile(user);
    }
    setActiveTab('profile');
    setExploreSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation support for user search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestedUsers.length > 0) {
        setIsSearchDropdownOpen(true);
        setSelectedSuggestionIndex(prev => (prev + 1) % suggestedUsers.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestedUsers.length > 0) {
        setIsSearchDropdownOpen(true);
        setSelectedSuggestionIndex(prev => (prev - 1 + suggestedUsers.length) % suggestedUsers.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestedUsers.length > 0) {
        const targetUser = selectedSuggestionIndex >= 0 ? suggestedUsers[selectedSuggestionIndex] : suggestedUsers[0];
        if (targetUser) {
          handleSelectSuggestedUser(targetUser);
        }
      }
    }
  };

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
        {/* CASE 1: EXPLORAR HEADER (Logo a la izquierda, barra de búsqueda de usuarios con sugerencias al lado derecho) */}
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

            {/* Barra de búsqueda de usuarios al lado derecho */}
            <div className="flex-1 max-w-xs sm:max-w-sm relative" ref={searchContainerRef}>
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-navbar-explore-search"
                type="text"
                value={isGuestUser ? '' : exploreSearchQuery}
                readOnly={isGuestUser}
                onClick={() => {
                  if (isGuestUser) {
                    triggerPlushNotification({
                      type: 'system',
                      title: 'Acceso Limitado',
                      message: 'Como invitado no puedes buscar usuarios en la barra de búsqueda. Regístrate en la app para acceder a todas las funciones.'
                    });
                  }
                }}
                onChange={e => {
                  if (isGuestUser) return;
                  setExploreSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                  setSelectedSuggestionIndex(-1);
                }}
                onFocus={() => {
                  if (isGuestUser) {
                    triggerPlushNotification({
                      type: 'system',
                      title: 'Acceso Limitado',
                      message: 'Como invitado no puedes buscar usuarios en la barra de búsqueda. Regístrate en la app para acceder a todas las funciones.'
                    });
                    return;
                  }
                  if (exploreSearchQuery.trim()) {
                    setIsSearchDropdownOpen(true);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={isGuestUser ? 'Búsqueda no disponible para invitados' : 'Buscar usuarios o @parcero...'}
                autoComplete="off"
                className={`w-full pl-9 pr-8 py-2 text-xs rounded-full text-white placeholder-white/50 focus:outline-none border transition-all shadow-inner ${
                  isGuestUser
                    ? 'bg-white/5 border-white/10 opacity-70 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/15 focus:bg-white/20 focus:ring-1 focus:ring-amber-400 border-white/15 cursor-text'
                }`}
              />
              {exploreSearchQuery && (
                <button
                  onClick={() => {
                    setExploreSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Suggestions Dropdown for finding users */}
              {isSearchDropdownOpen && exploreSearchQuery.trim().length > 0 && (
                <div
                  id="dropdown-explore-user-suggestions"
                  className="absolute top-full right-0 w-72 sm:w-80 max-w-xs sm:max-w-sm mt-2 bg-neutral-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{ maxHeight: 'min(420px, 70vh)' }}
                >
                  {/* Dropdown Header */}
                  <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Parceros sugeridos</span>
                    </div>
                    {suggestedUsers.length > 0 && (
                      <span className="text-[10px] text-white/50 font-semibold">
                        {suggestedUsers.length} encontrado{suggestedUsers.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* List of matched users */}
                  <div className="divide-y divide-white/5 overflow-y-auto max-h-[300px] overscroll-contain">
                    {suggestedUsers.length > 0 ? (
                      suggestedUsers.map((user, idx) => {
                        const isSelected = selectedSuggestionIndex === idx;
                        const isOfficial = user.email === 'latierritaapp@gmail.com' || user.username === 'latierrita_app' || user.id === 'user-staff';
                        const isMe = user.id === currentUser.id || user.username === currentUser.username;
                        const initial = (user.name?.[0] || user.username?.[0] || 'P').toUpperCase();

                        return (
                          <div
                            key={user.id || user.username}
                            onClick={() => handleSelectSuggestedUser(user)}
                            onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                            className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-400/20 text-white' : 'hover:bg-white/10 text-white/90'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* User Avatar */}
                              <div className="relative shrink-0">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name || user.username}
                                    className="w-10 h-10 rounded-full object-cover border border-white/15 ring-1 ring-white/10"
                                    referrerPolicy="no-referrer"
                                    onError={e => {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 items-center justify-center font-bold text-neutral-950 text-sm shadow-sm ${
                                    user.avatar ? 'hidden' : 'flex'
                                  }`}
                                >
                                  {initial}
                                </div>
                                {isMe && (
                                  <div className="absolute -bottom-1 -right-1 px-1 rounded-full bg-amber-400 text-neutral-950 font-black text-[8px] uppercase tracking-tighter shadow">
                                    Tú
                                  </div>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-white truncate max-w-[130px]">
                                    {user.name || user.username}
                                  </span>
                                  {(user.isVerified || isOfficial) && (
                                    <VerifiedBadge size="sm" />
                                  )}
                                  {user.staffRole && user.staffRole !== 'Usuario' && (
                                    <span className="text-[9px] px-1.5 py-0.2 font-black uppercase rounded bg-amber-400/25 text-amber-300 border border-amber-400/40 leading-none">
                                      {user.staffRole}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-semibold text-amber-400/90 truncate">
                                  @{user.username}
                                </div>

                                <div className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                                  <span>{user.city || 'España'}{user.originCity ? ` · de ${user.originCity}` : ''}</span>
                                </div>
                              </div>
                            </div>

                            {/* View profile call-to-action */}
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400/80 group-hover:text-amber-300 shrink-0 pl-1">
                              <span>Ver</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* No results state */
                      <div className="py-6 px-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 text-white/40">
                          <UserX className="w-5 h-5 text-white/50" />
                        </div>
                        <p className="text-xs font-bold text-white mb-0.5">
                          Sin resultados para "{exploreSearchQuery}"
                        </p>
                        <p className="text-[11px] text-white/50 max-w-[200px] mx-auto">
                          Busca por nombre o nombre de usuario @parcero
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="px-3 py-1.5 bg-black/50 border-t border-white/10 text-[10px] text-white/40 flex items-center justify-between select-none">
                    <span>Haz clic en un parcero para ir a su perfil</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                      ESC
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isPlacesView ? (
          /* CASE 2: LUGARES Y ANUNCIOS HEADER (Título a la izquierda, barra de búsqueda al lado) */
          <div className="w-full flex items-center justify-between gap-3">
            {/* Título a la izquierda */}
            <div className="flex items-center gap-1.5 shrink-0">
              {placesSubTab === 'ads' ? (
                <>
                  <Megaphone className="w-5 h-5 text-amber-400 stroke-[2.2]" />
                  <span className="text-base sm:text-lg font-black tracking-tight text-white select-none">
                    Anuncios
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 text-amber-400 stroke-[2.2]" />
                  <span className="text-base sm:text-lg font-black tracking-tight text-white select-none">
                    Lugares
                  </span>
                </>
              )}
            </div>

            {/* Barra de búsqueda al lado derecho */}
            <div className="flex-1 max-w-xs sm:max-w-sm relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-navbar-places-ads-search"
                type="text"
                value={placesSubTab === 'ads' ? adsSearchQuery : placesSearchQuery}
                onChange={e => {
                  if (placesSubTab === 'ads') {
                    setAdsSearchQuery(e.target.value);
                  } else {
                    setPlacesSearchQuery(e.target.value);
                  }
                }}
                placeholder={
                  placesSubTab === 'ads'
                    ? 'Buscar anuncios, empleo, vivienda...'
                    : 'Buscar lugares, restaurantes, servicios...'
                }
                autoComplete="off"
                className="w-full pl-9 pr-8 py-2 text-xs bg-white/10 hover:bg-white/15 focus:bg-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/15 transition-all shadow-inner"
              />
              {(placesSubTab === 'ads' ? adsSearchQuery : placesSearchQuery) && (
                <button
                  onClick={() => {
                    if (placesSubTab === 'ads') {
                      setAdsSearchQuery('');
                    } else {
                      setPlacesSearchQuery('');
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : isChatsView ? (
          /* CASE 2: CHATS HEADER (Logo de la app a la izquierda, barra de búsqueda sustituyendo los sub-tabs) */
          <div className="w-full flex items-center justify-between gap-3">
            {/* Logo de la app al lado izquierdo */}
            <button
              id="nav-brand-logo-chats"
              onClick={() => setActiveTab('feed')}
              className="flex items-center shrink-0 focus:outline-none transition-transform active:scale-95 py-0.5"
              title="Ir al inicio de La Tierrita"
            >
              <LaTierritaLogo className="h-9 sm:h-10 w-auto max-w-[130px] sm:max-w-[160px] drop-shadow-md hover:brightness-105 transition-all" />
            </button>

            {/* Barra de búsqueda de chats sustituyendo el espacio de los sub-tabs */}
            <div className="flex-1 max-w-xs sm:max-w-sm relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-navbar-chats-search"
                type="text"
                value={chatSearchQuery}
                onChange={e => setChatSearchQuery(e.target.value)}
                placeholder="Buscar chats, parceros o grupos..."
                autoComplete="off"
                className="w-full pl-9 pr-8 py-2 text-xs bg-white/10 hover:bg-white/15 focus:bg-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/15 transition-all shadow-inner"
              />
              {chatSearchQuery && (
                <button
                  onClick={() => setChatSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
              ) : isProfileView ? (
                /* PERFIL: Botón + para crear historias o publicaciones */
                <button
                  id="btn-nav-create-menu"
                  onClick={() => {
                    if (isGuestUser) {
                      triggerPlushNotification({
                        type: 'system',
                        title: 'Acción Limitada',
                        message: 'Como invitado no puedes publicar publicaciones ni historias. Regístrate en la app para acceder a todas las funciones.'
                      });
                      return;
                    }
                    setIsCreateMenuOpen(true);
                  }}
                  className="p-2 text-white/90 hover:text-amber-400 rounded-full hover:bg-white/10 transition-all active:scale-95"
                  title="Crear historia o publicación"
                  aria-label="Crear historia o publicación"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
              ) : (
                /* INICIO (Feed) y demás vistas: Botón de Bandeja de Chats */
                <button
                  id="btn-nav-chat-feed"
                  onClick={() => {
                    setActiveTab('chats');
                    setChatTypeTab('messages');
                    setActiveChatId(null);
                  }}
                  className="relative p-2 text-white/90 hover:text-amber-400 rounded-full hover:bg-white/10 transition-all active:scale-95"
                  title="Bandeja de chats"
                  aria-label="Bandeja de chats"
                >
                  <MessageCircle className="w-6 h-6 stroke-[2.2]" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 px-1 min-w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#001428]">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
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
                    <VerifiedBadge className="w-4.5 h-4.5" />
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
