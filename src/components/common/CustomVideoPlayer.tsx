"use client";

import React, { useState, useEffect, useRef } from "react";

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string; // allow overriding max width, etc.
  style?: React.CSSProperties;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds)) return "0:00";
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function CustomVideoPlayer({ src, poster, className = "", style }: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        if (!isHovering) {
          setShowControls(false);
        }
      }, 2500);
    }
  };

  useEffect(() => {
    resetHideTimer();
  }, [isPlaying, isHovering]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      resetHideTimer();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    resetHideTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
    resetHideTimer();
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    resetHideTimer();
  };

  const toggleFullscreen = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isFullscreen && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    resetHideTimer();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "arrowright":
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5);
        resetHideTimer();
        break;
      case "arrowleft":
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5);
        resetHideTimer();
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        toggleFullscreen();
        break;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden bg-black flex items-center justify-center outline-none group ${className}`}
      style={style}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => { setIsHovering(true); resetHideTimer(); }}
      onMouseLeave={() => { setIsHovering(false); }}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Large Center Play Button */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${(!isPlaying || (showControls && isPlaying)) ? "opacity-100" : "opacity-0"}`}
      >
        <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/90">
          {isPlaying ? (
             <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
             <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 px-3 py-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 flex flex-col gap-1 z-10 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="w-full flex items-center group/progress h-2 mb-1">
          <input 
            type="range" 
            min="0" 
            max={duration || 0} 
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 rounded-full appearance-none cursor-pointer focus:outline-none transition-all hover:h-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:w-2.5 hover:[&::-webkit-slider-thumb]:h-2.5"
            style={{
               background: `linear-gradient(to right, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-white/90">
          <div className="flex items-center gap-3">
             <button onClick={togglePlay} className="hover:text-white transition-colors">
               {isPlaying ? (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               )}
             </button>
             <div className="text-[11px] font-medium tracking-wide">
               {formatTime(currentTime)} / {formatTime(duration)}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 group/vol">
                <button onClick={toggleMute} className="hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                  )}
                </button>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-16 h-1 rounded-full appearance-none cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity duration-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  style={{ background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)` }}
                />
             </div>
             
             <button onClick={toggleFullscreen} className="hover:text-white transition-colors">
               {isFullscreen ? (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
               ) : (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
