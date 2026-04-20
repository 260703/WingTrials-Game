import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { MapData } from '../types';

interface CustomMapsProps {
  onSelect: (map: MapData) => void;
  onBack: () => void;
  onOpenEditor: (initialData?: Partial<MapData>) => void;
  userId: string | undefined;
}

const PAGE_SIZE = 12;

export const CustomMaps: React.FC<CustomMapsProps> = ({ onSelect, onBack, onOpenEditor, userId }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMaps = async (isLoadMore: boolean = false) => {
    if (loadingMore || (!hasMore && isLoadMore)) return;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      let query = supabase.from('maps').select(`*, profiles(username)`).order('created_at', { ascending: false });
      
      const currentCount = isLoadMore ? maps.length : 0;
      query = query.range(currentCount, currentCount + PAGE_SIZE - 1);
      
      if (activeTab === 'local') {
        if (!userId) {
          setMaps([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
        query = query.eq('creator_id', userId);
      } else {
        query = query.eq('visibility', 'global');
      }

      if (debouncedSearch.trim()) {
        query = query.ilike('name', `%${debouncedSearch.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const fetchedMaps = data as any[];
      
      if (fetchedMaps.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setMaps(prev => isLoadMore ? [...prev, ...fetchedMaps] : fetchedMaps);
    } catch (err) {
      console.error('Error fetching maps:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch when tab or search changes
  useEffect(() => {
    setHasMore(true);
    fetchMaps(false);
  }, [activeTab, debouncedSearch, userId]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMaps(true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, activeTab, debouncedSearch, userId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this map?')) return;
    
    try {
      const { error } = await supabase.from('maps').delete().eq('id', id);
      if (error) throw error;
      setMaps(maps.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting map:', err);
      alert('Failed to delete map.');
    }
  };

  const handleEdit = (map: MapData, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenEditor(map);
  };

  const handleCreateNew = () => {
    onOpenEditor({ name: "My Custom Map", visibility: "local", difficulty: "medium" });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden font-display">
      {/* Background with Dark Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC48pLiWuSuZnGlcQ0-4E0nKVvyjAGxbXKj2oa3mf3ZTQzs0kDWeUtEYXDfOykwO9OTdYa04zIdaczHYlbK_FvqRMT3048KhDuotrzCUVfKWaMkAL1S8zcTNZwoAYdV2VsSZnFjEsrpVK-7fxtu_oMD9qyw-BzjZURL2pQBtc7YXR5lQ6Y9DK_iVdAU6GspmKNRb2tnCaATpXt-9J6p7nxwRhw9LYelZxS_F1ahT7yLD8Er3Zz98tFL9g2QXtfnltjbrS-_-aQ1FHog')` }}
      />
      <div className="fixed inset-0 bg-[#0d161c]/80 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 flex h-full grow flex-col max-w-[1200px] mx-auto w-full px-4 sm:px-10 py-6">
        
        {/* Header Section */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Custom Maps</h1>
              <p className="text-slate-400 text-sm">WingTrials Edition</p>
            </div>
          </div>
        </header>

        {/* Navigation and Action Bar */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-full w-full md:w-auto min-w-[320px]">
              <label className="flex-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="map-type" 
                  className="hidden peer" 
                  checked={activeTab === 'local'} 
                  onChange={() => {
                    setActiveTab('local');
                    setSearchQuery('');
                  }}
                />
                <div className="flex items-center justify-center h-11 rounded-full text-slate-400 peer-checked:bg-primary peer-checked:text-white font-bold transition-all">
                  Local Maps
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="map-type" 
                  className="hidden peer" 
                  checked={activeTab === 'global'} 
                  onChange={() => {
                    setActiveTab('global');
                    setSearchQuery('');
                  }}
                />
                <div className="flex items-center justify-center h-11 rounded-full text-slate-400 peer-checked:bg-primary peer-checked:text-white font-bold transition-all">
                  Global Maps
                </div>
              </label>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:flex-1 md:max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text"
                placeholder={activeTab === 'local' ? "Search your maps..." : "Search community maps..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content Area (Grid) */}
        {loading && maps.length === 0 ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">refresh</span>
          </div>
        ) : maps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1e293b]/70 backdrop-blur-md rounded-3xl border-dashed border-2 border-white/10">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-5xl">map_search</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No {activeTab === 'local' ? 'Local' : 'Global'} Maps Found</h2>
            <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
              {debouncedSearch 
                ? "We couldn't find any maps matching your search." 
                : activeTab === 'local' 
                  ? "It looks like you haven't created any maps yet." 
                  : "It looks like there aren't any community maps yet."}
            </p>
            {activeTab === 'local' && (
              <button 
                onClick={handleCreateNew}
                className="bg-game-orange text-slate-900 font-black px-8 py-3 rounded-xl hover:scale-105 transition-transform"
              >
                CREATE FIRST MAP
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-10">
            {maps.map((map) => (
              <div key={map.id} className="bg-[#0d161c]/80 backdrop-blur-xl border border-white/10 group rounded-2xl overflow-hidden hover:border-primary/50 transition-all flex flex-col">
                <div className="relative aspect-video overflow-hidden bg-slate-800">
                  {map.thumbnail_url ? (
                    <img src={map.thumbnail_url} alt={map.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <span className="material-symbols-outlined text-5xl">image_not_supported</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span className={`text-xs font-bold uppercase ${
                      map.difficulty === 'easy' ? 'text-primary' :
                      map.difficulty === 'medium' ? 'text-game-green' :
                      map.difficulty === 'hard' ? 'text-game-orange' : 'text-red-500'
                    }`}>
                      {map.difficulty}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{map.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-slate-400 text-sm">Pipes: {map.pipes_data?.length || 0}</p>
                    {activeTab === 'global' && map.profiles?.username && (
                      <p className="text-slate-500 text-xs truncate max-w-[100px]">by {map.profiles.username}</p>
                    )}
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    {/* Action Tools for Local Maps tab (where you see ALL your created maps) */}
                    {activeTab === 'local' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleEdit(map, e)}
                          className="size-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                          title="Edit Map Canvas"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={(e) => handleDelete(map.id, e)}
                          className="size-9 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-500 transition-colors"
                          title="Delete Map"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <span className="material-symbols-outlined text-sm">public</span>
                        <span>Global</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => onSelect(map as MapData)}
                      className="bg-primary px-6 py-2 rounded-lg text-sm font-bold text-white hover:brightness-110 transition-all ml-auto"
                    >
                      PLAY
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Observer Target */}
            <div ref={observerTarget} className="col-span-full h-8 flex justify-center items-center">
              {loadingMore && <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
