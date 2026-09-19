import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { ArrowLeft, X, Search, UserCheck, UserPlus, Users, BadgeCheck, Compass, MapPin } from 'lucide-react';

interface FollowersModalProps {
  type: 'followers' | 'following';
  user: UserProfile;
  onClose: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({ type, user, onClose }) => {
  const { otherUsers, currentUser, followingIds, followUser, unfollowUser, setSelectedUserProfile, setActiveTab } = useApp();
  const [activeTabType, setActiveTabType] = useState<'followers' | 'following'>(type);
  const [search, setSearch] = useState('');

  const isMe = user.id === currentUser.id || (Boolean(currentUser.username) && user.username === currentUser.username);

  // Compute actual following list
  let followingList: UserProfile[] = [];
  if (isMe) {
    followingList = otherUsers.filter(u => followingIds.includes(u.id) && u.id !== user.id && u.username !== user.username);
  } else {
    // If viewing another profile
    if ((user.followingCount || 0) > 0) {
      // Return known followed users up to followingCount
      followingList = otherUsers.filter(u => u.id !== user.id && u.username !== user.username).slice(0, user.followingCount);
    } else {
      followingList = [];
    }
  }

  // Compute actual followers list
  let followersList: UserProfile[] = [];
  if (isMe) {
    // For current user: in a fresh account, followers are 0 unless other users follow them
    if ((currentUser.followersCount || 0) > 0) {
      followersList = otherUsers.filter(u => u.id !== currentUser.id && u.username !== currentUser.username).slice(0, currentUser.followersCount);
    } else {
      followersList = [];
    }
  } else {
    // For other user: if current user follows them, add current user
    const list: UserProfile[] = [];
    if (followingIds.includes(user.id)) {
      list.push(currentUser);
    }
    if ((user.followersCount || 0) > list.length) {
      const remaining = otherUsers.filter(u => u.id !== user.id && u.id !== currentUser.id && u.username !== user.username);
      list.push(...remaining.slice(0, (user.followersCount || 0) - list.length));
    }
    followersList = list.filter(u => u.id !== user.id && u.username !== user.username);
  }

  const currentList = activeTabType === 'following' ? followingList : followersList;

  const filtered = currentList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.city && u.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top App Bar Header */}
      <div className="bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 text-center">
            <h2 className="text-base font-black text-white truncate flex items-center justify-center gap-1.5">
              <span>@{user.username}</span>
              {user.isVerified && (
                <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 inline-block" />
              )}
            </h2>
            <p className="text-[11px] text-neutral-400 font-medium truncate">
              {user.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Seguidores / Seguidos) */}
        <div className="max-w-2xl mx-auto mt-3 grid grid-cols-2 gap-2 p-1 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl">
          <button
            onClick={() => setActiveTabType('followers')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTabType === 'followers'
                ? 'bg-amber-400 text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Seguidores</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
              activeTabType === 'followers' ? 'bg-neutral-950/15 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {followersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabType('following')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTabType === 'following'
                ? 'bg-amber-400 text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Seguidos</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
              activeTabType === 'following' ? 'bg-neutral-950/15 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {followingList.length}
            </span>
          </button>
        </div>

        {/* Search input if there are users */}
        {currentList.length > 0 && (
          <div className="max-w-2xl mx-auto mt-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Buscar en ${activeTabType === 'followers' ? 'seguidores' : 'seguidos'}...`}
                className="w-full pl-10 pr-9 py-2 text-xs bg-neutral-950/90 rounded-xl border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full p-4">
        {currentList.length === 0 ? (
          /* Empty State */
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shadow-xl">
              {activeTabType === 'followers' ? (
                <Users className="w-8 h-8 opacity-80" />
              ) : (
                <Compass className="w-8 h-8 opacity-80" />
              )}
            </div>
            
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-base font-extrabold text-white">
                {activeTabType === 'followers'
                  ? 'Aún no hay seguidores'
                  : 'Aún no sigues a nadie'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {activeTabType === 'followers'
                  ? isMe
                    ? 'Cuando otros miembros de la comunidad colombiana en España comiencen a seguirte, aparecerán en esta lista.'
                    : `@${user.username} no tiene seguidores registrados por el momento.`
                  : isMe
                    ? 'Explora el feed y la comunidad de La Tierrita para descubrir y seguir a otros colombianos en tu ciudad.'
                    : `@${user.username} no sigue a ninguna cuenta todavía.`}
              </p>
            </div>

            {isMe && activeTabType === 'following' && (
              <button
                onClick={() => {
                  onClose();
                  setActiveTab('explore');
                }}
                className="mt-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explorar parceros</span>
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          /* Search no results */
          <div className="py-16 text-center space-y-2">
            <Search className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-bold text-neutral-300">No se encontraron resultados para &quot;{search}&quot;</p>
            <p className="text-[11px] text-neutral-500">Prueba buscando con otro nombre o ciudad</p>
          </div>
        ) : (
          /* Users List */
          <div className="space-y-2.5">
            {filtered.map(item => {
              const isTargetCurrentUser = item.id === currentUser.id || item.username === currentUser.username;
              const isFollowing = followingIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 flex items-center justify-between gap-3 transition-all"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedUserProfile(item);
                      onClose();
                    }}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={item.avatar || undefined}
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover border border-neutral-700 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      {item.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 absolute -bottom-0.5 -right-0.5 bg-neutral-900 rounded-full" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate hover:underline">
                          {item.name}
                        </span>
                        {item.staffRole && item.staffRole !== 'Usuario' && (
                          <span className="text-[9px] px-1.5 py-0.2 font-black uppercase rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 leading-none">
                            {item.staffRole}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-400/90 font-semibold truncate">
                        @{item.username}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span>{item.city}, España {item.originCity ? `· de ${item.originCity}` : ''}</span>
                      </div>
                    </div>
                  </div>

                  {!isTargetCurrentUser ? (
                    <button
                      onClick={() => {
                        if (isFollowing) {
                          unfollowUser(item.id);
                        } else {
                          followUser(item.id);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 shadow-xs flex items-center gap-1.5 ${
                        isFollowing
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-amber-400/20'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Siguiendo</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 bg-neutral-800 text-neutral-400 rounded-lg shrink-0">
                      Tú
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
