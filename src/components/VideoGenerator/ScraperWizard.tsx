import React, { useState } from 'react';
import { useScraperStore } from '../../stores/useScraperStore';
import { Link2, Play, AlertCircle, CheckCircle2, Loader2, Video, RefreshCw } from 'lucide-react';

export const ScraperWizard: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const { url, status, progress, message, videoUrl, startPipeline, reset } = useScraperStore();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    startPipeline(inputUrl.trim());
  };

  const handleReset = () => {
    setInputUrl('');
    reset();
  };

  const renderProgressBar = () => {
    if (status === 'idle' || status === 'error') return null;
    
    return (
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-white">{message}</span>
          <span className="text-zinc-400">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status Steps indicator */}
        <div className="flex justify-between mt-4 text-xs">
          <div className={`flex flex-col items-center gap-2 ${status !== 'idle' ? 'text-blue-400' : 'text-zinc-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status !== 'idle' ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>1</div>
            <span>Phân tích Web</span>
          </div>
          <div className={`flex flex-col items-center gap-2 ${['scripting', 'tts', 'rendering', 'done'].includes(status) ? 'text-blue-400' : 'text-zinc-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${['scripting', 'tts', 'rendering', 'done'].includes(status) ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>2</div>
            <span>Kịch bản & Giọng đọc</span>
          </div>
          <div className={`flex flex-col items-center gap-2 ${['rendering', 'done'].includes(status) ? 'text-blue-400' : 'text-zinc-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${['rendering', 'done'].includes(status) ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>3</div>
            <span>Render Video</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Auto-Create Video</h1>
        <p className="text-zinc-400">Tạo video tự động từ bất kỳ bài báo hoặc đường link nào.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
        {status === 'idle' || status === 'error' ? (
          <form onSubmit={handleStart} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Đường dẫn bài viết (URL)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://example.com/article"
                  required
                />
              </div>
            </div>
            
            {status === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!inputUrl.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              Tạo Video Ngay
            </button>
          </form>
        ) : status === 'done' && videoUrl ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2 text-green-400 mb-6">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Video đã được tạo thành công!</span>
            </div>
            
            <div className="aspect-[9/16] max-h-[600px] mx-auto bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex gap-4 justify-center">
              <a 
                href={videoUrl}
                download
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Video className="w-5 h-5" />
                Tải xuống MP4
              </a>
              <button 
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Tạo video mới
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
            </div>
            {renderProgressBar()}
          </div>
        )}
      </div>
    </div>
  );
};
