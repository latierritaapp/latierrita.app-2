import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ChevronLeft, ChevronRight, Send, Eye, MoreVertical, Trash2, Flag } from 'lucide-react';
import { StoryItem } from '../types';

const QUICK_EMOJIS = ['🔥', '❤️', '😂', '👏', '🇨🇴', '☕', '😍', '🥳'];

const formatInstagramTime = (story: StoryItem): string => {
  try {
    const idMatch = story.id.match(/story-(\d+)/);
    let ms = 0;
    if (idMatch) {
      ms = parseInt(idMatch[1], 10);
    } else {
      const numMatch = story.id.match(/\d{10,13}/);
      if (numMatch) {
        ms = parseInt(numMatch[0], 10);
      }
    }

    if (ms > 0) {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((now - ms) / 1000));
      
      if (diffSeconds < 60) {
        return `${diffSeconds}s`;
      }
      
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) {
        return `${diffMinutes}m`;
      }
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return `${diffHours}h`;
      }
      
      return `24h`;
    }
  } catch (e) {
    console.warn('Error formatting instagram time:', e);
  }

  if (story.timestamp === 'Justo ahora' || story.timestamp === 'Reciente') {
    return '1s';
  }
  
  let cleanTime = story.timestamp || '1h';
  cleanTime = cleanTime.replace('Hace ', '').replace(' minutos', 'm').replace(' minuto', 'm').replace(' min', 'm').replace(' horas', 'h').replace(' hora', 'h');
  return cleanTime;
};

export const StoryViewerModal: React.FC = () => {
  const {
    stories,
    activeStoryIndex,
    setActiveStoryIndex,
    storyViewerRestriction,
    setStoryViewerRestriction,
    reactToStory,
    currentUser,
    startPrivateChat,
    sendMessage,
    followingIds,
    deleteStory,
    openReportModal
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const timerRef = useRef<number | null>(null);

  // 1. Obtener la historia inicial basada en el índice global presionado (siempre 100% exacto)
  const initialStory = (activeStoryIndex !== null && activeStoryIndex >= 0 && activeStoryIndex < stories.length)
    ? stories[activeStoryIndex]
    : null;

  // 2. Determinar qué historias se pueden reproducir en esta sesión del visor
  let viewerStories: StoryItem[] = [];
  if (storyViewerRestriction) {
    // Si se abrió desde el perfil de un usuario, SOLO reproducimos historias de ese usuario
    viewerStories = stories.filter(s => s.userId === storyViewerRestriction);
  } else {
    // Si viene del carrusel general, reproducimos las mías y las de mis seguidos
    viewerStories = stories.filter(s => 
      s.userId === currentUser?.id || 
      (followingIds && followingIds.includes(s.userId))
    );
  }

  // 3. Agrupar historias por usuario para mantener coherencia en la visualización
  const groupsMap = new Map<string, StoryItem[]>();
  viewerStories.forEach(s => {
    const list = groupsMap.get(s.userId) || [];
    list.push(s);
    groupsMap.set(s.userId, list);
  });

  const groups = Array.from(groupsMap.values());
  groups.forEach(g => {
    g.sort((a, b) => a.id.localeCompare(b.id)); // historias más antiguas primero
  });

  // Ordenar grupos: Yo primero, luego el resto ordenados por última actualización desc
  groups.sort((a, b) => {
    const aUserId = a[0]?.userId;
    const bUserId = b[0]?.userId;
    if (aUserId === currentUser?.id) return -1;
    if (bUserId === currentUser?.id) return 1;
    const aLatest = a[a.length - 1]?.id || '';
    const bLatest = b[b.length - 1]?.id || '';
    return bLatest.localeCompare(aLatest);
  });

  // Aplanar la lista para navegación
  const playList = groups.flat();

  // Encontrar el índice del elemento activo dentro de nuestra lista de reproducción
  let currentPlayIndex = -1;
  if (initialStory) {
    currentPlayIndex = playList.findIndex(s => s.id === initialStory.id);
  }

  // Si no se encuentra pero hay elementos, usar el primero
  if (currentPlayIndex === -1 && playList.length > 0) {
    currentPlayIndex = 0;
  }

  const currentStory = currentPlayIndex !== -1 ? playList[currentPlayIndex] : null;
  const isOwner = currentStory?.userId === currentUser.id;

  // Historias pertenecientes al creador de la historia activa actual (para los segmentos de arriba)
  const userStories = currentStory 
    ? playList.filter(s => s.userId === currentStory.userId)
    : [];
  const activeSubIndex = currentStory 
    ? userStories.findIndex(s => s.id === currentStory.id)
    : -1;

  // Avanzar historia (pasa a la siguiente historia del usuario, o siguiente usuario si no hay restricción, o cierra)
  const handleNextStory = () => {
    if (currentPlayIndex !== -1 && currentPlayIndex < playList.length - 1) {
      const nextStory = playList[currentPlayIndex + 1];
      const globalIndex = stories.findIndex(s => s.id === nextStory.id);
      setActiveStoryIndex(globalIndex !== -1 ? globalIndex : null);
      setProgress(0);
      setIsViewersModalOpen(false);
    } else {
      setActiveStoryIndex(null);
      setStoryViewerRestriction(null);
      setProgress(0);
      setIsViewersModalOpen(false);
    }
  };

  const handlePrevStory = () => {
    if (currentPlayIndex !== -1 && currentPlayIndex > 0) {
      const prevStory = playList[currentPlayIndex - 1];
      const globalIndex = stories.findIndex(s => s.id === prevStory.id);
      setActiveStoryIndex(globalIndex !== -1 ? globalIndex : null);
      setProgress(0);
      setIsViewersModalOpen(false);
    } else {
      setProgress(0);
    }
  };

  const handleNextStoryRef = useRef(handleNextStory);
  handleNextStoryRef.current = handleNextStory;

  // Auto-progreso (5 segundos por historia)
  useEffect(() => {
    if (activeStoryIndex === null || !currentStory || isViewersModalOpen) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const intervalTime = 50; // ms
    const step = 100 / (5000 / intervalTime);

    timerRef.current = window.setInterval(() => {
      if (!isPaused && !isViewersModalOpen) {
        setProgress(prev => {
          if (prev >= 100) {
            setTimeout(() => {
              handleNextStoryRef.current();
            }, 0);
            return 100;
          }
          return prev + step;
        });
      }
    }, intervalTime);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeStoryIndex, isPaused, currentStory?.id, isViewersModalOpen]);

  // Bloqueo de scroll de fondo
  useEffect(() => {
    if (activeStoryIndex !== null) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [activeStoryIndex]);

  if (activeStoryIndex === null || !currentStory) return null;

  const handleQuickReaction = (emoji: string) => {
    if (isOwner) return;
    reactToStory(currentStory.id, emoji);
    
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40;
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 1500);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isOwner) return;

    if (currentStory.userId !== currentUser.id) {
      const chatId = startPrivateChat(currentStory.userId);
      if (chatId) {
        sendMessage(chatId, `Respondió a tu historia: "${replyText.trim()}"`);
      }
    }
    setReplyText('');
    handleQuickReaction('💬');
  };

  const viewersList = currentStory.viewers || [
    { userId: 'u-1', username: 'mariana_bcn', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', timestamp: 'Hace 5 min', reaction: '🔥' },
    { userId: 'u-2', username: 'carlos_valencia', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', timestamp: 'Hace 12 min', reaction: '❤️' },
    { userId: 'u-3', username: 'valen_madrid', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', timestamp: 'Hace 25 min' }
  ];

  return (
    <div
      id="story-viewer-backdrop"
      className="fixed inset-0 z-50 bg-black md:bg-black/95 md:backdrop-blur-md flex items-center justify-center select-none"
    >
      {/* Botones laterales Desktop */}
      <button
        id="btn-prev-story"
        onClick={handlePrevStory}
        disabled={currentPlayIndex === 0}
        className="hidden md:flex absolute left-8 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center disabled:opacity-30 transition-all cursor-pointer"
        title="Historia anterior"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        id="btn-next-story"
        onClick={handleNextStory}
        disabled={currentPlayIndex === playList.length - 1}
        className="hidden md:flex absolute right-8 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center disabled:opacity-30 transition-all cursor-pointer"
        title="Siguiente historia"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Story Frame - 100% Pantalla completa en móvil, Mockup en Desktop */}
      <div
        id="story-viewer-canvas"
        className="relative w-full h-full md:max-w-md md:h-[95vh] md:rounded-3xl overflow-hidden bg-neutral-900 flex flex-col justify-between shadow-2xl md:border md:border-neutral-800"
        onMouseDown={() => !isViewersModalOpen && setIsPaused(true)}
        onMouseUp={() => !isViewersModalOpen && setIsPaused(false)}
        onTouchStart={() => !isViewersModalOpen && setIsPaused(true)}
        onTouchEnd={() => !isViewersModalOpen && setIsPaused(false)}
      >
        {/* Progress Bar Segments */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {userStories.map((story, i) => (
            <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    i < activeSubIndex
                      ? '100%'
                      : i === activeSubIndex
                      ? `${progress}%`
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header - Sin Ubicación y Simplificado */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.userAvatar || undefined}
              alt={currentStory.username}
              className="w-9 h-9 rounded-full object-cover border border-white/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold drop-shadow">{currentStory.username}</span>
                <span className="text-xs text-white/80 font-semibold drop-shadow">{formatInstagramTime(currentStory)}</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-1.5">
            <button
              id="btn-story-actions"
              type="button"
              onClick={() => {
                setShowMenu(prev => !prev);
                setIsPaused(prev => !prev);
              }}
              className="p-2 text-white hover:text-neutral-300 rounded-full bg-black/30 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
              title="Opciones de historia"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 w-48 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-scaleUp">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setShowMenu(false);
                      setIsPaused(false);
                      if (confirm('¿Estás seguro de que deseas eliminar esta historia?')) {
                        await deleteStory(currentStory.id);
                        handleNextStory();
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Eliminar Historia</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      openReportModal({
                        id: currentStory.id,
                        type: 'story',
                        title: `Historia de @${currentStory.username}`
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-amber-400 hover:bg-amber-500/10 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Flag className="w-4 h-4 text-amber-400" />
                    <span>Reportar Historia</span>
                  </button>
                )}
              </div>
            )}

            <button
              id="btn-close-story"
              onClick={() => {
                setActiveStoryIndex(null);
                setStoryViewerRestriction(null);
                setIsViewersModalOpen(false);
                setShowMenu(false);
              }}
              className="p-2 text-white hover:text-neutral-300 rounded-full bg-black/30 backdrop-blur-sm cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tap zones for mobile navigation */}
        {!isViewersModalOpen && (
          <>
            <div
              className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer"
              onClick={handlePrevStory}
              title="Atrás"
            />
            <div
              className="absolute inset-y-16 right-0 w-1/3 z-20 cursor-pointer"
              onClick={handleNextStory}
              title="Siguiente"
            />
          </>
        )}

        {/* Media Frame */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img
            src={currentStory.mediaUrl || undefined}
            alt={currentStory.caption || 'Historia'}
            className="w-full h-full object-cover animate-scaleUp"
            referrerPolicy="no-referrer"
          />

          {/* Floating reactions */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingEmojis.map(item => (
              <div
                key={item.id}
                className="absolute bottom-24 text-4xl"
                style={{
                  left: `${item.x}%`,
                  animation: 'floatUp 1.4s ease-out forwards',
                  opacity: 0.95
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Interactions Row con Pie de Foto en la Parte Inferior */}
        <div className="relative z-30 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pt-10 text-white">
          {/* Pie de foto (Caption) movido a la parte inferior justo arriba de las reacciones */}
          {currentStory.caption && 
           currentStory.caption.trim() !== '' && 
           currentStory.caption !== 'null' && 
           currentStory.caption !== 'undefined' && (
            <div className="mb-4 text-sm font-medium leading-relaxed drop-shadow-md text-white/95 text-left bg-black/50 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              {currentStory.caption}
            </div>
          )}

          {isOwner ? (
            <div className="flex flex-col items-center pb-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewersModalOpen(true);
                  setIsPaused(true);
                }}
                className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-between text-xs font-bold text-white transition-all cursor-pointer shadow-lg border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {viewersList.slice(0, 3).map((v, idx) => (
                      <img key={idx} src={v.userAvatar} alt={v.username} className="w-6 h-6 rounded-full object-cover border border-white" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                  <span>Visto por {viewersList.length} parceros</span>
                </div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Eye className="w-4 h-4" />
                  <span>Ver lista</span>
                </div>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-1 mb-3 px-1">
                {QUICK_EMOJIS.map(emoji => {
                  const reactionData = currentStory.reactions?.find(r => r.emoji === emoji);
                  const count = reactionData?.count || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleQuickReaction(emoji)}
                      className="flex flex-col items-center justify-center p-1.5 hover:scale-125 transition-transform active:scale-95 group cursor-pointer"
                      title={`Reaccionar con ${emoji}`}
                    >
                      <span className="text-2xl filter drop-shadow">{emoji}</span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-amber-300 mt-0.5">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Responder a @${currentStory.username}...`}
                  className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Viewers list */}
        {isViewersModalOpen && (
          <div className="absolute inset-0 z-50 bg-neutral-950/95 backdrop-blur-lg flex flex-col animate-fade-in text-white p-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">Visualizaciones y Reacciones ({viewersList.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsViewersModalOpen(false);
                  setIsPaused(false);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {viewersList.map((viewer, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <img src={viewer.userAvatar} alt={viewer.username} className="w-9 h-9 rounded-full object-cover border border-amber-400/50" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs font-bold text-white">@{viewer.username}</p>
                      <p className="text-[10px] text-white/60">Visto {viewer.timestamp}</p>
                    </div>
                  </div>
                  {viewer.reaction && (
                    <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 px-3 py-1 rounded-full">
                      <span className="text-lg">{viewer.reaction}</span>
                      <span className="text-[10px] font-bold text-amber-300">Reaccionó</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsViewersModalOpen(false);
                setIsPaused(false);
              }}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-2xl shadow cursor-pointer"
            >
              Continuar viendo historia
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
