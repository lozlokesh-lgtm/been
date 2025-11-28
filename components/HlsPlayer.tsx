import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  Loader2,
  AlertCircle,
  FileVideo
} from 'lucide-react';

interface HlsPlayerProps {
  src: string;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
  name?: string;
  label?: string; // SD, HD, etc.
}

export const HlsPlayer: React.FC<HlsPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Quality State
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1); // -1 is Auto
  const [showSettings, setShowSettings] = useState(false);

  // Format bitrate to Mbps
  const formatBitrate = (bitrate: number) => {
    if (!bitrate) return '';
    return (bitrate / 1000000).toFixed(1) + 'M';
  };

  // Get resolution label
  const getResolutionLabel = (height: number) => {
    if (height >= 2160) return '4K';
    if (height >= 1440) return '2K';
    if (height >= 1080) return 'FHD';
    if (height >= 720) return 'HD';
    return 'SD';
  };

  const getLabelColor = (label?: string) => {
    if (label === '4K' || label === '2K') return 'bg-purple-600';
    if (label === 'FHD') return 'bg-red-600';
    if (label === 'HD') return 'bg-blue-600';
    return 'bg-gray-600';
  };

  // Setup Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);
    setError(null);
    setQualities([]);
    setCurrentQualityIndex(-1);
    setIsLive(false);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const loadVideo = () => {
      const isHlsSource = src.toLowerCase().includes('.m3u8') || src.toLowerCase().includes('application/vnd.apple.mpegurl');

      // 1. Try HLS.js
      if (isHlsSource && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          startLevel: -1, // Auto
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          setIsBuffering(false);
          setIsLive(data.levels.some(level => level.details?.live));
          
          const levels: QualityLevel[] = data.levels.map((level, index) => ({
            height: level.height,
            bitrate: level.bitrate,
            index: index,
            name: level.height ? `${level.height}p` : `L${index}`,
            label: getResolutionLabel(level.height)
          }));
          
          levels.sort((a, b) => b.height - a.height);
          setQualities(levels);
          
          video.play().catch(() => {
            setIsPlaying(false);
            setIsMuted(true);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError("خطأ في الاتصال بالبث");
                break;
            }
          }
        });

      // 2. Try Native HLS (Safari)
      } else if (isHlsSource && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsBuffering(false);
          video.play().catch(() => setIsMuted(true));
        });
        
      // 3. Fallback to Direct File Playback (MP4, WebM, etc.)
      } else {
        video.src = src;
        video.load();
        // Standard video doesn't have adaptive qualities usually
        setQualities([]); 
        
        video.addEventListener('loadeddata', () => {
            setIsBuffering(false);
            video.play().catch(() => setIsMuted(true));
        });

        video.addEventListener('error', () => {
          const err = video.error;
          if (err) {
             setError("تعذر تشغيل الملف. تأكد من الصيغة والرابط.");
          }
        });
      }
    };

    loadVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      // Clean up listeners for native playback if needed (React mostly handles this via useEffect unmount, 
      // but explicit removal of manual listeners on 'video' element is good practice if attached manually)
    };
  }, [src]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      if (video.duration === Infinity) setIsLive(true);
    };
    
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  // Controls Visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000) as unknown as number;
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
       if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
       controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000) as unknown as number;
    }
  }, [isPlaying]);

  // Actions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const changeQuality = (index: number) => {
    setCurrentQualityIndex(index);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
    }
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Current Quality Label for Button
  const currentQualityLabel = () => {
      if (currentQualityIndex === -1) return 'تلقائي';
      const q = qualities.find(x => x.index === currentQualityIndex);
      return q ? q.name : 'HD';
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden select-none font-sans"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={() => setShowSettings(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
      />

      {/* Loading Overlay */}
      {isBuffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none backdrop-blur-[2px]">
          <Loader2 className="w-14 h-14 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 text-red-500 gap-4 p-4 text-center">
          <AlertCircle className="w-16 h-16 opacity-80" />
          <div className="space-y-2">
             <p className="text-xl font-bold">خطأ في التشغيل</p>
             <p className="text-slate-300 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Controls */}
      <div 
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-4 pt-16 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress */}
        {!isLive && (
            <div className="w-full mb-4 flex items-center group/progress cursor-pointer relative">
             <input
               type="range"
               min={0}
               max={duration || 100}
               value={currentTime}
               onChange={(e) => {
                 if(videoRef.current) videoRef.current.currentTime = Number(e.target.value);
                 setCurrentTime(Number(e.target.value));
               }}
               className="w-full h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer z-10
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full 
                 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]
                 hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
             />
             <div 
               className="absolute left-0 top-0 bottom-0 bg-blue-500/30 rounded-l-lg pointer-events-none h-1.5" 
               style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
             />
           </div>
        )}

        <div className="flex items-center justify-between rtl:space-x-reverse dir-rtl">
          
          {/* Right Controls (Play/Vol) */}
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-transform active:scale-90 focus:outline-none"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
            </button>

            <div className="flex items-center gap-3 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-blue-400">
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            {isLive ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-md shadow-lg shadow-red-900/20 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">مباشر</span>
              </div>
            ) : (
                <div className="text-xs font-mono text-slate-300 hidden sm:block">
                    {new Date(currentTime * 1000).toISOString().substring(14, 19)} / {new Date(duration * 1000).toISOString().substring(14, 19)}
                </div>
            )}
          </div>

          {/* Left Controls (Quality/Full) */}
          <div className="flex items-center gap-3">
             
             {/* Quality Settings - Only show if adaptive bitrate is available */}
             {qualities.length > 0 && (
                 <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/5"
                    title="تغيير الجودة"
                  >
                    <Settings className={`w-4 h-4 text-slate-200 transition-transform duration-500 ${showSettings ? 'rotate-180' : ''}`} />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {currentQualityLabel()}
                    </span>
                  </button>

                  {/* Settings Menu */}
                  {showSettings && (
                    <div className="absolute bottom-full left-0 mb-3 w-56 bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 origin-bottom-left">
                       <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">الجودة المتوفرة</p>
                       </div>
                       <div className="max-h-64 overflow-y-auto scrollbar-hide p-1">
                          <button
                            onClick={() => changeQuality(-1)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg mb-1 transition-all ${currentQualityIndex === -1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-300 hover:bg-white/10'}`}
                          >
                            <span className="flex items-center gap-2">
                                <span className="font-bold">تلقائي</span>
                                <span className="text-[10px] opacity-70">(حسب السرعة)</span>
                            </span>
                            {currentQualityIndex === -1 && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]"></div>}
                          </button>
                          
                          {qualities.map((q) => (
                            <button
                              key={q.index}
                              onClick={() => changeQuality(q.index)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg mb-1 transition-all ${currentQualityIndex === q.index ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-300 hover:bg-white/10'}`}
                            >
                              <div className="flex items-center gap-2">
                                 <span className="font-medium font-mono">{q.name}</span>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded ${getLabelColor(q.label)} text-white font-bold`}>
                                    {q.label}
                                 </span>
                              </div>
                              {currentQualityIndex === q.index && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]"></div>}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}
                 </div>
             )}

             {/* Generic "Standard" Badge if no qualities (MP4) */}
             {qualities.length === 0 && !isLive && (
                 <div className="px-2 py-1 rounded bg-white/5 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400">Standard</span>
                 </div>
             )}

             <button 
                onClick={toggleFullscreen} 
                className="p-2 text-white hover:text-blue-400 transition-colors hover:bg-white/10 rounded-lg"
             >
               {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};