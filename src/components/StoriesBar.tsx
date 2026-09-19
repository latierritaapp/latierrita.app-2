import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';

export const StoriesBar: React.FC = () => {
  const { currentUser, stories, setActiveStoryIndex, setIsCreateStoryOpen } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Find if current user has an active story
  const myStoryIndex = stories.findIndex(s => s.userId === currentUser.id);

  // Mouse Drag support for desktop swipe like Instagram
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section aria-label="Historias destacadas de parceros" className="w-full bg-white/[0.04] backdrop-blur-md border-b border-white/10 py-3 transition-colors select-none">
      <div className="max-w-2xl mx-auto px-4">
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1 scroll-smooth cursor-grab active:cursor-grabbing overscroll-x-contain touch-pan-x"
        >
          {/* User's Own Story Circle */}
          <div className="flex flex-col items-center shrink-0 w-18">
            <div className="relative group">
              <button
                id="btn-my-story-add"
                onClick={() => {
                  if (hasMoved) return;
                  if (myStoryIndex >= 0) {
                    setActiveStoryIndex(myStoryIndex);
                  } else {
                    setIsCreateStoryOpen(true);
                  }
                }}
                className="focus:outline-none block"
                title={myStoryIndex >= 0 ? 'Ver mi historia' : 'Añadir a tu historia'}
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2px] ${
                    myStoryIndex >= 0
                      ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-600'
                      : 'border-2 border-dashed border-white/30'
                  }`}
                >
                  <img
                    src={currentUser.avatar || undefined}
                    alt="Tu historia"
                    className="w-full h-full rounded-full object-cover border-2 border-white/20 group-hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>

              {/* Plus badge */}
              <button
                id="btn-plus-story"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateStoryOpen(true);
                }}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-md transition-transform hover:scale-110"
                title="Subir nueva historia"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
            <span className="text-[11px] font-medium text-white/90 mt-1 truncate max-w-[70px] text-center">
              Tu historia
            </span>
          </div>

          {/* Contacts' Stories */}
          {stories.map((story, index) => {
            if (story.userId === currentUser.id) return null;

            return (
              <div
                key={story.id}
                className="flex flex-col items-center shrink-0 w-18 cursor-pointer group"
                onClick={() => {
                  if (hasMoved) return;
                  setActiveStoryIndex(index);
                }}
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-105 duration-200 ${
                    story.viewed
                      ? 'bg-neutral-300 dark:bg-neutral-700'
                      : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-sm'
                  }`}
                >
                  <div className="w-full h-full rounded-full p-[2px] bg-[#0c2454]">
                    <img
                      src={story.userAvatar || undefined}
                      alt={story.username}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <span className="text-[11px] font-medium text-white/90 truncate max-w-[70px] text-center mt-1">
                  {story.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
