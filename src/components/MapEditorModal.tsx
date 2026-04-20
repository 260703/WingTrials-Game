import React, { useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { MapData } from '../types';

interface MapEditorModalProps {
  onClose: () => void;
  onProceedToCanvas: (mapMetadata: Partial<MapData>) => void;
  existingMap?: MapData; // If provided, we are editing rather than creating fresh
}

export const MapEditorModal: React.FC<MapEditorModalProps> = ({ onClose, onProceedToCanvas, existingMap }) => {
  const [name, setName] = useState(existingMap?.name || '');
  const [visibility, setVisibility] = useState<'local' | 'global'>(existingMap?.visibility || 'local');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'insane'>(existingMap?.difficulty || 'medium');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingMap?.thumbnail_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB");
        return;
      }
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return previewUrl; // Return existing or null if none uploaded
    
    setIsUploading(true);
    const fileExt = thumbnailFile.name.split('.').pop();
    const fileName = `${self.crypto.randomUUID()}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('map_images')
      .upload(filePath, thumbnailFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      alert('Failed to upload image.');
      setIsUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('map_images')
      .getPublicUrl(filePath);

    setIsUploading(false);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter a map name.");
      return;
    }

    const uploadedThumbnailUrl = await uploadThumbnail();

    const mapMetadata: Partial<MapData> = {
      name: name.trim(),
      visibility,
      difficulty,
      thumbnail_url: uploadedThumbnailUrl,
    };

    onProceedToCanvas(mapMetadata);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-background-dark/80 backdrop-blur-sm font-display">
      <div className="flex flex-col w-full max-w-[640px] bg-[#16222c]/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="text-primary">
              <span className="material-symbols-outlined text-4xl">map</span>
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">WingTrials Map Editor</h2>
              <p className="text-slate-400 text-sm font-medium">{existingMap ? 'Edit Map Details' : 'Create your next masterpiece'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        
        {/* Form Content */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Map Name Input */}
          <div className="flex flex-col gap-3">
            <label className="text-slate-200 text-base font-semibold leading-normal flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">edit</span>
              Map Name
            </label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="e.g. Neon Horizon, Gravity Well..." 
              type="text"
            />
          </div>

          {/* Map Visibility Toggle */}
          <div className="flex flex-col gap-3">
            <label className="text-slate-200 text-base font-semibold leading-normal flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">public</span>
              Map Visibility
            </label>
            <div className="flex w-full h-14 items-center justify-center rounded-xl bg-white/5 p-1.5 border border-white/5">
              <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-4 transition-all has-[:checked]:bg-primary has-[:checked]:text-white text-slate-400 font-bold text-sm">
                <span className="truncate">Local Map</span>
                <input 
                  checked={visibility === 'local'} 
                  onChange={() => setVisibility('local')}
                  className="hidden" 
                  name="visibility" 
                  type="radio" 
                  value="local"
                />
              </label>
              <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-4 transition-all has-[:checked]:bg-primary has-[:checked]:text-white text-slate-400 font-bold text-sm">
                <span className="truncate">Global Map</span>
                <input 
                  checked={visibility === 'global'}
                  onChange={() => setVisibility('global')}
                  className="hidden" 
                  name="visibility" 
                  type="radio" 
                  value="global"
                />
              </label>
            </div>
          </div>

          {/* Map Thumbnail Upload */}
          <div className="flex flex-col gap-3">
            <label className="text-slate-200 text-base font-semibold leading-normal flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">image</span>
              Map Thumbnail
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer overflow-hidden group"
            >
              {previewUrl ? (
                 <img src={previewUrl} alt="Thumbnail Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
              ) : null}
              
              <div className="z-10 flex flex-col items-center gap-2">
                 <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary transition-colors">
                     {previewUrl ? 'edit' : 'cloud_upload'}
                 </span>
                 <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-300">
                        {previewUrl ? 'Change Map Image' : 'Upload Map Image'}
                    </span>
                    <span className="text-xs text-slate-500">PNG, JPG up to 5MB</span>
                 </div>
              </div>
              <input 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*" 
                className="hidden" 
                type="file"
              />
            </div>
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex flex-col gap-3">
            <label className="text-slate-200 text-base font-semibold leading-normal flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">bolt</span>
              Difficulty Level
            </label>
            <div className="relative group">
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="appearance-none w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer transition-all"
              >
                <option className="bg-slate-900" value="easy">Easy - Chill & Fly</option>
                <option className="bg-slate-900" value="medium">Medium - Balanced Challenge</option>
                <option className="bg-slate-900" value="hard">Hard - Quick Reflexes</option>
                <option className="bg-slate-900" value="insane">Insane - Pixel Perfect</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full flex h-16 items-center justify-center rounded-xl bg-gradient-to-r from-game-green to-emerald-600 text-white gap-3 text-lg font-extrabold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">{existingMap ? 'save' : 'play_arrow'}</span>
              )}
              {isUploading ? 'UPLOADING...' : (existingMap ? 'SAVE DETAILS' : 'START BUILDING')}
            </button>
            <button 
              onClick={onClose}
              className="w-full flex h-14 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 gap-2 text-base font-bold border border-white/5 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="px-8 py-4 bg-black/20 flex justify-between items-center text-slate-500 text-xs mt-auto border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{visibility === 'local' ? 'Saving securely to Supabase (Local Maps view only)' : 'Will be visible to all players'}</span>
          </div>
          <div className="text-primary font-bold uppercase tracking-widest text-[10px]">
            WingTrials Custom
          </div>
        </div>
      </div>
    </div>
  );
};
