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
  Clock
} from 'lucide-react';
import { PostItem, UserProfile } from '../types';

export const ExploreView: React.FC = () => {
  const {
    posts,
    myProfilePosts,
    otherUsers,
    currentUser,
    exploreSearchQuery,
    setExploreSearchQuery,
    likePost,
    addComment,
    setSelectedUserProfile,
    setActiveTab,
    triggerPlushNotification
  } = useApp();

  // State to track if full feed mode is open and which post was clicked
  const [openedFeedPostId, setOpenedFeedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [heartAnimPostId, setHeartAnimPostId] = useState<string | null>(null);

  // Combine feed posts + profile posts into a unified unique pool of user publications
  const allUserPosts = useMemo(() => {
    const map = new Map<string, PostItem>();

    [...posts, ...myProfilePosts].forEach(p => {
      if (!p.isStaffAd) {
        map.set(p.id, p);
      }
    });

    return Array.from(map.values());
  }, [posts, myProfilePosts]);

  // Top 3 sorted by popularity (likes + comments), remainder randomized
  const trendingPosts = useMemo(() => {
    let result = [...allUserPosts];

    // Filter if search query exists
    if (exploreSearchQuery.trim()) {
      const q = exploreSearchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const matchCaption = p.caption?.toLowerCase().includes(q);
        const matchUsername = p.username?.toLowerCase().includes(q);
        const matchLocation = p.location?.toLowerCase().includes(q);
        const matchCity = p.userCity?.toLowerCase().includes(q);
        return matchCaption || matchUsername || matchLocation || matchCity;
      });
    }

    // Sort descending by popularity (likes + comments)
    const sorted = [...result].sort((a, b) => {
      const scoreA = (a.likesCount || 0) + (a.comments?.length || 0) * 2;
      const scoreB = (b.likesCount || 0) + (b.comments?.length || 0) * 2;
      return scoreB - scoreA;
    });

    if (sorted.length <= 3) {
      return sorted;
    }

    const top3 = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // Shuffle the remaining posts randomly
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    return [...top3, ...rest];
  }, [allUserPosts, exploreSearchQuery]);

  // Set of top 3 post IDs for fast checking
  const top3Ids = useMemo(() => {
    return trendingPosts.slice(0, 3).map(p => p.id);
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
              {exploreSearchQuery ? (
                <span>Resultados para "{exploreSearchQuery}"</span>
              ) : (
                <span>Publicaciones destacadas y en tendencia en La Tierrita</span>
              )}
            </p>
          </div>
        </div>

        {exploreSearchQuery && (
          <button
            onClick={() => setExploreSearchQuery('')}
            className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-all"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {/* 3-Column Grid of Trending Profile Posts */}
      {trendingPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1 p-0.5 sm:p-1">
          {trendingPosts.map((post, idx) => {
            const isTop3 = idx < 3 && !exploreSearchQuery;
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
                  loading="lazy"
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
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            No se encontraron publicaciones
          </h3>
          <p className="text-xs text-white/60 max-w-xs mx-auto mb-4">
            No hay publicaciones en tendencia que coincidan con "{exploreSearchQuery}".
          </p>
          <button
            onClick={() => setExploreSearchQuery('')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 transition-all shadow"
          >
            Ver todas las publicaciones en tendencia
          </button>
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
          <div className="flex-1 overflow-y-auto overscroll-contain pb-20 divide-y divide-white/10">
            {trendingPosts.map(post => {
              const topRankIndex = top3Ids.indexOf(post.id);
              const isTop3 = topRankIndex !== -1 && !exploreSearchQuery;
              const isCommentsOpen = expandedComments[post.id];

              return (
                <article
                  key={post.id}
                  id={`explore-feed-post-${post.id}`}
                  className="w-full max-w-xl mx-auto bg-[#001428] sm:border-x sm:border-white/10 text-white transition-all scroll-mt-14"
                >
                  {/* Post Header: Author info */}
                  <div className="px-3.5 sm:px-4 py-3 flex items-center justify-between bg-white/[0.02]">
                    <div
                      onClick={() => handleOpenAuthorProfile(post)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <img
                        src={(getAuthorProfile(post)?.avatar || post.userAvatar) || undefined}
                        alt={post.username}
                        className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors block leading-tight">
                          @{post.username}
                        </span>
                        {!post.hideLocation && (post.location || post.userCity || 'España') && (
                          <div className="flex items-center gap-1 text-[11px] text-white/50">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            <span>{post.location || post.userCity || 'España'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isTop3 && (
                        <span className="text-[10px] font-extrabold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                          #{topRankIndex + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Image with Double Tap Like */}
                  <div
                    onDoubleClick={() => {
                      if (!post.hasLiked) {
                        likePost(post.id);
                      }
                      setHeartAnimPostId(post.id);
                      setTimeout(() => setHeartAnimPostId(null), 850);
                    }}
                    className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
                  >
                    <img
                      src={post.mediaUrl || undefined}
                      alt={post.caption || 'Publicación'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />

                    {/* Double-tap animated heart */}
                    {heartAnimPostId === post.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                        <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                      </div>
                    )}
                  </div>

                  {/* Actions Row: Likes, Comments, Share & Date */}
                  <div className="px-3.5 sm:px-4 py-3 space-y-2.5">
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

                        <button
                          onClick={() =>
                            setExpandedComments(prev => ({
                              ...prev,
                              [post.id]: !prev[post.id]
                            }))
                          }
                          className="flex items-center gap-1.5 text-white/90 hover:text-white"
                        >
                          <MessageCircle className="w-6 h-6" />
                          <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                        </button>

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

                      <span className="text-[11px] text-white/50 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.timestamp}</span>
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white/60">
                      {post.likesCount} {post.likesCount === 1 ? 'me gusta' : 'me gusta'}
                    </div>

                    {/* Post Caption */}
                    {post.caption && (
                      <div className="text-xs sm:text-sm text-white/90 leading-relaxed pt-0.5">
                        <strong
                          onClick={() => handleOpenAuthorProfile(post)}
                          className="mr-2 text-amber-300 font-bold cursor-pointer hover:underline"
                        >
                          @{post.username}
                        </strong>
                        <span>{post.caption}</span>
                      </div>
                    )}

                    {/* Comments Preview or Expanded List */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="pt-2 space-y-2">
                        {!isCommentsOpen && post.comments.length > 1 && (
                          <button
                            onClick={() =>
                              setExpandedComments(prev => ({ ...prev, [post.id]: true }))
                            }
                            className="text-xs text-white/50 hover:text-white/80 font-medium"
                          >
                            Ver los {post.comments.length} comentarios
                          </button>
                        )}

                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {(isCommentsOpen ? post.comments : post.comments.slice(-1)).map(c => (
                            <div
                              key={c.id}
                              className="text-xs flex items-start gap-2.5 bg-white/[0.03] p-2.5 rounded-xl border border-white/5"
                            >
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
                      </div>
                    )}

                    {/* Inline Comment Form */}
                    <form
                      onSubmit={e => handleCommentSubmit(post.id, e)}
                      className="pt-2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e =>
                          setCommentInputs(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))
                        }
                        placeholder="Añade un comentario..."
                        className="flex-1 bg-white/10 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/15"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        className="p-2.5 rounded-xl bg-amber-400 disabled:opacity-40 text-neutral-950 hover:bg-amber-300 font-bold transition-all shadow-sm active:scale-95"
                        title="Publicar comentario"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
