import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PostItem, UserProfile } from '../types';
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  ExternalLink,
  ShieldAlert,
  UserX,
  MapPin,
  Share2,
  Flag,
  BadgeCheck,
  X,
  Trash2,
  Bookmark,
  Users,
  Search,
  ArrowLeft
} from 'lucide-react';

import { VerifiedBadge } from './VerifiedBadge';

export const VerifiedCheckBadge = VerifiedBadge;

interface PostCardProps {
  post: PostItem;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const {
    likePost,
    toggleSavePost,
    addComment,
    likeComment,
    deleteComment,
    openReportModal,
    blockUser,
    blockedUserIds,
    setSelectedUserProfile,
    setActiveTab,
    otherUsers,
    currentUser,
    triggerPlushNotification,
    chatRooms,
    sendMessage,
    startPrivateChat
  } = useApp();

  const { isGuest } = useAuth();

  const [commentText, setCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [sendingStatus, setSendingStatus] = useState<Record<string, boolean>>({});
  const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<UserProfile | any | null>(null);
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startPressTimer = (commentId: string) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setActiveMenuCommentId(commentId);
    }, 600); // 600ms hold triggers the contextual popup menu
  };

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // If user is blocked, don't show their post
  if (blockedUserIds.includes(post.userId)) {
    return null;
  }

  const handleDoubleTap = () => {
    if (isGuest) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Regístrate en la app para dar Me gusta a las publicaciones.'
      });
      return;
    }
    if (!post.hasLiked) {
      likePost(post.id);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Regístrate en la app para comentar las publicaciones.'
      });
      return;
    }
    if (!commentText.trim()) return;
    const parentId = replyingToComment ? (replyingToComment.parentId || replyingToComment.id) : undefined;
    addComment(post.id, commentText.trim(), parentId);
    setCommentText('');
    setReplyingToComment(null);
  };

  const isStaffOrAdminPost = post.isStaffAd || post.username === 'latierrita_app' || post.userId === 'user-staff';

  const author = post.userId === currentUser.id || post.username === currentUser.username
    ? currentUser
    : (otherUsers.find(u => 
        u.id === post.userId || 
        u.username === post.username || 
        (isStaffOrAdminPost && (u.username === 'latierrita_app' || u.email === 'latierritaapp@gmail.com' || u.id === 'user-staff'))
      ) || null);
      
  const displayAvatar = author?.avatar || (isStaffOrAdminPost ? '/logo.png' : post.userAvatar);
  const isVerified = isStaffOrAdminPost || author?.isVerified || post.username === 'latierrita_app';
  const isAdminBadge = isStaffOrAdminPost || author?.staffRole === 'ADMIN';

  const handleUserClick = () => {
    if (isGuest) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Regístrate en la app para visitar los perfiles de otros usuarios.'
      });
      return;
    }

    if (post.userId === currentUser.id || post.username === currentUser.username) {
      setSelectedUserProfile(null);
      setActiveTab('profile');
      return;
    }

    if (author) {
      setSelectedUserProfile(author);
      return;
    }

    // Fallback profile object for direct navigation
    const fallbackUser: UserProfile = {
      id: post.userId || (isStaffOrAdminPost ? 'user-staff' : `user-${post.username}`),
      username: isStaffOrAdminPost ? 'latierrita_app' : post.username,
      name: isStaffOrAdminPost ? 'La Tierrita Oficial' : post.username,
      email: isStaffOrAdminPost ? 'latierritaapp@gmail.com' : `${post.username}@latierrita.app`,
      avatar: displayAvatar || '/logo.png',
      bio: isStaffOrAdminPost 
        ? '🇨🇴 Cuenta oficial de la comunidad de Colombianos en España. Noticias, eventos, anuncios y soporte oficial.' 
        : '',
      city: (post.location as any) || 'Madrid',
      originCity: 'Colombia',
      website: isStaffOrAdminPost ? 'https://latierrita.tech' : undefined,
      followersCount: isStaffOrAdminPost ? 15200 : 0,
      followingCount: isStaffOrAdminPost ? 4 : 0,
      postsCount: 1,
      isVerified: true,
      staffRole: isStaffOrAdminPost ? 'ADMIN' : 'Usuario',
      socialLinks: isStaffOrAdminPost ? { instagram: 'latierrita_app' } : undefined,
      createdAt: new Date().toISOString()
    };
    setSelectedUserProfile(fallbackUser);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReplyClick = (comment: any) => {
    setReplyingToComment(comment);
    const cleanUsername = comment.username.replace(/^@+/, '').trim();
    setCommentText(prev => {
      const mention = `@${cleanUsername} `;
      if (prev.includes(mention)) return prev;
      return mention + prev;
    });
    setTimeout(() => {
      const input = document.getElementById(`modal-comment-input-${post.id}`) as HTMLInputElement | null;
      if (input) {
        input.focus();
      }
    }, 50);
  };

  return (
    <article
      id={`post-card-${post.id}`}
      className="w-full max-w-2xl mx-auto bg-[#001428] sm:border-x sm:border-white/10 text-white transition-all"
    >
      {/* Post Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-left group focus:outline-none"
          onClick={handleUserClick}
          title="Ver perfil"
        >
          <img
            src={displayAvatar || '/logo.png'}
            alt={post.username}
            className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:border-amber-400/60 transition-all"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-white group-hover:text-amber-400 group-hover:underline transition-colors">
                {post.username}
              </span>
              {isVerified && (
                <VerifiedCheckBadge className="w-4 h-4" />
              )}
              {isAdminBadge && (
                <span className="text-[9px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/40 uppercase tracking-wider leading-none shadow-xs">
                  ADMIN
                </span>
              )}
            </div>
            {!post.hideLocation && post.location && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <MapPin className="w-3 h-3 text-amber-400/70" />
                <span>{post.location}</span>
              </div>
            )}
          </div>
        </button>

        {/* Options Dropdown (Report, Block) */}
        <div className="relative">
          <button
            id={`btn-post-options-${post.id}`}
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-white/70 hover:text-white rounded-full transition-colors"
            title="Opciones de publicación"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOptions && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowOptions(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-[#0d224d] border border-white/15 rounded-2xl shadow-2xl z-40 py-1.5 overflow-hidden">
                <button
                  onClick={() => {
                    handleShare();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/90 hover:bg-white/10 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>Compartir publicación</span>
                </button>

                <button
                  onClick={() => {
                    openReportModal({
                      id: post.id,
                      type: 'post',
                      title: post.isStaffAd ? `Anuncio: ${post.adTitle || post.sponsorName || 'Patrocinado'}` : `Publicación de @${post.username}`,
                      reportedUserId: post.userId,
                      reportedUserName: post.isStaffAd ? (post.sponsorName || post.username) : post.username,
                      initialTicketType: post.isStaffAd ? 'TRA' : 'TRP'
                    });
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-white/10 flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{post.isStaffAd ? 'Reportar anuncio (TRA)' : 'Reportar publicación (TRP)'}</span>
                </button>

                {post.userId !== currentUser.id && (
                  <button
                    onClick={() => {
                      blockUser(post.userId, post.username);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-white/10 flex items-center gap-2 border-t border-white/10"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Bloquear a @{post.username}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Media with Double-Tap Heart Animation */}
      <div
        className="relative w-full aspect-square bg-neutral-950 cursor-pointer overflow-hidden flex items-center justify-center select-none"
        onDoubleClick={handleDoubleTap}
      >
        <img
          src={post.mediaUrl || undefined}
          alt={post.caption}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Double tap heart animation */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl animate-ping opacity-90" />
          </div>
        )}
      </div>

      {/* Staff Ad CTA Bar (if sponsored ad) */}
      {post.isStaffAd && post.adCtaText && (
        <div className="px-4 py-3 bg-white/10 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {post.adTitle || post.sponsorName}
            </span>
            <span className="text-[11px] text-white/70 block truncate">
              {post.adDescription}
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <a
              href={post.adCtaUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow transition-all active:scale-95"
            >
              <span>{post.adCtaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            id={`btn-like-${post.id}`}
            onClick={() => likePost(post.id)}
            className="text-white hover:opacity-75 transition-transform active:scale-125"
            title={post.hasLiked ? 'Ya no me gusta' : 'Me gusta'}
          >
            <Heart
              className={`w-6 h-6 ${
                post.hasLiked
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-white/90 hover:text-white'
              }`}
            />
          </button>

          <button
            onClick={() => setShowCommentsModal(true)}
            className="flex items-center gap-1.5 text-white/90 hover:text-white hover:opacity-75 transition-transform active:scale-110"
            title="Comentar"
          >
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
            {post.comments && post.comments.length > 0 && (
              <span className="text-xs font-bold text-white/80 select-none leading-none">
                {post.comments.length}
              </span>
            )}
          </button>

          <button
            onClick={handleShare}
            className="text-white/90 hover:text-white hover:opacity-75 transition-transform active:scale-110"
            title="Compartir"
          >
            <Send className="w-6 h-6 stroke-[1.8]" />
          </button>
        </div>

        {/* Bookmark / Save Post button on the far right */}
        <button
          onClick={() => toggleSavePost(post.id)}
          className="text-white/90 hover:text-white hover:opacity-75 transition-all active:scale-110 focus:outline-none flex items-center gap-1.5"
          title={Array.isArray(currentUser.savedPostIds) && currentUser.savedPostIds.includes(post.id) ? 'Quitar de guardados' : 'Guardar publicación'}
        >
          <Bookmark
            className={`w-6 h-6 stroke-[1.8] ${
              Array.isArray(currentUser.savedPostIds) && currentUser.savedPostIds.includes(post.id)
                ? 'fill-white text-white'
                : 'text-white/90 hover:text-white'
            }`}
          />
          {Array.isArray(post.savedBy) && post.savedBy.length > 0 && (
            <span className="text-xs font-bold text-white/80 select-none leading-none">
              {post.savedBy.length}
            </span>
          )}
        </button>
      </div>

      {/* Likes count */}
      {post.likesCount > 0 && (
        <div className="px-4 pt-2">
          <span className="text-xs font-bold text-white">
            {post.likesCount} {post.likesCount === 1 ? 'Me gusta' : 'Me gusta'}
          </span>
        </div>
      )}

      {/* Caption */}
      <div className="px-4 pt-1 text-xs leading-relaxed text-white/90">
        <span
          className="inline-flex items-center gap-1 font-bold mr-2 text-white cursor-pointer hover:underline align-baseline"
          onClick={handleUserClick}
        >
          <span>{post.username}</span>
          {isAdminBadge && (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black text-[9px] px-1.5 py-0.2 rounded shadow-sm inline-flex items-center">
              ADMIN
            </span>
          )}
          {isVerified && (
            <VerifiedCheckBadge className="w-3.5 h-3.5" />
          )}
        </span>
        <span>{post.caption}</span>
      </div>

      {/* Timestamp */}
      <div className="px-4 py-2 border-b border-white/5">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">
          {post.timestamp}
        </span>
      </div>

      {/* Comments Drawer/Modal (Instagram Style) */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop Click */}
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => setShowCommentsModal(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-lg bg-[#001428] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[82vh] sm:h-[70vh] z-10 text-white animate-in slide-in-from-bottom duration-300">
            {/* Handle bar on mobile */}
            <div className="sm:hidden flex justify-center py-2 shrink-0">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <span>Comentarios</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                  {post.comments?.length || 0}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCommentsModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white focus:outline-none"
                title="Cerrar"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Comments List (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
              {/* Post Caption as Pinned Header Comment */}
              <div className="flex items-start gap-3 pb-4 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    handleUserClick();
                    setShowCommentsModal(false);
                  }}
                  className="shrink-0 focus:outline-none"
                >
                  <img
                    src={displayAvatar || '/logo.png'}
                    alt={post.username}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 hover:border-amber-400/60"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        handleUserClick();
                        setShowCommentsModal(false);
                      }}
                      className="font-extrabold text-xs text-white hover:text-amber-400 hover:underline transition-colors text-left"
                    >
                      {post.username}
                    </button>
                    {isVerified && (
                      <VerifiedCheckBadge className="w-3.5 h-3.5" />
                    )}
                    {isAdminBadge && (
                      <span className="text-[8px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/40 uppercase tracking-wider leading-none">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/90 mt-1 break-words">{post.caption}</p>
                  <span className="text-[10px] text-white/40 block mt-1.5">{post.timestamp}</span>
                </div>
              </div>

              {/* Comments Stream */}
              {(!post.comments || post.comments.length === 0) ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-white/40 gap-2">
                  <MessageCircle className="w-8 h-8 stroke-[1.5] text-white/20" />
                  <p className="text-xs font-semibold">Aún no hay comentarios</p>
                  <p className="text-[10px] max-w-xs leading-relaxed">¡Sé el primero en compartir tu opinión con este parcero!</p>
                </div>
              ) : (
                (() => {
                  const parentComments = post.comments.filter(c => !c.parentId);
                  return parentComments.map(c => {
                    const cleanCUsername = c.username ? c.username.replace(/^@+/, '').trim().toLowerCase() : '';
                    const isOfficialComment = cleanCUsername === 'latierrita_app' || cleanCUsername === 'staff_latierrita' || c.userId === 'user-staff';
                    const commentUser: UserProfile | null = (c.userId === currentUser.id || (currentUser.username && currentUser.username.replace(/^@+/, '').trim().toLowerCase() === cleanCUsername))
                      ? currentUser
                      : (otherUsers.find(u => 
                          (c.userId && u.id === c.userId) || 
                          (u.username && u.username.replace(/^@+/, '').trim().toLowerCase() === cleanCUsername) || 
                          (isOfficialComment && (u.username === 'latierrita_app' || u.id === 'user-staff' || u.email === 'latierritaapp@gmail.com'))
                        ) || null);

                    const commentDisplayName = commentUser?.name || c.name || (isOfficialComment ? 'La Tierrita Oficial' : (c.username ? c.username.replace(/^@+/, '') : 'Usuario'));
                    const isCommentVerified = isOfficialComment || Boolean(commentUser?.isVerified || c.isVerified || commentUser?.staffRole === 'ADMIN');
                    const commentStaffRole = commentUser?.staffRole || c.staffRole || (isOfficialComment ? 'ADMIN' : undefined);

                    const handleCommentAuthorClick = () => {
                      setShowCommentsModal(false);
                      if (c.userId === currentUser.id || c.username === currentUser.username) {
                        setSelectedUserProfile(null);
                        setActiveTab('profile');
                        return;
                      }

                      if (commentUser) {
                        setSelectedUserProfile(commentUser);
                        return;
                      }

                      const fallbackProfile: UserProfile = {
                        id: c.userId || (isOfficialComment ? 'user-staff' : `user-${c.username || 'anon'}`),
                        username: isOfficialComment ? 'latierrita_app' : (c.username || 'usuario'),
                        name: commentDisplayName,
                        email: isOfficialComment ? 'latierritaapp@gmail.com' : `${c.username || 'usuario'}@latierrita.app`,
                        bio: isOfficialComment ? 'Cuenta Oficial de La Tierrita España.' : 'Miembro de la comunidad',
                        avatar: c.userAvatar || (isOfficialComment ? '/logo.png' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
                        city: 'Madrid',
                        originCity: 'Colombia',
                        followersCount: isOfficialComment ? 1984 : 35,
                        followingCount: isOfficialComment ? 120 : 12,
                        postsCount: isOfficialComment ? 24 : 1,
                        isVerified: isCommentVerified,
                        staffRole: commentStaffRole,
                        socialLinks: {},
                        createdAt: new Date().toISOString()
                      };
                      setSelectedUserProfile(fallbackProfile);
                    };

                    const childReplies = post.comments.filter(child => child.parentId === c.id);

                    return (
                      <div key={c.id} className="space-y-1 pb-1">
                        {/* Parent Comment */}
                        <div
                          onMouseDown={() => startPressTimer(c.id)}
                          onMouseUp={clearPressTimer}
                          onMouseLeave={clearPressTimer}
                          onTouchStart={() => startPressTimer(c.id)}
                          onTouchEnd={clearPressTimer}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setActiveMenuCommentId(c.id);
                          }}
                          className="flex items-start justify-between gap-3 text-xs py-1 relative group cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-all px-1.5 rounded-lg select-none"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommentAuthorClick();
                              }}
                              className="shrink-0 focus:outline-none cursor-pointer mt-0.5"
                              title={`Ver perfil de ${commentDisplayName}`}
                            >
                              <img
                                src={commentUser?.avatar || c.userAvatar || (isOfficialComment ? '/logo.png' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')}
                                alt={commentDisplayName}
                                className="w-7 h-7 rounded-full object-cover border border-white/10 hover:border-amber-400/60 transition-all"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCommentAuthorClick();
                                  }}
                                  className="font-extrabold text-white hover:text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer focus:outline-none transition-colors text-left"
                                  title={`Ver perfil de ${commentDisplayName}`}
                                >
                                  <span>{commentDisplayName}</span>
                                  {commentStaffRole && commentStaffRole !== 'Usuario' && (
                                    <span
                                      className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded leading-none shadow-xs border ${
                                        commentStaffRole === 'ADMIN'
                                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 border-amber-300/40'
                                          : commentStaffRole === 'Soporte'
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      }`}
                                    >
                                      {commentStaffRole}
                                    </span>
                                  )}
                                  {isCommentVerified && (
                                    <VerifiedCheckBadge className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className="text-white/40 text-[10px] select-none">• {c.timestamp || 'Justo ahora'}</span>
                              </div>
                              <p className="text-white/90 break-words mt-0.5">{c.text}</p>
                              <div className="flex items-center gap-4 mt-0.5 select-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyClick(c);
                                  }}
                                  className="text-[10px] font-extrabold text-white/50 hover:text-amber-400 cursor-pointer transition-colors"
                                >
                                  Responder
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Comment Likes on the Right side */}
                          <div className="flex flex-col items-center justify-center shrink-0 min-w-[24px] pr-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                likeComment(post.id, c.id);
                              }}
                              className="text-white hover:scale-110 active:scale-125 transition-transform p-1 rounded-full hover:bg-white/5"
                              title="Me gusta"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  Array.isArray(c.likes) && c.likes.includes(currentUser.id)
                                    ? 'fill-rose-500 text-rose-500'
                                    : 'text-white/40 hover:text-white'
                                }`}
                              />
                            </button>
                            {Array.isArray(c.likes) && c.likes.length > 0 && (
                              <span className="text-[9px] text-white/50 font-bold select-none leading-none">
                                {c.likes.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Child Replies Nested Underneath */}
                        {childReplies.length > 0 && (
                          <div className="pl-9 space-y-1 border-l border-white/10 ml-4.5 mt-0.5">
                            {childReplies.map(child => {
                              const cleanChildUsername = child.username ? child.username.replace(/^@+/, '').trim().toLowerCase() : '';
                              const isOfficialChild = cleanChildUsername === 'latierrita_app' || cleanChildUsername === 'staff_latierrita' || child.userId === 'user-staff';
                              const childUser: UserProfile | null = (child.userId === currentUser.id || (currentUser.username && currentUser.username.replace(/^@+/, '').trim().toLowerCase() === cleanChildUsername))
                                ? currentUser
                                : (otherUsers.find(u => 
                                    (child.userId && u.id === child.userId) || 
                                    (u.username && u.username.replace(/^@+/, '').trim().toLowerCase() === cleanChildUsername) || 
                                    (isOfficialChild && (u.username === 'latierrita_app' || u.id === 'user-staff' || u.email === 'latierritaapp@gmail.com'))
                                  ) || null);

                              const childDisplayName = childUser?.name || child.name || (isOfficialChild ? 'La Tierrita Oficial' : (child.username ? child.username.replace(/^@+/, '') : 'Usuario'));
                              const isChildVerified = isOfficialChild || Boolean(childUser?.isVerified || child.isVerified || childUser?.staffRole === 'ADMIN');
                              const childStaffRole = childUser?.staffRole || child.staffRole || (isOfficialChild ? 'ADMIN' : undefined);

                              const handleChildAuthorClick = () => {
                                setShowCommentsModal(false);
                                if (child.userId === currentUser.id || child.username === currentUser.username) {
                                  setSelectedUserProfile(null);
                                  setActiveTab('profile');
                                  return;
                                }

                                if (childUser) {
                                  setSelectedUserProfile(childUser);
                                  return;
                                }

                                const fallbackProfile: UserProfile = {
                                  id: child.userId || (isOfficialChild ? 'user-staff' : `user-${child.username || 'anon'}`),
                                  username: isOfficialChild ? 'latierrita_app' : (child.username || 'usuario'),
                                  name: childDisplayName,
                                  email: isOfficialChild ? 'latierritaapp@gmail.com' : `${child.username || 'usuario'}@latierrita.app`,
                                  bio: isOfficialChild ? 'Cuenta Oficial de La Tierrita España.' : 'Miembro de la comunidad',
                                  avatar: child.userAvatar || (isOfficialChild ? '/logo.png' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
                                  city: 'Madrid',
                                  originCity: 'Colombia',
                                  followersCount: isOfficialChild ? 1984 : 35,
                                  followingCount: isOfficialChild ? 120 : 12,
                                  postsCount: isOfficialChild ? 24 : 1,
                                  isVerified: isChildVerified,
                                  staffRole: childStaffRole,
                                  socialLinks: {},
                                  createdAt: new Date().toISOString()
                                };
                                setSelectedUserProfile(fallbackProfile);
                              };

                              return (
                                <div
                                  key={child.id}
                                  onMouseDown={() => startPressTimer(child.id)}
                                  onMouseUp={clearPressTimer}
                                  onMouseLeave={clearPressTimer}
                                  onTouchStart={() => startPressTimer(child.id)}
                                  onTouchEnd={clearPressTimer}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setActiveMenuCommentId(child.id);
                                  }}
                                  className="flex items-start justify-between gap-2.5 text-[11px] py-0.5 relative group cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-all px-1.5 rounded-lg select-none"
                                >
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChildAuthorClick();
                                      }}
                                      className="shrink-0 focus:outline-none cursor-pointer mt-0.5"
                                      title={`Ver perfil de ${childDisplayName}`}
                                    >
                                      <img
                                        src={childUser?.avatar || child.userAvatar || (isOfficialChild ? '/logo.png' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')}
                                        alt={childDisplayName}
                                        className="w-5.5 h-5.5 rounded-full object-cover border border-white/10 hover:border-amber-400/60 transition-all"
                                      />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleChildAuthorClick();
                                          }}
                                          className="font-extrabold text-white hover:text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer focus:outline-none transition-colors text-left"
                                          title={`Ver perfil de ${childDisplayName}`}
                                        >
                                          <span>{childDisplayName}</span>
                                          {childStaffRole && childStaffRole !== 'Usuario' && (
                                            <span
                                              className={`text-[7px] font-black uppercase px-1 py-0.2 rounded leading-none shadow-xs border ${
                                                childStaffRole === 'ADMIN'
                                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 border-amber-300/40'
                                                  : childStaffRole === 'Soporte'
                                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                              }`}
                                            >
                                              {childStaffRole}
                                            </span>
                                          )}
                                          {isChildVerified && (
                                            <VerifiedCheckBadge className="w-3 h-3" />
                                          )}
                                        </button>
                                        <span className="text-white/40 text-[9px] select-none">• {child.timestamp || 'Justo ahora'}</span>
                                      </div>
                                      <p className="text-white/90 break-words mt-0.5">{child.text}</p>
                                      <div className="flex items-center gap-4 mt-0.5 select-none">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReplyClick({ ...child, parentId: c.id });
                                          }}
                                          className="text-[9px] font-extrabold text-white/50 hover:text-amber-400 cursor-pointer transition-colors"
                                        >
                                          Responder
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Child Comment Likes */}
                                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[20px]">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        likeComment(post.id, child.id);
                                      }}
                                      className="text-white hover:scale-110 active:scale-125 transition-transform p-0.5 rounded-full hover:bg-white/5"
                                      title="Me gusta"
                                    >
                                      <Heart
                                        className={`w-3 h-3 ${
                                          Array.isArray(child.likes) && child.likes.includes(currentUser.id)
                                            ? 'fill-rose-500 text-rose-500'
                                            : 'text-white/40 hover:text-white'
                                        }`}
                                      />
                                    </button>
                                    {Array.isArray(child.likes) && child.likes.length > 0 && (
                                      <span className="text-[8px] text-white/50 font-bold select-none leading-none">
                                        {child.likes.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Input Form at the bottom of the modal */}
            <form
              onSubmit={handleCommentSubmit}
              className="p-4 border-t border-white/10 bg-[#001c38] rounded-b-3xl sm:rounded-b-2xl flex items-center gap-2.5 shrink-0"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-white/15"
              />
              <input
                id={`modal-comment-input-${post.id}`}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Añade un comentario..."
                className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none py-1.5"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs font-extrabold text-amber-400 hover:text-amber-300 disabled:opacity-30 transition-opacity"
              >
                Publicar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Long-Press Context Menu for Comment */}
      {activeMenuCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div 
            className="absolute inset-0 cursor-default" 
            onClick={() => setActiveMenuCommentId(null)}
          />
          <div className="relative w-full max-w-xs bg-[#0d224d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5 animate-in zoom-in-95 duration-150">
            <div className="px-4 py-2 border-b border-white/5 text-center">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-extrabold block select-none">
                Opciones de comentario
              </span>
            </div>
            
            {/* Action: Delete Comment */}
            {(currentUser.id === post.userId || 
              (post.comments.find(c => c.id === activeMenuCommentId)?.userId === currentUser.id) || 
              currentUser.staffRole === 'ADMIN') && (
              <button
                onClick={() => {
                  deleteComment(post.id, activeMenuCommentId);
                  setActiveMenuCommentId(null);
                  triggerPlushNotification({
                    type: 'system',
                    title: 'Comentario eliminado',
                    message: 'El comentario ha sido removido con éxito de la publicación.'
                  });
                }}
                className="w-full text-left px-4 py-3 text-xs text-rose-400 hover:bg-white/10 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-extrabold">Eliminar comentario</span>
              </button>
            )}

            {/* Action: Block User */}
            <button
              onClick={() => {
                const comm = post.comments.find(c => c.id === activeMenuCommentId);
                if (comm && comm.userId) {
                  blockUser(comm.userId, comm.username);
                }
                setActiveMenuCommentId(null);
                setShowCommentsModal(false);
              }}
              className="w-full text-left px-4 py-3 text-xs text-rose-400 hover:bg-white/10 flex items-center gap-2 border-t border-white/5"
            >
              <UserX className="w-4 h-4" />
              <span className="font-extrabold">Bloquear a @{post.comments.find(c => c.id === activeMenuCommentId)?.username}</span>
            </button>

            {/* Action: Report comment (TRM) */}
            <button
              onClick={() => {
                const comm = post.comments.find(c => c.id === activeMenuCommentId);
                if (comm) {
                  openReportModal({
                    id: comm.id,
                    type: 'message',
                    title: `Comentario de @${comm.username}: "${comm.text.slice(0, 30)}..."`,
                    reportedUserId: comm.userId,
                    reportedUserName: comm.username,
                    initialTicketType: 'TRM'
                  });
                }
                setActiveMenuCommentId(null);
                setShowCommentsModal(false);
              }}
              className="w-full text-left px-4 py-3 text-xs text-white/90 hover:bg-white/10 flex items-center gap-2 border-t border-white/5"
            >
              <Flag className="w-4 h-4 text-blue-400" />
              <span className="font-extrabold">Reportar comentario (TRM)</span>
            </button>

            {/* Action: Cancel */}
            <button
              onClick={() => setActiveMenuCommentId(null)}
              className="w-full text-center py-3 text-xs text-white/40 hover:bg-white/10 font-bold border-t border-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Share Post Modal */}
      {showShareModal &&
        createPortal(
          <div className="fixed inset-0 z-[150] bg-[#001428] text-white flex flex-col font-sans animate-in fade-in duration-200">
            {/* Header */}
            <header className="sticky top-0 z-50 px-4 py-3 bg-[#001428] border-b border-white/10 flex items-center justify-between shadow-xl shrink-0">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareSearchQuery('');
                  setSendingStatus({});
                }}
                className="flex items-center gap-2 text-xs font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 px-3.5 py-2 rounded-xl transition-all shadow-lg border border-amber-300 cursor-pointer animate-none"
                title="Cerrar"
              >
                <ArrowLeft className="w-4 h-4 text-neutral-950 shrink-0" />
                <span>Volver</span>
              </button>
              
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Compartir Publicación
              </h2>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(window.location.href || `${window.location.origin}/post/${post.id}`);
                  triggerPlushNotification({
                    type: 'system',
                    title: 'Enlace copiado',
                    message: 'El enlace de la publicación se copió al portapapeles.'
                  });
                }}
                className="p-2 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl border border-white/10 text-white/80 hover:text-white transition-all text-xs font-bold"
                title="Copiar enlace"
              >
                Copiar Enlace
              </button>
            </header>

            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
              {/* Post Preview Info Summary */}
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className="w-12 h-12 object-cover rounded-xl border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-white/50 block">Publicado por @{post.username}</span>
                  <p className="text-xs text-white/80 truncate mt-0.5">{post.caption || 'Sin descripción'}</p>
                </div>
              </div>

              {/* Direct Quick Shares (Chats Rápidos) */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-white/50 uppercase tracking-wider px-1">Compartir en Chats Grupales</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* General Community Chat */}
                  <button
                    onClick={async () => {
                      const commChat = chatRooms.find(r => 
                        r.id === 'general' || 
                        r.id === 'comunidad' || 
                        r.id?.toLowerCase().includes('general') || 
                        r.name?.toLowerCase().includes('comunidad') || 
                        r.name?.toLowerCase().includes('españa')
                      ) || chatRooms.find(r => r.type === 'group');

                      if (!commChat) {
                        triggerPlushNotification({
                          type: 'system',
                          title: 'Error al compartir',
                          message: 'No se encontró el Chat de la Comunidad en este momento.'
                        });
                        return;
                      }

                      // Spam prevention check (15 seconds per post / user)
                      const lastShareKey = `last_group_share_${currentUser.id}_${post.id}`;
                      const lastShareTime = localStorage.getItem(lastShareKey);
                      const now = Date.now();
                      if (lastShareTime && now - parseInt(lastShareTime) < 15000) {
                        const remaining = Math.ceil((15000 - (now - parseInt(lastShareTime))) / 1000);
                        triggerPlushNotification({
                          type: 'system',
                          title: 'Límite de spam',
                          message: `Por favor, espera ${remaining} segundos antes de volver a compartir este post en los chats.`
                        });
                        return;
                      }

                      // Mark share timestamp
                      localStorage.setItem(lastShareKey, now.toString());

                      // Close modal immediately for optimal responsiveness
                      setShowShareModal(false);

                      const text = `🇨🇴 ¡Parceros! Les comparto este post de @${post.username}:\n\n"${post.caption}"\n📍 Ubicación: ${post.location || 'España'}`;
                      sendMessage(commChat.id, text, undefined, undefined, undefined, undefined, post).catch(err => {
                        console.error('Failed to send message in background:', err);
                      });

                      triggerPlushNotification({
                        type: 'system',
                        title: 'Enviado a Comunidad',
                        message: 'Se compartió la publicación en el Chat Comunidad de España.'
                      });
                    }}
                    className="p-3 bg-[#0d224d]/60 border border-white/10 hover:border-amber-400/40 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all active:scale-95 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-400/15 group-hover:bg-amber-400/25 border border-amber-400/20 flex items-center justify-center text-amber-300 transition-colors">
                      <Users className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white block">Chat Comunidad</span>
                      <span className="text-[10px] text-white/60 block mt-0.5 leading-none">Compartir con España</span>
                    </div>
                  </button>

                  {/* City-Specific Chat */}
                  <button
                    onClick={async () => {
                      const commChat = chatRooms.find(r => 
                        r.id === 'general' || 
                        r.id === 'comunidad' || 
                        r.id?.toLowerCase().includes('general') || 
                        r.name?.toLowerCase().includes('comunidad') || 
                        r.name?.toLowerCase().includes('españa')
                      ) || chatRooms.find(r => r.type === 'group');

                      const cChat = chatRooms.find(r => 
                        currentUser.city && (
                          r.id?.toLowerCase() === currentUser.city.toLowerCase() || 
                          r.name?.toLowerCase().includes(currentUser.city.toLowerCase()) || 
                          (r.id?.toLowerCase().includes(currentUser.city.toLowerCase()) && r.type === 'group')
                        )
                      ) || chatRooms.find(r => r.type === 'group' && r.id !== commChat?.id);

                      if (!cChat) {
                        triggerPlushNotification({
                          type: 'system',
                          title: 'Error al compartir',
                          message: `No se encontró el Chat de tu ciudad (${currentUser.city || 'Madrid'}).`
                        });
                        return;
                      }

                      // Spam prevention check (15 seconds per post / user)
                      const lastShareKey = `last_group_share_${currentUser.id}_${post.id}`;
                      const lastShareTime = localStorage.getItem(lastShareKey);
                      const now = Date.now();
                      if (lastShareTime && now - parseInt(lastShareTime) < 15000) {
                        const remaining = Math.ceil((15000 - (now - parseInt(lastShareTime))) / 1000);
                        triggerPlushNotification({
                          type: 'system',
                          title: 'Límite de spam',
                          message: `Por favor, espera ${remaining} segundos antes de volver a compartir este post en los chats.`
                        });
                        return;
                      }

                      // Mark share timestamp
                      localStorage.setItem(lastShareKey, now.toString());

                      // Close modal immediately for optimal responsiveness
                      setShowShareModal(false);

                      const text = `🇨🇴 ¡Parceros de ${currentUser.city || 'España'}! Miren este post de @${post.username}:\n\n"${post.caption}"\n📍 ${post.location || 'España'}`;
                      sendMessage(cChat.id, text, undefined, undefined, undefined, undefined, post).catch(err => {
                        console.error('Failed to send city group message:', err);
                      });

                      triggerPlushNotification({
                        type: 'system',
                        title: `Enviado a ${currentUser.city || 'Madrid'}`,
                        message: `Se compartió la publicación en el Chat por ciudad de ${currentUser.city || 'Madrid'}.`
                      });
                    }}
                    className="p-3 bg-[#0d224d]/60 border border-white/10 hover:border-amber-400/40 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all active:scale-95 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-400/15 group-hover:bg-emerald-400/25 border border-emerald-400/20 flex items-center justify-center text-emerald-300 transition-colors">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white block">Chat ({currentUser.city || 'Madrid'})</span>
                      <span className="text-[10px] text-white/60 block mt-0.5 leading-none">Compartir localmente</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Direct Private Shares (Search & Send) */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold text-white/50 uppercase tracking-wider">Enviar por Mensaje Privado</h3>
                  {shareSearchQuery.trim() && (
                    <button
                      onClick={() => setShareSearchQuery('')}
                      className="text-[10px] font-bold text-amber-400 hover:underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Search Bar Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-white/40" />
                  </span>
                  <input
                    type="text"
                    value={shareSearchQuery}
                    onChange={(e) => setShareSearchQuery(e.target.value)}
                    placeholder="Buscar parceros por nombre o usuario..."
                    className="w-full bg-[#0d224d] border border-white/10 focus:border-amber-400/50 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-1.5 max-h-[35vh] overflow-y-auto pr-1 no-scrollbar flex-1">
                  {(() => {
                    const filtered = otherUsers.filter(u => {
                      if (u.id === currentUser.id) return false;
                      if (blockedUserIds.includes(u.id)) return false;
                      if (!shareSearchQuery.trim()) return true;
                      return (
                        u.name?.toLowerCase().includes(shareSearchQuery.toLowerCase()) ||
                        u.username?.toLowerCase().includes(shareSearchQuery.toLowerCase())
                      );
                    }).slice(0, 15);

                    if (filtered.length === 0) {
                      return (
                        <div className="py-10 text-center text-white/40 space-y-1">
                          <p className="text-xs font-bold">No se encontraron parceros</p>
                          <p className="text-[10px]">Intenta buscar con otros términos de búsqueda.</p>
                        </div>
                      );
                    }

                    return filtered.map(u => {
                      const isSent = !!sendingStatus[u.id];
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8.5 h-8.5 rounded-full object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold text-white block truncate">{u.name}</span>
                              <span className="text-[10px] text-white/50 block truncate">@{u.username}</span>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              setSendingStatus(prev => ({ ...prev, [u.id]: true }));
                              
                              // Close immediately for unmatched responsiveness
                              setShowShareModal(false);

                              const chatId = startPrivateChat(u.id, u.name, u.avatar);
                              const text = `🇨🇴 ¡Mira esta publicación de @${post.username}!\n\n"${post.caption}"\n📍 Ubicación: ${post.location || 'España'}\n\nVer publicación en el feed.`;
                              sendMessage(chatId, text, undefined, undefined, undefined, undefined, post).catch(err => {
                                console.error('Failed to send private message:', err);
                              });
                              
                              triggerPlushNotification({
                                type: 'system',
                                title: 'Mensaje Enviado',
                                message: `La publicación se envió a @${u.username} con éxito.`,
                                avatar: u.avatar
                              });

                              setTimeout(() => {
                                setSendingStatus(prev => ({ ...prev, [u.id]: false }));
                              }, 1800);
                            }}
                            disabled={isSent}
                            className={`px-3 py-1.5 text-[10px] font-black rounded-xl shadow-md transition-all active:scale-95 shrink-0 ${
                              isSent
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 border border-amber-300'
                            }`}
                          >
                            {isSent ? 'Enviado ✓' : 'Enviar'}
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </article>
  );
};
