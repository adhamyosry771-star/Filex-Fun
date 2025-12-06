
import React, { useEffect, useRef } from 'react';
// @ts-ignore
import SVGA from 'svgaplayerweb';

interface SvgaOverlayProps {
  src: string;
  onComplete: () => void;
}

const SvgaOverlay: React.FC<SvgaOverlayProps> = ({ src, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log("Attempting to play SVGA from:", src);

    const player = new SVGA.Player(containerRef.current);
    const parser = new SVGA.Parser();

    parser.load(src, (videoItem: any) => {
      console.log("SVGA Loaded successfully");
      player.setVideoItem(videoItem);
      player.loops = 1; // Play once
      player.clearsAfterStop = true; // Clear after finishing
      player.startAnimation();
      
      player.onFinished(() => {
        console.log("SVGA Finished");
        onComplete();
      });
    }, (err: any) => {
      console.error("SVGA Load Error (Check file path in public/assets/):", err);
      onComplete(); // Fail gracefully so it doesn't stuck
    });

    // Fallback in case onFinished doesn't fire
    const timeout = setTimeout(() => {
        onComplete();
    }, 10000); // 10 seconds max

    return () => {
      player.clear();
      clearTimeout(timeout);
    };
  }, [src, onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-transparent"
    >
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
};

export default SvgaOverlay;
