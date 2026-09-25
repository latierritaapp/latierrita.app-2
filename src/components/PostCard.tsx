import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostItem } from '../types';
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
  Flag
} from 'lucide-react';

interface PostCardProps {
  post: PostItem;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const {
    likePost,
    addComment,
    openReportModal,
    blockUser,
    blockedUserIds,
    setSelectedUserProfile,
    otherUsers,
    currentUser,
    triggerPlushNotification
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  // If user is blocked, don't show their post
  if (blockedUserIds.includes(post.userId)) {
    return null;
  }

  const handleDoubleTap = () => {
    if (!post.hasLiked) {
      likePost(post.id);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleUserClick = () => {
    if (post.userId === currentUser.id) {
      // It's current user, handled in profile
      return;
    }
    const found = otherUsers.find(u => u.id === post.userId);
    if (found) {
      setSelectedUserProfile(found);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    triggerPlushNotification({
      type: 'system',
      title: 'Enlace copiado',
      message: 'El enlace de la publicación se copió al portapapeles.'
    });
  };

  const author = post.userId === currentUser.id || post.username === currentUser.username
    ? currentUser
    : (otherUsers.find(u => u.id === post.userId || u.username === post.username) || null);
  const displayAvatar = author?.avatar || post.userAvatar;

  return (
    <article
      id={`post-card-${post.id}`}
      className="w-full max-w-2xl mx-auto bg-[#001428] sm:border-x sm:border-white/10 text-white transition-all"
    >
      {/* Post Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleUserClick}>
          <img
            src={displayAvatar || undefined}
            alt={post.username}
            className="w-9 h-9 rounded-full object-cover border border-white/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white hover:underline">
                {post.username}
              </span>
              {post.isStaffAd && (
                <span className="text-[10px] bg-amber-400/30 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-400/40">
                  STAFF
                </span>
              )}
            </div>
            {!post.hideLocation && post.location && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <MapPin className="w-3 h-3" />
                <span>{post.location}</span>
              </div>
            )}
          </div>
        </div>

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
            onClick={() => {
              const input = document.getElementById(`comment-input-${post.id}`);
              input?.focus();
            }}
            className="text-white/90 hover:text-white hover:opacity-75 transition-transform active:scale-110"
            title="Comentar"
          >
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
          </button>

          <button
            onClick={handleShare}
            className="text-white/90 hover:text-white hover:opacity-75 transition-transform active:scale-110"
            title="Compartir"
          >
            <Send className="w-6 h-6 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Likes count */}
      <div className="px-4 pt-2">
        <span className="text-xs font-bold text-white">
          {post.likesCount} {post.likesCount === 1 ? 'Me gusta' : 'Me gusta'}
        </span>
      </div>

      {/* Caption */}
      <div className="px-4 pt-1 text-xs leading-relaxed text-white/90">
        <span
          className="font-bold mr-2 text-white cursor-pointer hover:underline"
          onClick={handleUserClick}
        >
          {post.username}
        </span>
        <span>{post.caption}</span>
      </div>

      {/* Comments List */}
      {post.comments && post.comments.length > 0 && (
        <div className="px-4 pt-2 space-y-1">
          {(post.comments || []).map(c => (
            <div key={c.id} className="text-xs flex items-start gap-2">
              <span className="font-bold text-white">{c.username}</span>
              <span className="text-white/80 flex-1">{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 py-2">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">
          {post.timestamp}
        </span>
      </div>

      {/* Comment Input */}
      <form
        onSubmit={handleCommentSubmit}
        className="px-4 py-2.5 border-t border-white/10 flex items-center gap-2"
      >
        <input
          id={`comment-input-${post.id}`}
          type="text"
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Añade un comentario para este parcero..."
          className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 disabled:opacity-30 transition-opacity"
        >
          Publicar
        </button>
      </form>
    </article>
  );
};
