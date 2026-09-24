import React from 'react';
import { useApp } from '../context/AppContext';
import { StoriesBar } from './StoriesBar';
import { AdCarousel } from './AdCarousel';
import { PostCard } from './PostCard';
import { CheckCircle2 } from 'lucide-react';

export const FeedView: React.FC = () => {
  const { posts } = useApp();

  const staffPosts = posts.filter(
    post => post.isStaffAd || post.username === 'latierrita_app' || post.userId === 'user-staff'
  );

  return (
    <div id="feed-container" className="w-full max-w-2xl mx-auto">
      {/* 1. Instagram Stories Bar at the very top */}
      <StoriesBar />

      {/* 2. Top Image Carousel (Inicio) right under stories */}
      <AdCarousel type="inicio" />

      {/* 3. Posts Stream (Only Staff Publications) */}
      <div className="divide-y divide-white/10">
        {staffPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {staffPosts.length === 0 && (
        <div className="py-16 px-4 text-center text-white/60">
          <p className="text-xs">No hay publicaciones oficiales de staff disponibles en este momento.</p>
        </div>
      )}

      {/* End of Feed Message */}
      <div className="py-12 px-4 text-center space-y-2 bg-white/[0.02] border-t border-white/10">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-white/90">
          Estás al día con las publicaciones del Staff
        </p>
        <p className="text-[11px] text-white/60 max-w-xs mx-auto">
          Has visto todas las noticias, eventos y anuncios oficiales de La Tierrita.
        </p>
      </div>
    </div>
  );
};
