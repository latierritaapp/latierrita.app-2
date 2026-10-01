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
  Trash2,
  Bookmark
} from 'lucide-react';
import { FollowersModal } from './FollowersModal';
import { FlagColombia, FlagSpain, renderTextWithFlags } from './CountryFlag';
import { VerifiedBadge } from './VerifiedBadge';
import { PostCard } from './PostCard';

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
    setStoryViewerRestriction,
    likePost,
    addComment,
    deletePostByAdmin,
    setSelectedUserProfile,
    otherUsers,
    triggerPlushNotification
  } = useApp();
  const { isGuest, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'tagged' | 'saved'>('posts');
  const [modalFollowType, setModalFollowType] = useState<'followers' | 'following' | null>(null);
  
  // Feed viewer state: opened post ID when clicking a grid photo to scroll up/down
  const [openedFeedPostId, setOpenedFeedPostId] = useState<string | null>(null);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [heartAnimPostId, setHeartAnimPostId] = useState<string | null>(null);

  const isMe = !userToDisplay || userToDisplay.id === currentUser.id || (Boolean(currentUser.username) && userToDisplay.username === currentUser.username) || (Boolean(currentUser.email) && userToDisplay.email === currentUser.email);
  const isTargetStaff = Boolean(userToDisplay && (userToDisplay.username === 'latierrita_app' || userToDisplay.email === 'latierritaapp@gmail.com' || userToDisplay.id === 'user-staff'));
  const targetOtherUser = !isMe && userToDisplay ? (otherUsers.find(u => u.id === userToDisplay.id || u.username === userToDisplay.username || (userToDisplay.email && u.email === userToDisplay.email) || (isTargetStaff && (u.username === 'latierrita_app' || u.email === 'latierritaapp@gmail.com' || u.id === 'user-staff'))) || userToDisplay) : null;
  const user = isMe ? currentUser : (targetOtherUser || userToDisplay || currentUser);

  const isOfficialStaff = (user.email && user.email.trim().toLowerCase() === 'latierritaapp@gmail.com') || user.username === 'latierrita_app' || user.id === 'user-staff';
  const isFollowing = !isMe && (isOfficialStaff || (followingIds.includes(user.id) && user.id !== currentUser.id));

  const isCurrentStaff = (currentUser.email && currentUser.email.trim().toLowerCase() === 'latierritaapp@gmail.com') || currentUser.username === 'latierrita_app' || currentUser.id === 'user-staff';
  
  const isProfileGuest = Boolean(user.isGuest || user.id?.startsWith('guest-') || (isMe && (isGuest || currentUser.isGuest || currentUser.id?.startsWith('guest-'))));

  const communityFollowersCount = otherUsers.filter(u => 
    u.id !== user.id && 
    u.username !== 'latierrita_app' && 
    u.email !== 'latierritaapp@gmail.com'
  ).length + (!isMe && !isCurrentStaff ? 1 : 0);

  const displayFollowersCount = isProfileGuest
    ? 0
    : isOfficialStaff 
    ? communityFollowersCount
    : (isMe ? (currentUser.followersCount || 0) : (user.followersCount || 0));

  const cleanFollowingLength = followingIds.filter(id => id !== 'user-staff' && id !== 'latierrita_oficial' && id !== currentUser.id).length;

  const displayFollowingCount = isProfileGuest
    ? 0
    : isOfficialStaff || isCurrentStaff
    ? 0
    : (isMe ? cleanFollowingLength : (user.followingCount || 0));

  // Posts for the profile
  const userPosts: PostItem[] = (isMe
    ? myProfilePosts
    : posts.filter(p => {
        const postUserId = p.userId;
        const postUsername = p.username?.toLowerCase().trim();
        
        const targetId = user.id || userToDisplay?.id;
        const targetUsername = (user.username || userToDisplay?.username)?.toLowerCase().trim();
        const targetEmail = (user.email || userToDisplay?.email)?.toLowerCase().trim();
        
        return (
          (postUserId && targetId && postUserId === targetId) ||
          (postUsername && targetUsername && postUsername === targetUsername) ||
          ((p as any).email && targetEmail && (p as any).email.toLowerCase().trim() === targetEmail)
        );
      })
  ).filter(p => !p.isStaffAd);

  const taggedPosts: PostItem[] = posts.filter(
    p => (p.caption || '').toLowerCase().includes(`@${user.username}`) && p.userId !== user.id
  ).slice(0, 6);

  // Active stories for user
  const userStoryIndex = stories.findIndex(s => s.userId === user.id || s.username === user.username);
  const hasStory = userStoryIndex !== -1;

  const handleAvatarClick = () => {
    if (hasStory) {
      setStoryViewerRestriction(user.id);
      setActiveStoryIndex(userStoryIndex);
    } else if (isMe && !isProfileGuest) {
      setIsCreateStoryOpen(true);
    } else if (isMe && isProfileGuest) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes publicar historias. Regístrate en la app para acceder a todas las funciones.'
      });
    }
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

  const savedPosts = posts.filter(p => Array.isArray(currentUser.savedPostIds) && currentUser.savedPostIds.includes(p.id));
  const activeDisplayList = activeTab === 'posts' 
    ? userPosts 
    : activeTab === 'tagged' 
    ? taggedPosts 
    : savedPosts;

  return (
    <div id="profile-container" className="w-full text-white">
      {/* Main Profile Header Info (Centered Avatar and Stats) */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col items-center text-center space-y-3">
        {/* Centered Avatar with Story Ring */}
        <div
          onClick={handleAvatarClick}
          className={`relative shrink-0 mx-auto ${hasStory || isMe ? 'cursor-pointer hover:scale-102 transition-transform' : ''}`}
          title={hasStory ? 'Ver historia' : isMe ? 'Añadir historia' : undefined}
        >
          <div className={`w-22 h-22 sm:w-28 sm:h-28 rounded-full p-[3px] ${
            hasStory
              ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-lg shadow-amber-500/20'
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
              className="absolute bottom-0 right-0 w-7 h-7 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md transition-transform active:scale-90"
              title="Añadir historia"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Bio Details - Centered directly below avatar */}
        <div className="space-y-1.5 w-full flex flex-col items-center text-center">
          {/* 1. Nombre y Badges */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-white">
              {user.name && !user.name.includes('@') && user.name.trim().length > 0
                ? user.name.trim()
                : (user.username ? user.username.replace(/^@+/, '').split('@')[0] : 'Usuario')}
            </h1>
            {user.isVerified && (
              <VerifiedBadge className="w-5 h-5" />
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

          {/* 2. Biografía */}
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-line max-w-md pt-0.5">
            {isProfileGuest
              ? 'Usuario invitado de La Tierrita App. Comunidad de Colombianos en España.'
              : renderTextWithFlags(user.bio || '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸')}
          </p>

          {/* 3. Sitio web */}
          {user.website && !isProfileGuest && (
            <div className="pt-0.5">
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-300 hover:underline"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{user.website.replace(/^https?:\/\//, '')}</span>
              </a>
            </div>
          )}

          {/* 4. Redes sociales */}
          {user.socialLinks && !isProfileGuest && (user.socialLinks.instagram || user.socialLinks.tiktok || user.socialLinks.facebook || user.socialLinks.x) && (
            <div className="flex items-center justify-center gap-2.5 pt-1">
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

          {/* 5. Edad, ciudad origen y ciudad actual */}
          <div className="text-xs font-semibold text-white/80 flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
            {user.age && !isProfileGuest && <span>{user.age} años</span>}
            {user.age && !isProfileGuest && <span>·</span>}
            <span className="inline-flex items-center gap-1">
              <span>De {user.originCity || 'Colombia'}</span>
              <FlagColombia size="xs" />
            </span>
            <span className="text-white/40">/</span>
            <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{isProfileGuest ? 'Sin asignar' : (user.city || 'Sin asignar')}</span>
              {!isProfileGuest && user.city && user.city !== 'Sin asignar' && <FlagSpain size="xs" />}
            </span>
          </div>

          {/* Centered 3-Column Stats Row Below Bio */}
          <div className="w-full max-w-xs flex items-center justify-around text-center py-1 mt-1 mb-2">
            <div className="flex flex-col items-center px-2">
              <span className="text-base sm:text-lg font-extrabold text-white">
                {userPosts.length}
              </span>
              <span className="text-xs text-white/70 font-medium">
                Publicaciones
              </span>
            </div>

            <div
              onClick={() => setModalFollowType('followers')}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity px-2"
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
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity px-2"
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

          {/* 7. Botones de acción */}
          <div className="pt-2 w-full max-w-sm">
            {isMe ? (
              isProfileGuest ? (
                <div id="guest-profile-notice-card" className="w-full bg-[#001c38] border border-amber-400/30 rounded-3xl p-4 text-center space-y-3 shadow-xl">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-black">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Perfil Temporal de Invitado</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Estás navegando con el usuario temporal <strong>{user.username}</strong> asignado por tres días.
                  </p>
                  <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 rounded-xl text-[11px] text-amber-300 font-semibold leading-relaxed">
                    Como invitado no puedes editar el perfil, ni publicar publicaciones o historias.
                  </div>
                  <button
                    id="btn-guest-register-from-profile"
                    type="button"
                    onClick={() => logout()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-neutral-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Regístrate en la app para acceder a todas las funciones
                  </button>
                </div>
              ) : (
                <button
                  id="btn-edit-profile-trigger"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/15 flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar perfil</span>
                </button>
              )
            ) : isProfileGuest ? (
              <div className="w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-center text-xs text-white/60 font-medium select-none">
                Usuario invitado temporal (No se puede seguir)
              </div>
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
            {Array.isArray(user.featuredStoryHighlight) && user.featuredStoryHighlight.map(hl => (
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
      <div className={`grid ${isMe ? 'grid-cols-3' : 'grid-cols-2'} text-center border-b border-white/10`}>
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

        {isMe && (
          <button
            id="tab-profile-saved"
            onClick={() => setActiveTab('saved')}
            className={`py-3 flex items-center justify-center gap-2 transition-all relative ${
              activeTab === 'saved'
                ? 'text-amber-400 font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Guardados</span>
            {activeTab === 'saved' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400" />
            )}
          </button>
        )}
      </div>

      {/* 5. Clean 3-Column Photo Grid */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1">
        {(activeDisplayList || []).map(post => (
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
              decoding="async"
            />
            {/* Hover overlay with likes and comments */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>{post.likesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4 text-white" />
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        ))}

        {activeDisplayList.length === 0 && (
          <div className="col-span-3 py-16 px-4 text-center text-white/50">
            {activeTab === 'saved' ? (
              <Bookmark className="w-10 h-10 mx-auto text-white/20 mb-2" />
            ) : (
              <Grid className="w-10 h-10 mx-auto text-white/20 mb-2" />
            )}
            <p className="text-sm font-bold text-white/80">
              {activeTab === 'saved' ? 'No tienes publicaciones guardadas' : 'Aún no hay publicaciones'}
            </p>
            <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
              {activeTab === 'saved'
                ? 'Guarda fotos y anuncios interesantes para verlos más tarde aquí.'
                : isMe
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

          {/* Scrollable Feed Container - Full screen edge-to-edge on mobile using PostCard */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-16 space-y-4 pt-4">
            {(activeDisplayList || []).map(post => (
              <div key={post.id} id={`profile-feed-post-${post.id}`} className="w-full max-w-xl mx-auto">
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
