import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { AdCarousel } from './AdCarousel';
import {
  Flame,
  Heart,
  MessageCircle,
  MapPin,
  X,
  Share2,
  Send,
  Sparkles,
  TrendingUp,
  Search,
  ArrowLeft,
  Clock,
  MoreHorizontal,
  ShieldAlert
} from 'lucide-react';
import { PostItem, UserProfile } from '../types';
import { PostCard } from './PostCard';

export const ExploreView: React.FC = () => {
  const {
    posts,
    myProfilePosts,
    otherUsers,
    currentUser,
    likePost,
    addComment,
    setSelectedUserProfile,
    setActiveTab,
    triggerPlushNotification,
    openReportModal
  } = useApp();

  // State to track if full feed mode is open and which post was clicked
  const [openedFeedPostId, setOpenedFeedPostId] = useState<string | null>(null);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [heartAnimPostId, setHeartAnimPostId] = useState<string | null>(null);

  // Unified pool of publications from posts pool
  const allUserPosts = useMemo(() => {
    const map = new Map<string, PostItem>();

    (posts || []).forEach(p => {
      const media = p.mediaUrl || (p as any).imageUrl || (p as any).image_url;
      if (media) {
        map.set(p.id, {
          ...p,
          mediaUrl: media
        });
      }
    });

    (myProfilePosts || []).forEach(p => {
      const media = p.mediaUrl || (p as any).imageUrl || (p as any).image_url;
      if (media && !map.has(p.id)) {
        map.set(p.id, {
          ...p,
          mediaUrl: media
        });
      }
    });

    return Array.from(map.values());
  }, [posts, myProfilePosts]);

  // Sorted by popularity (likes + comments) and recency without erratic reshuffling
  const trendingPosts = useMemo(() => {
    const result = [...allUserPosts];

    // Sort descending by recency / timestamp, with engagement boost
    return result.sort((a, b) => {
      const scoreA = (a.likesCount || 0) + (a.comments?.length || 0) * 2;
      const scoreB = (b.likesCount || 0) + (b.comments?.length || 0) * 2;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return b.id.localeCompare(a.id);
    });
  }, [allUserPosts]);

  // Set of top 3 post IDs for fast checking
  const top3Ids = useMemo(() => {
    return (trendingPosts || []).slice(0, 3).map(p => p.id);
  }, [trendingPosts]);

  // Auto-scroll to the clicked post when entering feed view
  useEffect(() => {
    if (openedFeedPostId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`explore-feed-post-${openedFeedPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 50);
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

  // Find user by username/id for profile navigation
  const getAuthorProfile = (post: PostItem): UserProfile | undefined => {
    if (post.userId === currentUser.id || post.username === currentUser.username) {
      return currentUser;
    }
    return otherUsers.find(u => u.id === post.userId || u.username === post.username);
  };

  const handleOpenAuthorProfile = (post: PostItem) => {
    const author = getAuthorProfile(post);
    if (author) {
      setSelectedUserProfile(author.id === currentUser.id ? null : author);
      setActiveTab('profile');
      setOpenedFeedPostId(null);
    }
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    addComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  return (
    <div
      id="explore-container"
      className="w-full max-w-2xl mx-auto text-white"
    >
      {/* Independent Ad Carousel 02 (Explorar) above Parceros sugeridos */}
      <AdCarousel type="explorar" />

      {/* Header Section: Parceros sugeridos */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center shadow-md">
            <Flame className="w-4 h-4 text-neutral-950 fill-neutral-950" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <span>Parceros sugeridos</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                En tendencia
              </span>
            </h1>
            <p className="text-[11px] text-white/60">
              Publicaciones destacadas y en tendencia en La Tierrita
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Grid of Trending Profile Posts */}
      {(trendingPosts || []).length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1 p-0.5 sm:p-1">
          {(trendingPosts || []).map((post, idx) => {
            const isTop3 = idx < 3;
            const author = getAuthorProfile(post);
            const authorAvatar = author?.avatar || post.userAvatar;
            return (
              <div
                key={post.id}
                onClick={() => setOpenedFeedPostId(post.id)}
                className="group relative aspect-square bg-neutral-900 cursor-pointer overflow-hidden select-none"
              >
                {/* Photo Thumbnail */}
                <img
                  src={post.mediaUrl || undefined}
                  alt={post.caption || 'Publicación'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  decoding="async"
                />

                {/* Top Badge for Top Trending Posts ONLY (Top 3) */}
                {isTop3 && (
                  <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-amber-400/40 text-[9px] font-black text-amber-300 flex items-center gap-1 shadow-sm">
                    <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
                    <span>#{idx + 1}</span>
                  </div>
                )}

                {/* Hover / Touch Overlay with Likes and Comments */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={authorAvatar || undefined}
                      alt={post.username}
                      className="w-5 h-5 rounded-full object-cover border border-white/40 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] font-bold text-white truncate drop-shadow">
                      @{post.username}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-white font-bold text-xs py-2">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white text-white drop-shadow" />
                      <span className="text-xs drop-shadow">{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white text-white drop-shadow" />
                      <span className="text-xs drop-shadow">{post.comments?.length || 0}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-white/80 truncate text-right">
                    {!post.hideLocation ? (post.location || post.userCity || 'España') : 'Sin ubicación'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
            <Flame className="w-7 h-7 text-amber-400/60" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            Aún no hay publicaciones en tendencia
          </h3>
          <p className="text-xs text-white/60 max-w-xs mx-auto">
            ¡Comparte fotos o momentos con la comunidad de La Tierrita!
          </p>
        </div>
      )}

      {/* Instagram-style Scrollable Explore Feed View - Full Screen */}
      {openedFeedPostId &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-[#001428] flex flex-col text-white animate-in fade-in duration-200">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 px-3 sm:px-4 py-3 bg-[#001428] border-b border-white/15 flex items-center justify-between shadow-xl">
              <button
                id="btn-explore-back-to-grid"
                onClick={() => setOpenedFeedPostId(null)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-white/15 hover:bg-white/25 active:scale-95 px-3 py-2 rounded-xl border border-white/20 transition-all shadow-sm group cursor-pointer"
                title="Volver a la cuadrícula de Explorar"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                <span>Volver a Explorar</span>
              </button>

              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Publicaciones</span>
                </span>
                <span className="text-[10px] text-white/50 block font-medium">
                  {trendingPosts.length} publicaciones
                </span>
              </div>

              <button
                onClick={() => setOpenedFeedPostId(null)}
                className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Cerrar visor"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

          {/* Scrollable Feed List - Full Screen Edge-to-Edge */}
          {/* Scrollable Feed List - Full Screen Edge-to-Edge using PostCard */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-20 space-y-4 pt-4">
            {(trendingPosts || []).map(post => (
              <div key={post.id} id={`explore-feed-post-${post.id}`} className="w-full max-w-xl mx-auto">
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
