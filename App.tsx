import React, { useState } from 'react';
import { HlsPlayer } from './components/HlsPlayer';
import { Play, Tv, Wifi, Settings, Film, Layers } from 'lucide-react';

const DEFAULT_STREAM = "https://af.ayassport.ir/hls2/bein1.m3u8";

const App: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState<string>(DEFAULT_STREAM);
  const [urlInput, setUrlInput] = useState<string>(DEFAULT_STREAM);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setStreamUrl(urlInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">StreamFlow <span className="text-blue-500">Pro</span></h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">All Formats Player</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               مشغل متعدد الجودة (SD/HD/4K)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col gap-8 items-center justify-start">
        
        {/* Player Section */}
        <div className="w-full max-w-5xl flex flex-col gap-4">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 ring-4 ring-slate-900/50 group">
                {/* Decorative glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-lg group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative h-full w-full z-10">
                    <HlsPlayer src={streamUrl} />
                </div>
            </div>

            {/* Features Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Wifi className="w-5 h-5"/></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400">تكيّف تلقائي</span>
                        <span className="text-sm font-bold text-slate-200">سرعة النت</span>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Layers className="w-5 h-5"/></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400">جودة متعددة</span>
                        <span className="text-sm font-bold text-slate-200">SD, HD, 4K</span>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Film className="w-5 h-5"/></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400">صيغ مدعومة</span>
                        <span className="text-sm font-bold text-slate-200">MP4, M3U8</span>
                    </div>
                </div>
                 <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><Settings className="w-5 h-5"/></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400">تحكم كامل</span>
                        <span className="text-sm font-bold text-slate-200">سلس وسريع</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleUrlSubmit} className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span>رابط الفيديو أو البث المباشر</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">يدعم كافة الصيغ</span>
              </label>
              <div className="relative group">
                <input
                  id="url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/stream.m3u8 OR video.mp4"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 pl-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-left dir-ltr font-mono text-sm shadow-inner"
                  dir="ltr"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none opacity-50">
                    <span className="text-[10px] border border-slate-600 px-1 rounded text-slate-500">M3U8</span>
                    <span className="text-[10px] border border-slate-600 px-1 rounded text-slate-500">MP4</span>
                </div>
              </div>
            </div>
            <div className="md:self-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>تشغيل الآن</span>
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50">
             <div className="flex flex-wrap justify-center gap-3">
                {['Live Stream', 'MP4', 'HLS', 'WebM', 'MKV', 'Auto Bitrate', '4K Support'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 font-medium">
                        {tag}
                    </span>
                ))}
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950">
        <div className="container mx-auto px-4 text-center">
            <p className="text-slate-600 text-sm">
            &copy; 2024 StreamFlow Player. Optimized for Arabic Users.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;