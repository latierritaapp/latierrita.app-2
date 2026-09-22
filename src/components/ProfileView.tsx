import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile, PostItem } from '../types';
import {
  Grid,
  UserCheck,
  Link as LinkIcon,
  MapPin,
  Heart,
  MessageCircle,
  Plus,
  ShieldAlert,
  UserX,
  X,
  Instagram,
  Facebook,
  Music2,
  Twitter,
  Clock,
  ArrowLeft,
  BadgeCheck,
  Edit3,
  Share2,
  MoreHorizontal,
  Send,
  Trash2
} from 'lucide-react';
import { FollowersModal } from './FollowersModal';
import { FlagColombia, FlagSpain, renderTextWithFlags } from './CountryFlag';

interface ProfileViewProps {
  userToDisplay?: UserProfile | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userToDisplay }) => {
  const {
    currentUser,
    myProfilePosts,
    posts,
    followingIds,
    followUser,
    unfollowUser,
    startPrivateChat,
    setIsEditProfileOpen,
    setIsCreateStoryOpen,
    openReportModal,
    blockUser,
    stories,
    setActiveStoryIndex,
    likePost,
    addComment,
    deletePostByAdmin,
    setSelectedUserProfile,
    otherUsers,
    triggerPlushNotification
  } = useApp();
  const { isGuest, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'tagged'>('posts');
  const [modalFollowType, setModalFollowType] = useState<'followers' | 'following' | null>(null);
  
  // Feed viewer state: opened post ID when clicking a grid photo to scroll up/down
  const [openedFeedPostId, setOpenedFeedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [heartAnimPostId, setHeartAnimPostId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isMe = !userToDisplay || userToDisplay.id === currentUser.id || (Boolean(currentUser.username) && userToDisplay.username === currentUser.username);
  const targetOtherUser = !isMe && userToDisplay ? (otherUsers.find(u => u.id === userToDisplay.id || u.username === userToDisplay.username || (userToDisplay.email && u.email === userToDisplay.email)) || userToDisplay) : null;
  const user = isMe ? currentUser : (targetOtherUser || userToDisplay || currentUser);

  const isOfficialStaff = (user.email && user.email.trim().toLowerCase() === 'latierritaapp@gmail.com') || user.username === 'latierrita_app' || user.id === 'user-staff';
  const isFollowing = !isMe && (isOfficialStaff || (followingIds.includes(user.id) && user.id !== currentUser.id));

  const isCurrentStaff = (currentUser.email && currentUser.email.trim().toLowerCase() === 'latierritaapp@gmail.com') || currentUser.username === 'latierrita_app' || currentUser.id === 'user-staff';
  
  const communityFollowersCount = otherUsers.filter(u => 
    u.id !== user.id && 
    u.username !== 'latierrita_app' && 
    u.email !== 'latierritaapp@gmail.com'
  ).length + (!isMe && !isCurrentStaff ? 1 : 0);

  const displayFollowersCount = isOfficialStaff 
    ? communityFollowersCount
    : (isMe ? (currentUser.followersCount || 0) : (user.followersCount || 0));

  const cleanFollowingLength = followingIds.filter(id => id !== 'user-staff' && id !== 'latierrita_oficial' && id !== currentUser.id).length;

  const displayFollowingCount = isOfficialStaff || isCurrentStaff
    ? 0
    : (isMe ? cleanFollowingLength : (user.followingCount || 0));

  // Posts for the profile
  const userPosts: PostItem[] = (isMe
    ? myProfilePosts
    : posts.filter(p => p.userId === user.id || p.username === user.username)
  ).filter(p => !p.isStaffAd);

  const taggedPosts: PostItem[] = posts.filter(
    p => (p.caption || '').toLowerCase().includes(`@${user.username}`) && p.userId !== user.id
  ).slice(0, 6);

  // Active stories for user
  const userStoryIndex = stories.findIndex(s => s.userId === user.id || s.username === user.username);
  const hasStory = userStoryIndex !== -1;

  const handleAvatarClick = () => {
    if (hasStory) {
      setActiveStoryIndex(userStoryIndex);
    } else if (isMe) {
      setIsCreateStoryOpen(true);
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Enlace copiado',
      message: `El enlace al perfil de @${user.username} se copió al portapapeles.`
    });
    setShowUserMenu(false);
  };

  const handleFeedDoubleTap = (postId: string, hasLiked: boolean) => {
    if (!hasLiked) {
      likePost(postId);
    }
    setHeartAnimPostId(postId);
    setTimeout(() => setHeartAnimPostId(null), 900);
  };

  const handleFeedCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // Scroll to clicked photo when feed viewer opens
  useEffect(() => {
    if (openedFeedPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`profile-feed-post-${openedFeedPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [openedFeedPostId]);

  // Lock background window scroll when full-screen feed viewer is open to avoid double scrollbar
  useEffect(() => {
    if (openedFeedPostId) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [openedFeedPostId]);

  const activeDisplayList = activeTab === 'posts' ? userPosts : taggedPosts;

  return (
    <div id="profile-container" className="w-full text-white">
      {/* 1. Header Bar for Non-Self Users */}
      {!isMe && (
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
          <button
            id="btn-profile-back"
            onClick={() => setSelectedUserProfile(null)}
            className="flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-1 font-bold text-sm">
            <span>@{user.username}</span>
            {user.isVerified && (
              <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
            )}
          </div>
          <div className="relative">
            <button
              id="btn-profile-options"
              onClick={() => setShowUserMenu(prev => !prev)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl py-1 z-30 animate-fade-in-up">
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
                      id: user.id,
                      type: 'user',
                      title: `Usuario @${user.username}`
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
                    blockUser(user.id, user.username);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-white/10 flex items-center gap-2"
                >
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span>Bloquear usuario</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Profile Header Info */}
      <div className="px-4 sm:px-6 pt-5 pb-3 space-y-4">
        {/* Avatar & Stats Row */}
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Avatar with Story Ring */}
          <div
            onClick={handleAvatarClick}
            className={`relative shrink-0 ${hasStory || isMe ? 'cursor-pointer hover:scale-102 transition-transform' : ''}`}
            title={hasStory ? 'Ver historia' : isMe ? 'Añadir historia' : undefined}
          >
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2.5px] ${
              hasStory
                ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-md shadow-amber-500/20'
                : 'bg-white/20'
            }`}>
              <img
                src={user.avatar || undefined}
                alt={user.name}
                className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                referrerPolicy="no-referrer"
              />
            </div>
            {hasStory && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-neutral-950 shadow-sm whitespace-nowrap">
                HISTORIA
              </span>
            )}
            {!hasStory && isMe && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateStoryOpen(true);
                }}
                className="absolute bottom-0 right-0 w-6 h-6 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md transition-transform active:scale-90"
                title="Añadir historia"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Clean 3-Column Stats */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-extrabold text-white">
                {userPosts.length}
              </span>
              <span className="text-xs text-white/70 font-medium">
                Publicaciones
              </span>
            </div>

            <div
              onClick={() => setModalFollowType('followers')}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              title="Ver seguidores"
            >
              <span className="text-base sm:text-lg font-extrabold text-white">
                {displayFollowersCount}
              </span>
              <span className="text-xs text-white/70 font-medium">
                Seguidores
              </span>
            </div>

            <div
              onClick={() => setModalFollowType('following')}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              title="Ver seguidos"
            >
              <span className="text-base sm:text-lg font-extrabold text-white">
                {displayFollowingCount}
              </span>
              <span className="text-xs text-white/70 font-medium">
                Seguidos
              </span>
            </div>
          </div>
        </div>

        {/* Bio Details - Strict Order Specified by User */}
        <div className="space-y-1.5 pt-1">
          {/* 1. Debajo de la foto: Nombre */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-sm sm:text-base font-bold text-white">
              {user.name && !user.name.includes('@') && user.name.trim().length > 0
                ? user.name.trim()
                : (user.username ? user.username.replace(/^@+/, '').split('@')[0] : 'Usuario')}
            </h1>
            {user.isVerified && (
              <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0 inline-block" />
            )}
            {user.staffRole && user.staffRole !== 'Usuario' && (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase inline-flex items-center shadow-xs border leading-none shrink-0 ${
                  user.staffRole === 'ADMIN'
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    : user.staffRole === 'Soporte'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}
              >
                {user.staffRole}
              </span>
            )}
            {isOfficialStaff && (
              <span className="text-[10px] px-2 py-0.2 bg-amber-400 text-neutral-950 font-bold rounded-full">
                Oficial
              </span>
            )}
          </div>

          {/* 2. Debajo del nombre: Biografía */}
          {user.bio && (
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-line pt-0.5">
              {renderTextWithFlags(user.bio)}
            </p>
          )}

          {/* 3. Debajo de biografía: Sitio web */}
          {user.website && (
            <div className="pt-0.5">
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:underline"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{user.website.replace(/^https?:\/\//, '')}</span>
              </a>
            </div>
          )}

          {/* 4. Debajo de sitio web: Redes sociales (solo iconos sin texto) */}
          {user.socialLinks && (user.socialLinks.instagram || user.socialLinks.tiktok || user.socialLinks.facebook || user.socialLinks.x) && (
            <div className="flex items-center gap-2.5 pt-1">
              {user.socialLinks.instagram && (
                <a
                  href={`https://instagram.com/${user.socialLinks.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-pink-500/15 hover:bg-pink-500/30 text-pink-400 border border-pink-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {user.socialLinks.tiktok && (
                <a
                  href={`https://tiktok.com/@${user.socialLinks.tiktok.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs"
                  title="TikTok"
                >
                  <Music2 className="w-4 h-4" />
                </a>
              )}
              {user.socialLinks.facebook && (
                <a
                  href={`https://facebook.com/${user.socialLinks.facebook}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {user.socialLinks.x && (
                <a
                  href={`https://x.com/${user.socialLinks.x.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs"
                  title="X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* 5. Debajo de redes sociales: Edad y ciudad origen */}
          <div className="text-xs font-semibold text-white/80 flex items-center gap-1.5 flex-wrap pt-0.5">
            {user.age && <span>{user.age} años</span>}
            {user.age && <span>·</span>}
            <span className="inline-flex items-center gap-1">
              <span>De {user.originCity || 'Colombia'}</span>
              <FlagColombia size="xs" />
            </span>
          </div>

          {/* 6. Debajo de ciudad origen: Ciudad actual */}
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="inline-flex items-center gap-1">
              <span>{user.city}, España</span>
              <FlagSpain size="xs" />
            </span>
          </div>

          {/* 7. Debajo de ciudad actual: Editar perfil y quitar el botón de compartir */}
          <div className="pt-2">
            {isMe ? (
              <>
                <button
                  id="btn-edit-profile-trigger"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/15 flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar perfil</span>
                </button>
                {isGuest && (
                  <div className="mt-2.5 p-3 bg-amber-400/10 border border-amber-400/25 rounded-2xl flex items-center justify-between gap-3 text-left">
                    <div>
                      <span className="text-xs font-black text-amber-300 block">Modo Invitado</span>
                      <span className="text-[11px] text-white/70 block">Crea tu cuenta propia para guardar tu actividad</span>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-xs rounded-xl shadow-md shrink-0 cursor-pointer"
                    >
                      Registrarme
                    </button>
                  </div>
                )}
              </>
            ) : isOfficialStaff ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm select-none">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Siguiendo (Cuenta Oficial)</span>
                </div>
                <button
                  id={`btn-message-user-${user.id}`}
                  onClick={() => startPrivateChat(user.id)}
                  className="py-2 px-4 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/15 active:scale-95 shadow-sm shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mensaje</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id={`btn-follow-toggle-${user.id}`}
                  onClick={() => {
                    if (isFollowing) {
                      unfollowUser(user.id);
                    } else {
                      followUser(user.id);
                    }
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-neutral-950 font-black'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Siguiendo</span>
                    </>
                  ) : (
                    <span>Seguir</span>
                  )}
                </button>

                <button
                  id={`btn-message-user-${user.id}`}
                  onClick={() => startPrivateChat(user.id)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/15 active:scale-95 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mensaje</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Story Highlights (Historias Destacadas) */}
      {user.username === 'latierrita_app' && (
        <div className="pt-2 pb-3 border-b border-white/10">
          <div className="no-scrollbar overflow-x-auto flex items-center gap-3.5 px-4">
            {/* New highlight button for self */}
            {isMe && (
              <div
                onClick={() => setIsCreateStoryOpen(true)}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full border border-dashed border-white/30 flex items-center justify-center bg-white/5 group-hover:border-amber-400 group-hover:bg-white/10 transition-colors">
                  <Plus className="w-5 h-5 text-white/70 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="text-[11px] text-white/70 font-medium truncate max-w-[60px] text-center">
                  Nueva
                </span>
              </div>
            )}

            {/* User's featured highlights */}
            {user.featuredStoryHighlight && user.featuredStoryHighlight.map(hl => (
              <div
                key={hl.id}
                onClick={() => {
                  triggerPlushNotification({
                    type: 'system',
                    title: `Historia destacada: ${hl.title}`,
                    message: 'Visualizando momentos destacados de La Tierrita.'
                  });
                }}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-white/20 group-hover:bg-amber-400 transition-colors shadow-sm">
                  <img
                    src={hl.cover || undefined}
                    alt={hl.title}
                    className="w-full h-full rounded-full object-cover border border-slate-900"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[11px] text-white/80 font-medium truncate max-w-[64px] text-center">
                  {hl.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Instagram Navigation Tabs */}
      <div className="grid grid-cols-2 text-center border-b border-white/10">
        <button
          id="tab-profile-posts"
          onClick={() => setActiveTab('posts')}
          className={`py-3 flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'posts'
              ? 'text-amber-400 font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Publicaciones</span>
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400" />
          )}
        </button>

        <button
          id="tab-profile-tagged"
          onClick={() => setActiveTab('tagged')}
          className={`py-3 flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'tagged'
              ? 'text-amber-400 font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Etiquetas</span>
          {activeTab === 'tagged' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400" />
          )}
        </button>
      </div>

      {/* 5. Clean 3-Column Photo Grid */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1">
        {activeDisplayList.map(post => (
          <div
            key={post.id}
            onClick={() => setOpenedFeedPostId(post.id)}
            className="relative aspect-square bg-slate-900 cursor-pointer group overflow-hidden"
          >
            <img
              src={post.mediaUrl || undefined}
              alt={post.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {/* Hover overlay with likes and comments */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>{post.likesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4 text-white" />
                <span>{post.comments.length}</span>
              </div>
            </div>
          </div>
        ))}

        {activeDisplayList.length === 0 && (
          <div className="col-span-3 py-16 px-4 text-center text-white/50">
            <Grid className="w-10 h-10 mx-auto text-white/20 mb-2" />
            <p className="text-sm font-bold text-white/80">
              Aún no hay publicaciones
            </p>
            <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
              {isMe
                ? 'Comparte tus fotos y recuerdos viviendo en España con la comunidad.'
                : `@${user.username} todavía no ha compartido fotos.`}
            </p>
          </div>
        )}
      </div>

      {/* 6. Followers / Following Full-Screen View */}
      {modalFollowType &&
        createPortal(
          <FollowersModal
            type={modalFollowType}
            user={user}
            onClose={() => setModalFollowType(null)}
          />,
          document.body
        )}

      {/* 7. Full-Screen Vertical Feed Viewer with Continuous Scroll Up and Down */}
      {openedFeedPostId &&
        createPortal(
          <div
            id="profile-feed-viewer-modal"
            className="fixed inset-0 z-[100] bg-[#001428] flex flex-col text-white animate-in fade-in duration-200"
          >
            {/* Sticky Top Header */}
            <header className="sticky top-0 z-40 px-3 sm:px-4 py-3 bg-[#001428] border-b border-white/15 flex items-center justify-between shadow-xl">
              <button
                id="btn-back-to-profile"
                onClick={() => setOpenedFeedPostId(null)}
                className="flex items-center gap-2 text-xs sm:text-sm font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 px-3.5 py-2 rounded-xl transition-all shadow-lg border border-amber-300 group cursor-pointer"
                title="Volver al perfil"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-950 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                <span>Volver al perfil</span>
              </button>
              <div className="text-center">
                <span className="text-xs font-black text-amber-400 block tracking-wide">
                  @{user.username}
                </span>
                <span className="text-[10px] text-white/60 block font-medium">
                  {activeDisplayList.length} publicaciones
                </span>
              </div>
              <button
                onClick={() => setOpenedFeedPostId(null)}
                className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Cerrar y volver al perfil"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

          {/* Scrollable Feed Container - Full screen edge-to-edge on mobile */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-16 divide-y divide-white/10">
            {activeDisplayList.map(post => (
              <article
                key={post.id}
                id={`profile-feed-post-${post.id}`}
                className="w-full max-w-xl mx-auto bg-[#001428] sm:border-x sm:border-white/10 transition-all"
              >
                {/* Post Author Header */}
                <div className="px-3.5 sm:px-4 py-3 flex items-center justify-between bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setOpenedFeedPostId(null)}
                    className="flex items-center gap-3 text-left group cursor-pointer"
                    title="Volver al perfil"
                  >
                    <img
                      src={post.userAvatar || undefined}
                      alt={post.username}
                      className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors block leading-tight">
                        @{post.username}
                      </span>
                      {(post.location || post.userCity) && (
                        <span className="text-[11px] text-white/50 block">
                          {post.location || post.userCity}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="text-[11px] text-white/50 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{post.timestamp}</span>
                    </span>
                    {isMe && (
                      <button
                        onClick={() => {
                          if (window.confirm('¿Deseas eliminar esta publicación?')) {
                            deletePostByAdmin(post.id);
                          }
                        }}
                        className="p-1.5 text-white/50 hover:text-rose-400 rounded-full hover:bg-white/10 transition-colors"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Media with Double-Click Like - Edge to edge */}
                <div
                  onDoubleClick={() => handleFeedDoubleTap(post.id, post.hasLiked)}
                  className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
                >
                  <img
                    src={post.mediaUrl || undefined}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {/* Heart animation on double tap */}
                  {heartAnimPostId === post.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                    </div>
                  )}
                </div>

                {/* Post Actions & Comments */}
                <div className="px-3.5 sm:px-4 py-3 space-y-2.5">
                  {/* Actions row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => likePost(post.id)}
                        className="flex items-center gap-1.5 transition-transform active:scale-125"
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            post.hasLiked
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-white hover:text-rose-400'
                          }`}
                        />
                        <span className="text-xs font-bold">{post.likesCount}</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-white/90">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-xs font-bold">{post.comments.length}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.href);
                          }
                          triggerPlushNotification({
                            type: 'system',
                            title: 'Enlace copiado',
                            message: 'El enlace de la foto se copió al portapapeles.'
                          });
                        }}
                        className="text-white/80 hover:text-white transition-colors"
                        title="Compartir publicación"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-white/60">
                      {post.likesCount} {post.likesCount === 1 ? 'me gusta' : 'me gusta'}
                    </span>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <div className="text-xs sm:text-sm text-white/90 leading-relaxed pt-0.5">
                      <strong className="text-white mr-1.5 font-bold">@{post.username}</strong>
                      <span>{post.caption}</span>
                    </div>
                  )}

                  {/* Comments List */}
                  {post.comments.length > 0 && (
                    <div className="pt-2 space-y-2 max-h-56 overflow-y-auto">
                      {post.comments.map(c => (
                        <div key={c.id} className="text-xs flex items-start gap-2.5 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                          <img
                            src={c.userAvatar || undefined}
                            alt={c.username}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-white/20"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-amber-300 text-xs">
                                @{c.username}
                              </span>
                              <span className="text-[10px] text-white/40">{c.timestamp}</span>
                            </div>
                            <p className="text-white/90 text-xs break-words pt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input Form */}
                  <form onSubmit={(e) => handleFeedCommentSubmit(e, post.id)} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Añade un comentario..."
                      className="flex-1 bg-white/10 text-white placeholder-white/40 px-3.5 py-2.5 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!commentInputs[post.id]?.trim()}
                      className="p-2.5 bg-amber-400 disabled:opacity-40 hover:bg-amber-300 text-neutral-950 rounded-xl transition-all font-bold active:scale-95 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
