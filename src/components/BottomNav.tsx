import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, MessageCircle, User, Megaphone, Search } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    setSelectedUserProfile,
    chatRooms
  } = useApp();

  const unreadMessagesCount = chatRooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Navegación principal inferior"
      className="fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav transition-all text-white shadow-2xl"
    >
      <div className="max-w-md mx-auto px-4 h-15 flex items-center justify-around">
        {/* 1. Inicio */}
        <button
          id="tab-btn-home"
          onClick={() => {
            setSelectedUserProfile(null);
            setActiveTab('feed');
          }}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeTab === 'feed'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Inicio"
          aria-label="Inicio"
        >
          <Home className={`w-5 sm:w-6 h-5 sm:h-6 ${activeTab === 'feed' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </button>

        {/* 2. Chats */}
        <button
          id="tab-btn-chats"
          onClick={() => {
            setSelectedUserProfile(null);
            setActiveTab('chats');
          }}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeTab === 'chats'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Chats de la comunidad"
          aria-label="Chats"
        >
          <div className="relative">
            <MessageCircle className={`w-5 sm:w-6 h-5 sm:h-6 ${activeTab === 'chats' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1 min-w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#1A2436]">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </div>
        </button>

        {/* 3. Perfil */}
        <button
          id="tab-btn-profile"
          onClick={() => {
            setSelectedUserProfile(null);
            setActiveTab('profile');
          }}
          className={`relative p-2 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeTab === 'profile'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Mi Perfil"
          aria-label="Perfil"
        >
          <div className={`p-0.5 rounded-full transition-all ${activeTab === 'profile' ? 'ring-2 ring-amber-400 shadow-sm' : ''}`}>
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 sm:w-6 h-5 sm:h-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-5 sm:w-6 h-5 sm:h-6 text-white/60" />
            )}
          </div>
        </button>

        {/* 4. Lugares / Anuncios (Altavoz) */}
        <button
          id="tab-btn-places"
          onClick={() => {
            setSelectedUserProfile(null);
            setActiveTab('places');
          }}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeTab === 'places'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Lugares y Anuncios"
          aria-label="Lugares y Anuncios"
        >
          <Megaphone className={`w-5 sm:w-6 h-5 sm:h-6 ${activeTab === 'places' ? 'stroke-[2.5] text-amber-400' : 'stroke-[1.8]'}`} />
        </button>

        {/* 5. Búsqueda y tendencias */}
        <button
          id="tab-btn-explore"
          onClick={() => {
            setSelectedUserProfile(null);
            setActiveTab('explore');
          }}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            activeTab === 'explore'
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Búsqueda y tendencias"
          aria-label="Búsqueda y tendencias"
        >
          <Search className={`w-5 sm:w-6 h-5 sm:h-6 ${activeTab === 'explore' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </button>
      </div>
    </nav>
  );
};
