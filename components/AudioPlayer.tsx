import { Card, CardContent } from './ui/card';
import { useState, useEffect, useRef } from 'react';
import { apiEndpoints } from '../lib/apiConfig';

interface AudioPlayerProps {
  title: string;
  articleText: string; // Add article text for audio generation
  onPlayAudio: () => void;
  onPauseAudio: () => void;
  onStopAudio: () => void;
  onReplayAudio: () => void;
  isPlaying?: boolean;
}

export function AudioPlayer({ 
  title,
  articleText,
  onPlayAudio, 
  onPauseAudio, 
  onStopAudio, 
  onReplayAudio,
  isPlaying = false 
}: AudioPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Generate audio when component mounts or articleText changes
  useEffect(() => {
    const generateAudio = async () => {
      if (!articleText) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(apiEndpoints.audio(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: articleText,
            voice: 'Rachel'
          }),
        });
        
        const data = await response.json();
        setAudioUrl(data.audioUrl);
      } catch (error) {
        console.error('Failed to generate audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateAudio();
  }, [articleText]);

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;
    
    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setProgress(100);
      onStopAudio();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, onStopAudio]);

  // Control audio based on isPlaying state
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);

  const handlePlayAudio = () => {
    if (audioUrl && !isLoading) {
      onPlayAudio();
    }
  };

  const handlePauseAudio = () => {
    onPauseAudio();
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
    onStopAudio();
  };

  const handleReplayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      onReplayAudio();
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioUrl) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    
    audioRef.current.currentTime = percent * audioRef.current.duration;
    setProgress(percent * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="auto"
      />
      
      {/* Audio Player Card */}
      <Card className="bg-slate-800/80 border-slate-600">
        <CardContent className="p-6">
          {/* Cassette Tape Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg border-2 border-purple-400/50">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-12 h-12 border-4 border-white/30 rounded-full ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                    <div className="w-2 h-2 bg-white/50 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-2">
            <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">
              {title}
            </h3>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>
                {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
              </span>
              <span>
                {audioRef.current && audioRef.current.duration ? 
                  formatTime(audioRef.current.duration) : '0:00'}
              </span>
            </div>
            <div 
              className="w-full bg-slate-700 rounded-full h-2 cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Play/Pause Button */}
            <button
              onClick={isPlaying ? handlePauseAudio : handlePlayAudio}
              disabled={isLoading || !audioUrl}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="text-white text-base">
                {isLoading ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
              </span>
            </button>

            {/* Stop Button */}
            <button
              onClick={handleStopAudio}
              disabled={isLoading || !audioUrl}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all duration-200 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Stop"
            >
              <span className="text-white text-base">⏹️</span>
            </button>

            {/* Replay Button */}
            <button
              onClick={handleReplayAudio}
              disabled={isLoading || !audioUrl}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Replay"
            >
              <span className="text-white text-base">🔄</span>
            </button>
          </div>

          {/* Status */}
          <div className="text-center mt-3">
            <span className="text-slate-400 text-xs">
              {isLoading ? 'Generating audio...' : 
               !audioUrl ? 'Audio not available' :
               isPlaying ? 'Playing...' : 'Ready to play'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}