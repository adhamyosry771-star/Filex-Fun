
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

    const player = new SVGA.Player(containerRef.current);
    const parser = new SVGA.Parser();

    parser.load(src, (videoItem: any) => {
      player.setVideoItem(videoItem);
      player.startAnimation();
      player.onFinished(() => {
        onComplete();
      });
    }, (err: any) => {
      console.error("SVGA Load Error:", err);
      onComplete(); // Fail gracefully
    });

    // Fallback in case onFinished doesn't fire or loop issue
    const timeout = setTimeout(() => {
        onComplete();
    }, 8000); // 8 seconds max

    return () => {
      player.clear();
      clearTimeout(timeout);
    };
  }, [src, onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-[150] pointer-events-none flex items-center justify-center"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default SvgaOverlay;
