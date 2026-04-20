import React, { useState, useRef } from 'react';
import type { MapData, PipeData } from '../types';
import { supabase } from '../utils/supabaseClient';
import backgroundImg from '../assets/background.jpg';
import { MapEditorModal } from './MapEditorModal';

interface MapEditorProps {
  onBack: () => void;
  mapMetadata: Partial<MapData>;
  userId: string | undefined;
}

const PIPE_WIDTH = 70;
const PIPE_GAP = 150;
const FLOOR_HEIGHT = 400;

export const MapEditor: React.FC<MapEditorProps> = ({ onBack, mapMetadata, userId }) => {
  const [pipes, setPipes] = useState<PipeData[]>(mapMetadata.pipes_data || []);
  const [metadata, setMetadata] = useState<Partial<MapData>>(mapMetadata);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Snap X to grid (every 50px?) or just keep as is? Let's snap to avoid pixel perfect requirements
    const snappedX = Math.round(x / 50) * 50;
    
    // ... rest of logic ...


    // Calculate Y based on click, but remember pipe needs topHeight.
    // Click essentially sets the GAP center.
    const y = e.clientY - rect.top;
    
    // Gap center is at y. Top pipe bottom is y - GAP/2.
    // topHeight is actually the height of the top pipe (0 to topHeight).
    // So topHeight = y - GAP/2.
    const topHeight = y - PIPE_GAP / 2;

    // Constrain topHeight
    const constrainedTopHeight = Math.max(50, Math.min(topHeight, FLOOR_HEIGHT - PIPE_GAP - 50));

    // Check if we clicked on an existing pipe to remove it?
    // Simple collision check with existing pipes
    const clickedPipeIndex = pipes.findIndex(p => Math.abs(p.x - snappedX) < PIPE_WIDTH);

    if (clickedPipeIndex >= 0) {
      // Remove
      setPipes(pipes.filter((_, i) => i !== clickedPipeIndex));
    } else {
      // Add
      const newPipe: PipeData = {
        id: Date.now(),
        x: snappedX,
        topHeight: constrainedTopHeight,
        passed: false,
      };
      setPipes([...pipes, newPipe].sort((a, b) => a.x - b.x));
    }
  };

  const handleSave = async () => {
    if (!userId) {
      alert("You must be logged in to save a map.");
      return;
    }
    
    setIsSaving(true);
    try {
      if (metadata.id) {
        // Updating existing map
        const { error } = await supabase.from('maps').update({
          name: metadata.name,
          visibility: metadata.visibility,
          thumbnail_url: metadata.thumbnail_url,
          difficulty: metadata.difficulty,
          pipes_data: pipes,
          updated_at: new Date().toISOString()
        }).eq('id', metadata.id);
        
        if (error) throw error;
      } else {
        // Creating new map
        const { error } = await supabase.from('maps').insert({
          creator_id: userId,
          name: metadata.name,
          visibility: metadata.visibility,
          thumbnail_url: metadata.thumbnail_url,
          difficulty: metadata.difficulty,
          pipes_data: pipes,
        });

        if (error) throw error;
      }
      
      alert('Map saved successfully!');
      onBack();
    } catch (err) {
      console.error("Failed to save map:", err);
      alert("Failed to save map.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#112116]">
       {/* Toolbar */}
        <div className="bg-[#ded895] p-4 flex justify-between items-center border-b-4 border-black z-20">
          <div className="flex gap-4 items-center">
            <button onClick={onBack} className="px-4 py-2 bg-slate-500 text-white font-bold border-2 border-black">
              BACK
            </button>
            <div className="flex items-center gap-2 group">
              <div className="px-4 py-2 font-game text-xl text-black">
                Editing: {metadata.name}
              </div>
              <button 
                onClick={() => setShowSettings(true)}
                className="size-10 flex items-center justify-center bg-black/10 rounded-full hover:bg-black/20 text-black transition-colors"
                title="Map Settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>
          <div className="text-black font-game">
            Right Scroll to Expand Map | Click to Place/Remove Pipe
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 bg-[#54ac42] text-white font-bold border-2 border-black hover:scale-105 disabled:opacity-50"
          >
            {isSaving ? 'SAVING...' : 'SAVE MAP'}
          </button>
       </div>

       {/* Editor Area */}
       <div 
         ref={scrollContainerRef}
         className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#70c5ce]"
         style={{ cursor: 'crosshair' }}
       >
         {/* World Container - make it very wide */}
         <div 
           className="relative h-full min-w-[3000px] w-[5000px]" 
           onClick={handleAreaClick}
           style={{ 
             backgroundImage: `url(${backgroundImg})`, 
             backgroundSize: 'auto 100%',
             backgroundRepeat: 'repeat-x',
           }}
         >
            {/* Guide Lines */}
            <div className="absolute top-[50%] w-full h-0.5 bg-white/30 pointer-events-none"></div>
            
            {/* Safe Zone Indicator */}
            <div className="absolute top-0 left-0 w-[400px] h-full bg-red-500/10 border-r-2 border-red-500/50 pointer-events-none z-10 flex items-center justify-center">
                <span className="text-red-500/50 font-bold -rotate-90">START ZONE</span>
            </div>
            
             {/* Pipes */}
             {pipes.map((pipe) => (
                <div key={pipe.id} className="absolute top-0 w-[70px]" style={{ left: pipe.x }}>
                   {/* Top Pipe */}
                   <div 
                     className="absolute top-0 w-full bg-[#73bf2e] border-2 border-black"
                     style={{ height: pipe.topHeight }}
                   >
                     <div className="absolute bottom-0 w-[110%] -left-[5%] h-6 bg-[#73bf2e] border-2 border-black"></div>
                   </div>

                   {/* Bottom Pipe */}
                   <div 
                     className="absolute w-full bg-[#73bf2e] border-2 border-black"
                     style={{ top: pipe.topHeight + PIPE_GAP, height: 600 }}
                   >
                      <div className="absolute top-0 w-[110%] -left-[5%] h-6 bg-[#73bf2e] border-2 border-black"></div>
                   </div>
                </div>
             ))}

            {/* Ground */}
            <div className="absolute bottom-0 left-0 w-full h-[20%] z-20 pointer-events-none">
                <div className="h-4 w-full bg-[#54ac42] border-t-4 border-b-2 border-flappy-outline"></div>
                <div className="w-full h-[calc(100%-16px)] bg-[#ded895] border-t-2 border-flappy-outline" style={{
                    backgroundImage: 'linear-gradient(rgba(185, 163, 90, 0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(185, 163, 90, 0.7) 1px, transparent 1px)',
                    backgroundSize: '8px 8px'
                }}></div>
            </div>
         </div>
       </div>

       {showSettings && (
         <MapEditorModal 
           existingMap={metadata as MapData}
           onClose={() => setShowSettings(false)}
           onProceedToCanvas={(data) => {
             setMetadata(prev => ({ ...prev, ...data }));
             setShowSettings(false);
           }}
         />
       )}
    </div>
  );
};
