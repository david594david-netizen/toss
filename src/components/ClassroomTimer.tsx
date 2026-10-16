import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles, 
  Bell, 
  Plus, 
  Minus,
  Clock,
  AlarmClock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ClassroomTimerProps {
  classNameTitle?: string;
}

const TIMER_PRESETS = [
  { label: '1 分鐘', desc: '快問快答 / 整理桌面', seconds: 60 },
  { label: '3 分鐘', desc: '小組發想 / 腦力激盪', seconds: 180 },
  { label: '5 分鐘', desc: '課堂討論 / 聚焦對話', seconds: 300 },
  { label: '10 分鐘', desc: '分組實作 / 任務挑戰', seconds: 600 },
  { label: '15 分鐘', desc: '專案深入 / 發表準備', seconds: 900 },
  { label: '20 分鐘', desc: '隨堂測驗 / 實作報告', seconds: 1200 },
];

export const ClassroomTimer: React.FC<ClassroomTimerProps> = ({ classNameTitle = '班級課堂' }) => {
  // Timer settings
  const [totalSeconds, setTotalSeconds] = useState<number>(300); // default 5 mins
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Audio toggles
  const [enableTicking, setEnableTicking] = useState<boolean>(false);
  const [enableCountdownBeeps, setEnableCountdownBeeps] = useState<boolean>(true);
  const [activityNote, setActivityNote] = useState<string>('小組討論與任務挑戰');

  // Custom inputs
  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [customSecondsInput, setCustomSecondsInput] = useState<number>(0);

  // Projector fullscreen
  const [isProjectorView, setIsProjectorView] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger celebration
  const fireFinishConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
      });
    } catch {
      // Safeguard
    }
  };

  // Timer interval effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);

            // Play final bell & confetti
            soundManager.playUrgentBeep(true);
            setTimeout(() => {
              soundManager.playSchoolBell();
            }, 300);
            fireFinishConfetti();

            return 0;
          }

          const next = prev - 1;

          // Sound effects during countdown
          if (enableCountdownBeeps && next <= 5 && next > 0) {
            soundManager.playUrgentBeep(false);
          } else if (enableTicking) {
            soundManager.playTimerTick();
          }

          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, enableTicking, enableCountdownBeeps]);

  // Keyboard shortcut: Spacebar to toggle pause/play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          handleTogglePlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isFinished, remainingSeconds]);

  const handleTogglePlay = () => {
    if (isFinished) {
      // Restart
      handleReset();
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
    soundManager.playClick();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(totalSeconds);
    soundManager.playClick();
  };

  const handleApplyPreset = (secs: number, label: string) => {
    setIsRunning(false);
    setIsFinished(false);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setActivityNote(label);
    soundManager.playClick();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Math.max(10, customMinutes * 60 + customSecondsInput);
    setIsRunning(false);
    setIsFinished(false);
    setTotalSeconds(total);
    setRemainingSeconds(total);
    soundManager.playClick();
  };

  const handleAdjustTime = (delta: number) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(0, prev + delta);
      if (next > totalSeconds) {
        setTotalSeconds(next);
      }
      return next;
    });
    soundManager.playClick();
  };

  // Time format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Percentage for progress ring
  const progressPercent = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const isUrgent = remainingSeconds <= 10 && remainingSeconds > 0;
  const isWarning = remainingSeconds <= 30 && remainingSeconds > 10;

  // Circle SVG metrics
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Setting Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlarmClock className="w-5 h-5 text-indigo-600" />
            班級活動倒數計時器
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            視覺化圓環進度 • 鈴聲提醒 • 投影大螢幕專屬視圖
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sound options */}
          <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableCountdownBeeps}
              onChange={(e) => setEnableCountdownBeeps(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300"
            />
            <span>最後 5 秒倒數嗶聲</span>
          </label>

          <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableTicking}
              onChange={(e) => setEnableTicking(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300"
            />
            <span>每秒滴答聲</span>
          </label>

          <button
            type="button"
            onClick={() => setIsProjectorView(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>投影大螢幕全螢幕</span>
          </button>
        </div>
      </div>

      {/* Main Center Countdown Stage */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
        {/* Activity Name Input */}
        <div className="mb-6 flex items-center space-x-2">
          <input
            type="text"
            value={activityNote}
            onChange={(e) => setActivityNote(e.target.value)}
            placeholder="點擊輸入當前活動名稱 (例如：小組分組討論)..."
            className="text-base sm:text-lg font-bold text-center text-slate-800 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-1.5 focus:outline-none transition-all w-72 sm:w-96 shadow-2xs"
          />
        </div>

        {/* Circular SVG Timer Display */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
            {/* Background Track */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="14"
              className="text-slate-100"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${
                isFinished
                  ? 'text-rose-500'
                  : isUrgent
                  ? 'text-rose-500'
                  : isWarning
                  ? 'text-amber-500'
                  : 'text-indigo-600'
              }`}
              fill="transparent"
            />
          </svg>

          {/* Time digits in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isFinished ? (
              <div className="animate-bounce">
                <Bell className="w-12 h-12 text-rose-500 mx-auto mb-1 animate-pulse" />
                <span className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight">
                  時間到！
                </span>
                <span className="block text-xs font-bold text-slate-500 mt-1">
                  請同學停筆 / 結束討論
                </span>
              </div>
            ) : (
              <div className={isUrgent ? 'animate-pulse' : ''}>
                <span
                  className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
                    isUrgent
                      ? 'text-rose-600'
                      : isWarning
                      ? 'text-amber-600'
                      : 'text-slate-900'
                  }`}
                >
                  {formatTime(remainingSeconds)}
                </span>
                <span className="block text-xs font-semibold text-slate-400 mt-1">
                  {isRunning ? '計時進行中' : '計時已暫停'} • 按空白鍵暫停/繼續
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic adjust buttons during run (+30s / +1m) */}
        <div className="flex items-center space-x-2 mt-6">
          <button
            type="button"
            onClick={() => handleAdjustTime(-30)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            -30 秒
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(30)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            +30 秒
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(60)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            +1 分鐘
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(300)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            +5 分鐘
          </button>
        </div>

        {/* Main Controls (Start/Pause, Reset) */}
        <div className="flex items-center space-x-4 mt-6">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-8 py-3.5 rounded-2xl font-black text-base flex items-center space-x-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>暫停計時</span>
              </>
            ) : isFinished ? (
              <>
                <RotateCcw className="w-5 h-5" />
                <span>重新開始</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>開始計時 (空白鍵)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重設時間</span>
          </button>
        </div>
      </div>

      {/* Quick Presets & Custom Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presets (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">常見課堂活動預設時間</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.seconds, preset.desc)}
                className={`p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${
                  totalSeconds === preset.seconds
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <span className="block font-black text-slate-900 text-base">
                  {preset.label}
                </span>
                <span className="block text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {preset.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">自訂計時長度</h4>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">分鐘 (Min)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">秒數 (Sec)</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customSecondsInput}
                    onChange={(e) => setCustomSecondsInput(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                套用自訂時間
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            💡 小技巧：計時期間隨時可以點擊「+1分鐘」或「+30秒」延長課堂討論時間！
          </div>
        </div>
      </div>

      {/* Classroom Projector Fullscreen Mode */}
      {isProjectorView && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-12 animate-in fade-in select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                CLASSROOM PROJECTOR • 課堂活動計時
              </span>
              <h2 className="text-2xl font-black text-white">{activityNote}</h2>
            </div>
            <button
              onClick={() => setIsProjectorView(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
            >
              關閉投影 (Esc)
            </button>
          </div>

          {/* Huge Center Stage */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {isFinished ? (
              <div className="space-y-6 animate-bounce">
                <Bell className="w-24 h-24 text-rose-500 mx-auto animate-pulse" />
                <h1 className="text-7xl sm:text-9xl font-black text-rose-500 tracking-tight drop-shadow-[0_0_35px_rgba(244,63,94,0.6)]">
                  時間到！
                </h1>
                <p className="text-2xl sm:text-3xl font-bold text-white">請全班同學注意，時間結束！</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h1
                  className={`font-mono text-8xl sm:text-[14rem] font-black tracking-tight leading-none drop-shadow-2xl ${
                    isUrgent
                      ? 'text-rose-500 animate-pulse'
                      : isWarning
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {formatTime(remainingSeconds)}
                </h1>
                <p className="text-xl sm:text-2xl text-indigo-300 font-semibold">
                  {isRunning ? '⏳ 專注任務進行中...' : '⏸️ 目前已暫停'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-12 py-5 rounded-2xl text-2xl font-black text-slate-950 shadow-2xl transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-400 hover:bg-amber-300'
                  : 'bg-indigo-400 hover:bg-indigo-300'
              }`}
            >
              {isRunning ? '暫停計時 (空白鍵)' : '開始計時 (空白鍵)'}
            </button>
            <button
              type="button"
              onClick={() => handleAdjustTime(60)}
              className="px-6 py-5 rounded-2xl text-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              +1 分鐘
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
