
import React from 'react';
import { Maximize2, X, Volume2 } from 'lucide-react';
import { Room } from '../types';

interface MiniRoomPlayerProps {
  room: Room;
  onMaximize: () => void;
  onClose: () => void;
}

const MiniRoomPlayer: React.FC<MiniRoomPlayerProps> = ({ room, onMaximize, onClose }) => {
  return (
    <div className="fixed bottom-[85px] left-2 right-2 bg-gray-900/95 backdrop-blur-md border border-brand-500/30 rounded-2xl p-3 shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-5">
      
      {/* Room Info */}
      <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer" onClick={onMaximize}>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-500">
           <img src={room.thumbnail} alt="Room" className="w-full h-full object-cover" />
           <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Volume2 className="w-4 h-4 text-white animate-pulse" />
           </div>
        </div>
        <div className="flex flex-col min-w-0">
           <h4 className="text-white text-xs font-bold truncate">{room.title}</h4>
           <p className="text-brand-400 text-[10px] truncate">
              Hosted by {room.hostName}
           </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <button 
            onClick={onMaximize}
            className="p-2 bg-brand-600 rounded-full text-white hover:bg-brand-500 transition shadow-lg shadow-brand-500/20"
          >
             <Maximize2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 bg-gray-800 rounded-full text-red-400 hover:bg-gray-700 transition"
          >
             <X className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};

export default MiniRoomPlayer;
