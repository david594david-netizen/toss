import React, { useState } from 'react';
import { 
  Users, 
  Dices, 
  ListFilter, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Plus, 
  Sparkles,
  School,
  CheckCircle2,
  AlarmClock
} from 'lucide-react';
import { ClassRoster } from '../types/student';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  currentTab: 'picker' | 'grouping' | 'timer' | 'roster';
  setCurrentTab: (tab: 'picker' | 'grouping' | 'timer' | 'roster') => void;
  classes: ClassRoster[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (name: string) => void;
  activeClass: ClassRoster | undefined;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  classes,
  activeClassId,
  onSelectClass,
  onCreateClass,
  activeClass,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNewClassInput, setShowNewClassInput] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
    if (!next) {
      soundManager.playClick();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      onCreateClass(newClassName.trim());
      setNewClassName('');
      setShowNewClassInput(false);
      soundManager.playPop();
    }
  };

  const presentCount = activeClass?.students.filter(s => s.isPresent).length ?? 0;
  const totalCount = activeClass?.students.length ?? 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  課堂互動神助手
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    教師專用版
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                動態點名抽籤 • 智慧卡片分組 • 支援 CSV 匯入
              </p>
            </div>
          </div>

          {/* Center Class Selector */}
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center">
              <span className="text-xs font-medium text-slate-500 mr-2 hidden md:inline">當前班級:</span>
              <select
                value={activeClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-sm font-semibold rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.students.length}人)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowNewClassInput(true)}
                title="新增班級"
                className="ml-2 p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick student counter badge */}
            <div className="hidden lg:flex items-center text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>出席 {presentCount} / 總共 {totalCount} 人</span>
            </div>
          </div>

          {/* Right Controls: Sound & Fullscreen */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleSound}
              title={isMuted ? '開啟音效' : '靜音'}
              className={`p-2 rounded-lg border transition-all ${
                isMuted 
                  ? 'bg-slate-100 text-slate-400 border-slate-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全螢幕' : '全螢幕 (適合投影機)'}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors hidden sm:flex items-center"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-100 py-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setCurrentTab('picker');
              soundManager.playClick();
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              currentTab === 'picker'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>隨機點名抽籤</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500 text-indigo-100 hidden sm:inline">
              動畫音效
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('grouping');
              soundManager.playClick();
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              currentTab === 'grouping'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>智慧自動分組</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-emerald-100 hidden sm:inline">
              視覺化卡片
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('timer');
              soundManager.playClick();
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              currentTab === 'timer'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlarmClock className="w-4 h-4" />
            <span>活動倒數計時</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-amber-100 hidden sm:inline">
              鈴聲投影
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('roster');
              soundManager.playClick();
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              currentTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>名單管理與 CSV 匯入</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* New Class Modal dialog */}
      {showNewClassInput && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">新增班級名單</h3>
            <p className="text-xs text-slate-500 mb-4">輸入新班級名稱，建立後可匯入學生名單。</p>
            <form onSubmit={handleCreateClassSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="例如：八年二班、週三社團..."
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewClassInput(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
