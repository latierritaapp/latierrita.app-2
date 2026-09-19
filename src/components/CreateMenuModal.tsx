import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, PlusSquare } from 'lucide-react';

export const CreateMenuModal: React.FC = () => {
  const { isCreateMenuOpen, setIsCreateMenuOpen, setIsCreateStoryOpen, setIsCreatePostOpen } = useApp();

  if (!isCreateMenuOpen) return null;

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div
        id="create-menu-backdrop"
        className="fixed inset-0 z-40 bg-transparent"
        onClick={() => setIsCreateMenuOpen(false)}
      />

      {/* Compact floating menu positioned right next to the + button on top left */}
      <div
        id="create-menu-dropdown"
        className="fixed left-3 top-14 z-50 w-56 bg-[#002466]/95 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl text-white space-y-1 animate-fade-in"
      >
        {/* Subir Historia */}
        <button
          id="btn-menu-subir-historia"
          onClick={() => {
            setIsCreateMenuOpen(false);
            setIsCreateStoryOpen(true);
          }}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 transition-all text-left group active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Subir Historia</p>
            <p className="text-[10px] text-white/70">Cámara o foto</p>
          </div>
        </button>

        {/* Subir Publicación */}
        <button
          id="btn-menu-subir-publicacion"
          onClick={() => {
            setIsCreateMenuOpen(false);
            setIsCreatePostOpen(true);
          }}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 transition-all text-left group active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-400 text-neutral-950 flex items-center justify-center font-bold shadow shrink-0">
            <PlusSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Subir Publicación</p>
            <p className="text-[10px] text-white/70">Galería y detalles</p>
          </div>
        </button>
      </div>
    </>
  );
};
