import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, Sparkles, Send, Camera } from 'lucide-react';

const PRESET_STORY_IMAGES = [
  {
    label: 'Gran Vía Madrid',
    url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&auto=format&fit=crop&q=80',
    tag: 'Madrid'
  },
  {
    label: 'Arepitas caseras',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    tag: 'Gastronomía'
  },
  {
    label: 'Café de Colombia',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    tag: 'Eje Cafetero'
  },
  {
    label: 'Playa en Barcelona',
    url: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800&auto=format&fit=crop&q=80',
    tag: 'Barcelona'
  },
  {
    label: 'Parche con amigos',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    tag: 'Amigos'
  }
];

export const CreateStoryModal: React.FC = () => {
  const { isCreateStoryOpen, setIsCreateStoryOpen, addStory } = useApp();
  const [selectedUrl, setSelectedUrl] = useState(PRESET_STORY_IMAGES[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [sticker, setSticker] = useState('🇨🇴 Paisas en España');

  if (!isCreateStoryOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = customUrl.trim() || selectedUrl;
    const finalCaption = sticker ? `${sticker} · ${caption}` : caption;
    addStory({
      mediaUrl: finalUrl,
      caption: finalCaption
    });
  };

  return (
    <div
      id="create-story-backdrop"
      className="fixed inset-0 z-50 bg-[#001845] text-white flex flex-col w-full h-full overflow-hidden animate-fade-in"
    >
      <div
        id="create-story-modal"
        className="w-full max-w-2xl mx-auto bg-[#001845] border-x border-white/10 flex flex-col h-full shadow-2xl"
      >
        <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white">
              Nueva Historia de Instagram
            </h3>
          </div>
          <button
            onClick={() => setIsCreateStoryOpen(false)}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 pb-24">
          {/* Preview */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <img
              src={customUrl || selectedUrl || undefined}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {sticker && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                {sticker}
              </div>
            )}
            {caption && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md text-white p-2 rounded-xl text-xs text-center font-medium">
                {caption}
              </div>
            )}
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Fotos sugeridas de la comunidad
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_STORY_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedUrl(img.url);
                    setCustomUrl('');
                  }}
                  className={`h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedUrl === img.url && !customUrl
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Device Camera & Device Gallery Capture */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Subir imagen desde tu dispositivo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 transition-all">
                <Camera className="w-4 h-4" />
                <span>Tomar foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (reader.result) setCustomUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded-xl text-xs font-bold text-sky-400 transition-all">
                <Image className="w-4 h-4" />
                <span>Elegir galería</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (reader.result) setCustomUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Sticker choices */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Sticker comunitario
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                '🇨🇴 Paisas en España',
                '🫓 Arepa time',
                '☕ Café Quindío',
                '📍 Madrid',
                '📍 Barcelona',
                '⚽ Selección Colombia'
              ].map(stk => (
                <button
                  key={stk}
                  type="button"
                  onClick={() => setSticker(stk === sticker ? '' : stk)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    sticker === stk
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
              Texto o pie de foto
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="¿Qué estás haciendo hoy parcero?"
              maxLength={80}
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(false)}
              className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-extrabold rounded-xl shadow-md transition-all"
            >
              <span>Publicar en mi historia</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
