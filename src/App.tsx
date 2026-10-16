import React, { useState, useEffect } from 'react';
import { ClassRoster, DrawRecord } from './types/student';
import { 
  getSavedClasses, 
  saveClasses, 
  getActiveRosterId, 
  setActiveRosterId, 
  getDrawHistory, 
  saveDrawHistory 
} from './utils/storage';
import { Header } from './components/Header';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouping } from './components/AutoGrouping';
import { ClassroomTimer } from './components/ClassroomTimer';
import { RosterManager } from './components/RosterManager';
import { soundManager } from './utils/audio';
import { HelpCircle, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [classes, setClasses] = useState<ClassRoster[]>([]);
  const [activeClassId, setActiveClassIdState] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'picker' | 'grouping' | 'timer' | 'roster'>('picker');
  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);

  // Initialize from storage on mount
  useEffect(() => {
    const saved = getSavedClasses();
    setClasses(saved);
    const activeId = getActiveRosterId() || saved[0]?.id || '';
    setActiveClassIdState(activeId);
    if (activeId) {
      setDrawHistory(getDrawHistory(activeId));
    }
  }, []);

  const activeClass = classes.find(c => c.id === activeClassId) || classes[0];

  // Select class
  const handleSelectClass = (id: string) => {
    setActiveClassIdState(id);
    setActiveRosterId(id);
    setDrawHistory(getDrawHistory(id));
    soundManager.playClick();
  };

  // Create new class
  const handleCreateClass = (name: string) => {
    const newClass: ClassRoster = {
      id: `class_${Date.now()}`,
      name,
      createdAt: Date.now(),
      students: [],
    };
    const updated = [newClass, ...classes];
    setClasses(updated);
    saveClasses(updated);
    setActiveClassIdState(newClass.id);
    setActiveRosterId(newClass.id);
    setDrawHistory([]);
    setCurrentTab('roster'); // Jump to roster tab to paste or upload
  };

  // Update existing roster
  const handleUpdateRoster = (updated: ClassRoster) => {
    const updatedClasses = classes.map(c => c.id === updated.id ? updated : c);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);
  };

  // Delete roster
  const handleDeleteRoster = (id: string) => {
    if (classes.length <= 1) {
      alert('請至少保留一個班級名單！');
      return;
    }
    const updatedClasses = classes.filter(c => c.id !== id);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);
    const nextActive = updatedClasses[0].id;
    setActiveClassIdState(nextActive);
    setActiveRosterId(nextActive);
    setDrawHistory(getDrawHistory(nextActive));
    soundManager.playClick();
  };

  // Rename roster
  const handleRenameRoster = (id: string, newName: string) => {
    const updatedClasses = classes.map(c => c.id === id ? { ...c, name: newName } : c);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);
  };

  // Add draw history
  const handleAddHistoryRecord = (record: DrawRecord) => {
    const next = [record, ...drawHistory];
    setDrawHistory(next);
    if (activeClass) {
      saveDrawHistory(activeClass.id, next);
    }
  };

  // Clear draw history
  const handleClearHistory = () => {
    setDrawHistory([]);
    if (activeClass) {
      saveDrawHistory(activeClass.id, []);
    }
    soundManager.playClick();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      {/* Header bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onCreateClass={handleCreateClass}
        activeClass={activeClass}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeClass ? (
          <>
            {currentTab === 'picker' && (
              <RandomPicker
                roster={activeClass}
                onUpdateRoster={handleUpdateRoster}
                drawHistory={drawHistory}
                onAddHistoryRecord={handleAddHistoryRecord}
                onClearHistory={handleClearHistory}
              />
            )}

            {currentTab === 'grouping' && (
              <AutoGrouping roster={activeClass} />
            )}

            {currentTab === 'timer' && (
              <ClassroomTimer classNameTitle={activeClass.name} />
            )}

            {currentTab === 'roster' && (
              <RosterManager
                roster={activeClass}
                onUpdateRoster={handleUpdateRoster}
                onDeleteRoster={handleDeleteRoster}
                onRenameRoster={handleRenameRoster}
              />
            )}
          </>
        ) : (
          <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">建立您的第一個班級</h3>
            <p className="text-sm text-slate-500 mb-4">輸入班級名稱以開始使用隨機點名與分組工具。</p>
            <button
              onClick={() => handleCreateClass('我的示範班級')}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
            >
              建立預設班級
            </button>
          </div>
        )}
      </main>

      {/* Classroom Teacher Tips Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              💡 <b>課堂便利技巧：</b>在隨機點名與計時器皆可按「空白鍵」暫停/開始；分組頁面點擊學生名字可指定組長；若有學生請假，在名單管理點擊「請假」即可自動排除。
            </span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>課堂互動神器 • 為熱愛教學的老師打造</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
