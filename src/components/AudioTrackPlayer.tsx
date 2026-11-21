import { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  Pause,
  Play,
  FileText,
  FolderOpen,
  Headphones,
  Film,
} from 'lucide-react';
import type { AudioTrackRef } from '../types/courses';
import {
  findMediaForTrack,
  isVideoFilename,
  type LoadedAudioMap,
} from '../utils/audioMatcher';

export function speakEnglishText(text: string, rate = 0.95) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\s*\/\s*/g, ', ');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-US';
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore speech synthesis failures on unsupported devices
  }
}

export function AudioTrackCard({
  track,
  audioMap,
  onOpenAudioSetup,
}: {
  track: AudioTrackRef;
  audioMap: LoadedAudioMap;
  onOpenAudioSetup: () => void;
}) {
  const localFile = findMediaForTrack(audioMap, track);
  const playableUrl = localFile?.url || track.url;
  const playableName =
    localFile?.fileName || track.fileName || (track.url ? 'Online Media' : '');
  const isVideo =
    localFile?.mediaType === 'video' ||
    track.mediaType === 'video' ||
    track.book === 'video' ||
    Boolean(track.fileName && isVideoFilename(track.fileName)) ||
    Boolean(track.url && isVideoFilename(track.url));

  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<0.8 | 1 | 1.2>(1);
  const [showScript, setShowScript] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  const trackKey = `${track.book ?? 'sb'}:${track.file}:${track.track}:${track.fileName ?? ''}`;

  useEffect(() => {
    setPlaying(false);
    setProgressPct(0);
    if (mediaRef.current) {
      mediaRef.current.pause();
      mediaRef.current.currentTime = 0;
    }
  }, [trackKey, playableUrl]);

  const togglePlay = () => {
    const el = mediaRef.current;
    if (!el || !playableUrl) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.playbackRate = rate;
      el.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  const cycleRate = () => {
    const next: 0.8 | 1 | 1.2 = rate === 1 ? 0.8 : rate === 0.8 ? 1.2 : 1;
    setRate(next);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = next;
    }
  };

  const badgeCls =
    track.book === 'video' || isVideo
      ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200'
      : track.book === 'wb'
      ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200'
      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200';

  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            dir="ltr"
            className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 inline-flex items-center gap-1 ${badgeCls}`}
          >
            {isVideo && <Film className="w-3 h-3" />}
            <span>{track.label}</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {track.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {playableUrl ? (
            <>
              <button
                type="button"
                onClick={togglePlay}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{playing ? 'توقف' : isVideo ? 'پخش ویدیو' : 'پخش صوت'}</span>
              </button>
              <button
                type="button"
                onClick={cycleRate}
                dir="ltr"
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                {rate}x
              </button>
            </>
          ) : (
            <>
              {track.script && (
                <button
                  type="button"
                  onClick={() => speakEnglishText(track.script!, 0.92)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>پخش گوینده</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenAudioSetup}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{isVideo ? 'اتصال MP4' : 'اتصال MP3'}</span>
              </button>
            </>
          )}

          {track.script && (
            <button
              type="button"
              onClick={() => setShowScript((v) => !v)}
              className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showScript ? 'بستن متن' : 'متن فایل'}</span>
            </button>
          )}
        </div>
      </div>

      {!playableUrl && track.fileName && (
        <div
          dir="ltr"
          className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"
        >
          {isVideo ? <Film className="w-3 h-3 shrink-0" /> : <Headphones className="w-3 h-3 shrink-0" />}
          <span>{track.fileName}</span>
        </div>
      )}

      {playableUrl && (
        <div className="space-y-1.5">
          {isVideo ? (
            <video
              ref={(el) => {
                mediaRef.current = el;
              }}
              src={playableUrl}
              controls
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={() => {
                const el = mediaRef.current;
                if (el && el.duration) {
                  setProgressPct((el.currentTime / el.duration) * 100);
                }
              }}
              onEnded={() => {
                setPlaying(false);
                setProgressPct(0);
              }}
              className="w-full max-h-[360px] rounded-xl bg-black border border-slate-300 dark:border-slate-700"
            />
          ) : (
            <>
              <audio
                ref={(el) => {
                  mediaRef.current = el;
                }}
                src={playableUrl}
                onTimeUpdate={() => {
                  const el = mediaRef.current;
                  if (el && el.duration) {
                    setProgressPct((el.currentTime / el.duration) * 100);
                  }
                }}
                onEnded={() => {
                  setPlaying(false);
                  setProgressPct(0);
                }}
              />
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-150"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          )}
          <div
            dir="ltr"
            className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"
          >
            {isVideo ? <Film className="w-3 h-3 shrink-0" /> : <Headphones className="w-3 h-3 shrink-0" />}
            <span>{playableName}</span>
          </div>
        </div>
      )}

      {showScript && track.script && (
        <div
          dir="ltr"
          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-left"
        >
          {track.script}
        </div>
      )}
    </div>
  );
}
