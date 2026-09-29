import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, User, Megaphone, MapPin } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    selectedUserProfile,
    placesSubTab,
    setPlacesSubTab
  } = useApp();

  const isHomeActive = activeTab === 'feed' && !selectedUserProfile;
  const isExploreActive = activeTab === 'explore';
  const isProfileActive = activeTab === 'profile' && !selectedUserProfile;
  const isAdsActive = activeTab === 'places' && placesSubTab === 'ads';
  const isPlacesActive = activeTab === 'places' && placesSubTab === 'places';

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
          onClick={() => setActiveTab('feed')}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            isHomeActive
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Inicio"
          aria-label="Inicio"
        >
          <Home className={`w-5 sm:w-6 h-5 sm:h-6 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </button>

        {/* 2. Explorar */}
        <button
          id="tab-btn-explore"
          onClick={() => setActiveTab('explore')}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            isExploreActive
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Explorar"
          aria-label="Explorar"
        >
          <Search className={`w-5 sm:w-6 h-5 sm:h-6 ${isExploreActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </button>

        {/* 3. Perfil */}
        <button
          id="tab-btn-profile"
          onClick={() => setActiveTab('profile')}
          className={`relative p-2 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            isProfileActive
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Mi Perfil"
          aria-label="Perfil"
        >
          <div className={`p-0.5 rounded-full transition-all ${isProfileActive ? 'ring-2 ring-amber-400 shadow-sm' : ''}`}>
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

        {/* 4. Anuncios */}
        <button
          id="tab-btn-ads"
          onClick={() => {
            setActiveTab('places');
            setPlacesSubTab('ads');
          }}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            isAdsActive
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Anuncios Clasificados"
          aria-label="Anuncios"
        >
          <Megaphone className={`w-5 sm:w-6 h-5 sm:h-6 ${isAdsActive ? 'stroke-[2.5] text-amber-400' : 'stroke-[1.8]'}`} />
        </button>

        {/* 5. Lugares */}
        <button
          id="tab-btn-places"
          onClick={() => {
            setActiveTab('places');
            setPlacesSubTab('places');
          }}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            isPlacesActive
              ? 'text-amber-400 bg-amber-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Lugares"
          aria-label="Lugares"
        >
          <MapPin className={`w-5 sm:w-6 h-5 sm:h-6 ${isPlacesActive ? 'stroke-[2.5] text-amber-400' : 'stroke-[1.8]'}`} />
        </button>
      </div>
    </nav>
  );
};
