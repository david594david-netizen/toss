import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Check, 
  History, 
  Users, 
  Maximize2, 
  Volume2, 
  Settings2,
  AlertCircle,
  Award
} from 'lucide-react';
import { ClassRoster, DrawRecord, Student } from '../types/student';
import { soundManager } from '../utils/audio';

interface RandomPickerProps {
  roster: ClassRoster;
  onUpdateRoster: (updated: ClassRoster) => void;
  drawHistory: DrawRecord[];
  onAddHistoryRecord: (record: DrawRecord) => void;
  onClearHistory: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  roster,
  onUpdateRoster,
  drawHistory,
  onAddHistoryRecord,
  onClearHistory,
}) => {
  // Settings
  const [allowRepeats, setAllowRepeats] = useState<boolean>(false);
  const [pickCount, setPickCount] = useState<number>(1);
  const [excludeAbsent, setExcludeAbsent] = useState<boolean>(true);

  // Animation states
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayCandidate, setDisplayCandidate] = useState<Student | null>(null);
  const [currentWinners, setCurrentWinners] = useState<Student[]>([]);
  const [isProjectorView, setIsProjectorView] = useState<boolean>(false);

  const rollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available candidate pool based on settings
  const eligiblePool = roster.students.filter(s => {
    if (excludeAbsent && !s.isPresent) return false;
    if (!allowRepeats && s.isPicked) return false;
    return true;
  });

  const pickedStudents = roster.students.filter(s => s.isPicked);
  const totalEligible = roster.students.filter(s => !excludeAbsent || s.isPresent);

  // Trigger celebration confetti
  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#6366f1'],
      });

      // Extra burst for excitement
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // Confetti fallback
    }
  };

  // Main draw handler with dynamic deceleration curve
  const handleStartDraw = () => {
    if (isRolling) return;
    if (eligiblePool.length === 0) {
      soundManager.playPop();
      return;
    }

    setIsRolling(true);
    setCurrentWinners([]);

    // Determine how many we will pick
    const countToPick = Math.min(pickCount, eligiblePool.length);

    // Pick unique winners in advance
    const shuffledPool = [...eligiblePool].sort(() => Math.random() - 0.5);
    const selectedWinners = shuffledPool.slice(0, countToPick);

    // Animation variables: starting speed 40ms, decelerating up to 450ms over ~2.8 seconds
    let currentSpeed = 40;
    const startTime = Date.now();
    const duration = 2600; // 2.6s roll duration

    soundManager.playDrumroll(duration);

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      // Pick a random student from the whole active class to display during reel
      const randomIdx = Math.floor(Math.random() * totalEligible.length);
      const tempStudent = totalEligible[randomIdx] || eligiblePool[0];
      setDisplayCandidate(tempStudent);

      // Play tick sound (pitch slightly rises as tension grows)
      soundManager.playTick(1 + progress * 0.4);

      if (progress < 1) {
        // Deceleration curve: speed increases from 40ms to ~350ms
        currentSpeed = 40 + Math.pow(progress, 2.5) * 320;
        rollTimerRef.current = setTimeout(step, currentSpeed);
      } else {
        // Finish roll!
        setIsRolling(false);
        setDisplayCandidate(selectedWinners[0]);
        setCurrentWinners(selectedWinners);

        // Update student states (mark as picked if no repeats)
        const winnerIds = new Set(selectedWinners.map(w => w.id));
        const updatedStudents = roster.students.map(s => {
          if (winnerIds.has(s.id)) {
            return {
              ...s,
              isPicked: true,
              pickedCount: (s.pickedCount || 0) + 1,
            };
          }
          return s;
        });

        onUpdateRoster({
          ...roster,
          students: updatedStudents,
        });

        // Add to history
        onAddHistoryRecord({
          id: `draw_${Date.now()}`,
          timestamp: Date.now(),
          students: selectedWinners,
          mode: countToPick === 1 ? 'single' : 'multiple',
        });

        // Grand celebration sound and visual explosion!
        soundManager.playFanfare();
        fireConfetti();
      }
    };

    step();
  };

  // Keyboard shortcut: Spacebar to roll if not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRolling) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
          e.preventDefault();
          handleStartDraw();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, [isRolling, eligiblePool, pickCount, totalEligible]);

  // Reset all picked state
  const handleResetPool = () => {
    const updated = roster.students.map(s => ({ ...s, isPicked: false }));
    onUpdateRoster({ ...roster, students: updated });
    setCurrentWinners([]);
    setDisplayCandidate(null);
    soundManager.playClick();
  };

  // Un-pick single student
  const handleUnpickStudent = (studentId: string) => {
    const updated = roster.students.map(s => 
      s.id === studentId ? { ...s, isPicked: false } : s
    );
    onUpdateRoster({ ...roster, students: updated });
    soundManager.playClick();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Setting Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode toggles */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Allow repeat toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">重複抽取模式：</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAllowRepeats(false);
                  soundManager.playClick();
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  !allowRepeats
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                不重複抽籤 (推薦)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAllowRepeats(true);
                  soundManager.playClick();
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  allowRepeats
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                允許重複抽籤
              </button>
            </div>
          </div>

          {/* Pick count selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">單次抽幾人：</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setPickCount(cnt);
                    soundManager.playClick();
                  }}
                  className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${
                    pickCount === cnt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Exclude absent toggle */}
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={excludeAbsent}
              onChange={(e) => setExcludeAbsent(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>排除請假學生</span>
          </label>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center space-x-2">
          {!allowRepeats && (
            <button
              type="button"
              onClick={handleResetPool}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置抽籤池</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsProjectorView(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>投影大螢幕模式</span>
          </button>
        </div>
      </div>

      {/* Main Animated Stage Area */}
      <div className="relative overflow-hidden bg-linear-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-indigo-800/40 text-center flex flex-col items-center justify-center min-h-[420px]">
        {/* Subtle decorative glowing background rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Status Badge */}
        <div className="relative z-10 mb-6 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-indigo-200 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>
            {allowRepeats ? (
              '模式：允許重複抽籤（全體候選）'
            ) : (
              `待抽名單：剩餘 ${eligiblePool.length} 人 / 總共 ${totalEligible.length} 人`
            )}
          </span>
        </div>

        {/* Center Stage: Rolling Reel or Winner Spotlight */}
        <div className="relative z-10 w-full max-w-2xl min-h-[170px] flex items-center justify-center">
          {/* Empty pool notification */}
          {!allowRepeats && eligiblePool.length === 0 && !isRolling && currentWinners.length === 0 ? (
            <div className="text-center py-6 animate-in fade-in">
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-2xl font-black text-white">太棒了！全班所有學生皆已抽過一輪</h3>
              <p className="text-sm text-indigo-200 mt-2 mb-4">點擊下方按鈕即可重新開啟新的一輪抽籤！</p>
              <button
                type="button"
                onClick={handleResetPool}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-lg transition-all transform hover:scale-105"
              >
                重新開始新一輪
              </button>
            </div>
          ) : isRolling ? (
            /* Running Slot Roll Animation */
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="inline-block px-8 py-4 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-indigo-400/50 shadow-2xl scale-110 animate-pulse">
                <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold block mb-1">
                  正在極速轉動中...
                </span>
                <span className="text-5xl md:text-6xl font-black tracking-tight text-amber-300 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {displayCandidate ? displayCandidate.name : '準備揭曉'}
                </span>
                {displayCandidate?.seatNumber && (
                  <span className="block text-sm font-semibold text-indigo-200 mt-1">
                    座號 #{displayCandidate.seatNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300 animate-pulse font-mono">
                ⚡ 運氣正在凝聚中... 緊張開箱！
              </p>
            </div>
          ) : currentWinners.length > 0 ? (
            /* Winner Spotlight Display */
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>恭喜幸運抽中！</span>
              </div>

              {/* Winners Grid */}
              <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                {currentWinners.map((winner) => (
                  <div
                    key={winner.id}
                    className="bg-white/15 backdrop-blur-md border-2 border-amber-300/60 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col items-center min-w-[200px] transform hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-linear-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-slate-950 font-black text-lg mb-2 shadow-md">
                      {winner.gender === 'M' ? '👦' : winner.gender === 'F' ? '👧' : '🎓'}
                    </div>

                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {winner.name}
                    </span>

                    <div className="flex items-center gap-2 mt-2">
                      {winner.seatNumber && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono font-bold">
                          座號 #{winner.seatNumber}
                        </span>
                      )}
                      {winner.gender && (
                        <span className="text-xs text-indigo-200">
                          {winner.gender === 'M' ? '男同學' : winner.gender === 'F' ? '女同學' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Idle Ready State */
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-800/50 border border-indigo-700/60 flex items-center justify-center mx-auto mb-4 text-indigo-300 shadow-inner">
                <Dices className="w-10 h-10 animate-spin-slow" />
              </div>
              <h3 className="text-3xl font-black text-white">點擊下方按鈕開始隨機抽籤</h3>
              <p className="text-xs text-indigo-300 mt-2">
                按鍵盤 <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-white text-[11px]">空白鍵 Space</kbd> 也可以立即抽取！
              </p>
            </div>
          )}
        </div>

        {/* Main Action Big Button */}
        <div className="relative z-10 mt-8">
          <button
            type="button"
            disabled={isRolling || (!allowRepeats && eligiblePool.length === 0)}
            onClick={handleStartDraw}
            className="group relative inline-flex items-center space-x-3 px-10 py-4 text-lg md:text-xl font-black rounded-2xl bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Dices className={`w-6 h-6 text-slate-950 ${isRolling ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>
              {isRolling
                ? '點名抽取中...'
                : currentWinners.length > 0
                ? '再抽下一位 / 下一組'
                : `隨機點名抽 ${pickCount} 人`}
            </span>
          </button>
        </div>
      </div>

      {/* Pool and History Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Remaining / Picked Pool (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">
                學生名單狀態池 ({roster.students.length}人)
              </h4>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                待抽：{eligiblePool.length}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                已抽中：{pickedStudents.length}
              </span>
            </div>
          </div>

          {/* Student Badges Grid */}
          <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1">
            {roster.students.map((student) => {
              const isEligible = eligiblePool.some(e => e.id === student.id);
              return (
                <div
                  key={student.id}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    student.isPicked
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : !student.isPresent
                      ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-[10px] opacity-60">#{student.seatNumber}</span>
                  <span>{student.name}</span>
                  {student.isPicked && (
                    <button
                      type="button"
                      onClick={() => handleUnpickStudent(student.id)}
                      title="點擊恢復為待抽狀態"
                      className="ml-1 text-amber-600 hover:text-amber-800 text-[10px] bg-amber-200/60 hover:bg-amber-300 px-1 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Draw History Log (1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">本次抽籤紀錄</h4>
              </div>

              {drawHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs text-slate-400 hover:text-rose-600"
                >
                  清除紀錄
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {drawHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  尚無抽籤紀錄，點擊按鈕抽出幸運同學吧！
                </div>
              ) : (
                drawHistory.map((rec, idx) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 mr-2">
                        #{drawHistory.length - idx}
                      </span>
                      <span className="font-bold text-slate-800">
                        {rec.students.map(s => `${s.name} (#${s.seatNumber})`).join('、 ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projector Fullscreen Modal (Ultra-clean, big fonts for classroom screens) */}
      {isProjectorView && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-12 animate-in fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                CLASSROOM PROJECTOR • 課堂大螢幕投影模式
              </span>
              <h2 className="text-2xl font-black text-white">{roster.name} 隨機點名</h2>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400">
                待抽：{eligiblePool.length} / 總共：{totalEligible.length}
              </span>
              <button
                type="button"
                onClick={() => setIsProjectorView(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
              >
                關閉投影視窗 (Esc)
              </button>
            </div>
          </div>

          {/* Central Large Screen Stage */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {isRolling ? (
              <div className="space-y-4">
                <span className="text-sm font-bold text-amber-400 tracking-widest animate-pulse">
                  ROLLING... 幸運同學即將揭曉！
                </span>
                <h1 className="text-7xl sm:text-9xl font-black text-white tracking-tight drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]">
                  {displayCandidate?.name || '...'}
                </h1>
                <p className="text-2xl font-mono text-indigo-300">
                  座號 #{displayCandidate?.seatNumber}
                </p>
              </div>
            ) : currentWinners.length > 0 ? (
              <div className="space-y-6 animate-in zoom-in-95">
                <div className="inline-block px-6 py-2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-lg font-black tracking-wide">
                  🎉 恭喜幸運抽中！
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8">
                  {currentWinners.map((winner) => (
                    <div
                      key={winner.id}
                      className="p-8 sm:p-12 rounded-3xl bg-white/10 border-4 border-amber-300 backdrop-blur-xl shadow-2xl flex flex-col items-center min-w-[280px]"
                    >
                      <span className="text-6xl sm:text-8xl font-black text-white tracking-tight">
                        {winner.name}
                      </span>
                      <span className="text-xl sm:text-2xl font-mono text-amber-300 font-bold mt-3">
                        座號 #{winner.seatNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Dices className="w-24 h-24 text-indigo-400 mx-auto animate-bounce" />
                <h2 className="text-5xl font-black text-white">準備開始隨機點名</h2>
                <p className="text-sm text-indigo-300">按下方按鈕或鍵盤空白鍵 (Space) 立即抽取</p>
              </div>
            )}
          </div>

          {/* Projector Action Footer */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={isRolling || (!allowRepeats && eligiblePool.length === 0)}
              onClick={handleStartDraw}
              className="px-12 py-5 bg-linear-to-r from-amber-400 to-amber-300 hover:brightness-110 active:scale-95 disabled:opacity-40 text-slate-950 text-2xl font-black rounded-2xl shadow-2xl cursor-pointer transition-all"
            >
              {isRolling ? '抽取中...' : '🎲 點名抽籤 (空白鍵)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
