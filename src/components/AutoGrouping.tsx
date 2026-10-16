import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Download, 
  Check, 
  Crown, 
  MoveRight, 
  Maximize2, 
  Sliders, 
  Sparkles,
  Edit2,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { ClassRoster, Group, GroupConfig, Student } from '../types/student';
import { autoGroupStudents, formatGroupsAsText, exportGroupsToCsv, GROUP_THEME_COLORS } from '../utils/grouping';
import { downloadCsvFile } from '../utils/csvParser';
import { soundManager } from '../utils/audio';

interface AutoGroupingProps {
  roster: ClassRoster;
}

export const AutoGrouping: React.FC<AutoGroupingProps> = ({ roster }) => {
  // Grouping configuration
  const [config, setConfig] = useState<GroupConfig>({
    mode: 'byMemberCount',
    targetCount: 4, // Default 4 members per group
    remainderStrategy: 'distribute',
    balanceGender: true,
    autoAssignLeader: true,
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isProjectorView, setIsProjectorView] = useState<boolean>(false);
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  const presentStudents = roster.students.filter(s => s.isPresent);

  // Run grouping
  const handleGenerateGroups = () => {
    if (presentStudents.length === 0) return;
    soundManager.playShuffle();
    const result = autoGroupStudents(presentStudents, config);
    setGroups(result);
  };

  // Initial group generation when component mounts or roster changes
  useEffect(() => {
    if (presentStudents.length > 0 && groups.length === 0) {
      const result = autoGroupStudents(presentStudents, config);
      setGroups(result);
    }
  }, [roster.id]);

  // Copy text to clipboard
  const handleCopyResults = () => {
    if (groups.length === 0) return;
    const text = formatGroupsAsText(groups, `${roster.name} 分組結果`);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      soundManager.playPop();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    if (groups.length === 0) return;
    const csv = exportGroupsToCsv(groups);
    downloadCsvFile(csv, `${roster.name}_分組名單.csv`);
    soundManager.playClick();
  };

  // Designate student as group leader
  const handleToggleLeader = (groupId: string, studentId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        leaderId: g.leaderId === studentId ? undefined : studentId,
      };
    }));
    soundManager.playClick();
  };

  // Rename a group
  const handleRenameGroup = (groupId: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  // Move student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!movingStudent) return;
    const { student, fromGroupId } = movingStudent;
    if (targetGroupId === fromGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups(prev => prev.map(g => {
      if (g.id === fromGroupId) {
        return {
          ...g,
          members: g.members.filter(m => m.id !== student.id),
          leaderId: g.leaderId === student.id ? undefined : g.leaderId,
        };
      }
      if (g.id === targetGroupId) {
        return {
          ...g,
          members: [...g.members, student],
        };
      }
      return g;
    }));

    setMovingStudent(null);
    soundManager.playClick();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              課堂自動分組設定
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              當前在席參與人數：<b className="text-emerald-700 font-semibold">{presentStudents.length}</b> 人
              （已排除請假學生）
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateGroups}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>開始智慧隨機分組</span>
          </button>
        </div>

        {/* Grouping Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Mode switch */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700">分組依據方式：</span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'byMemberCount', targetCount: 4 })}
                className={`flex-1 py-1.5 font-bold rounded-lg transition-colors ${
                  config.mode === 'byMemberCount'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                每組幾人
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'byGroupCount', targetCount: 6 })}
                className={`flex-1 py-1.5 font-bold rounded-lg transition-colors ${
                  config.mode === 'byGroupCount'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                分成幾組
              </button>
            </div>
          </div>

          {/* Target number */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700">
              {config.mode === 'byMemberCount' ? '設定每組人數：' : '設定總共組數：'}
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={presentStudents.length || 50}
                value={config.targetCount}
                onChange={(e) => setConfig({ ...config, targetCount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-500">
                {config.mode === 'byMemberCount' ? '人 / 組' : '組'}
              </span>
            </div>
          </div>

          {/* Remainder strategy */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700">餘數處理方式：</span>
            <select
              value={config.remainderStrategy}
              onChange={(e) => setConfig({ ...config, remainderStrategy: e.target.value as 'distribute' | 'createExtra' })}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="distribute">平均分配至各組 (組人數略微不同)</option>
              <option value="createExtra">獨立多開一組 (最後一組人數較少)</option>
            </select>
          </div>

          {/* Balance options */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={config.balanceGender}
                onChange={(e) => setConfig({ ...config, balanceGender: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>平衡各組男女比例</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={config.autoAssignLeader}
                onChange={(e) => setConfig({ ...config, autoAssignLeader: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>每組隨機指派組長 👑</span>
            </label>
          </div>
        </div>
      </div>

      {/* Visualized Results Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-bold text-slate-900">
            分組結果展示（共 {groups.length} 組）
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            點擊組員可指定組長 • 可自由移動換組
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyResults}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已複製名單！' : '一鍵複製文字名單'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出分組 CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProjectorView(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>全螢幕投影檢視</span>
          </button>
        </div>
      </div>

      {/* Moving Student Helper Banner */}
      {movingStudent && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <span className="flex items-center gap-2">
            <MoveRight className="w-4 h-4 text-amber-600" />
            正在移動學生：<b>{movingStudent.student.name}</b>，請在下方選擇要將他加入的目標組別：
          </span>
          <button
            onClick={() => setMovingStudent(null)}
            className="text-xs px-2.5 py-1 rounded bg-amber-200/70 hover:bg-amber-300 font-bold"
          >
            取消移動
          </button>
        </div>
      )}

      {/* Visualized Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {groups.map((group, gIdx) => {
          const theme = GROUP_THEME_COLORS[gIdx % GROUP_THEME_COLORS.length];
          const malesCount = group.members.filter(m => m.gender === 'M').length;
          const femalesCount = group.members.filter(m => m.gender === 'F').length;

          return (
            <div
              key={group.id}
              className={`rounded-2xl border-2 p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${theme.bg} ${
                movingStudent ? 'ring-2 ring-indigo-300 ring-offset-2' : ''
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${theme.badge.split(' ')[0]}`} />
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                      className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-400 focus:border-indigo-600 focus:outline-none px-0.5"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-black/5">
                      {group.members.length} 人
                    </span>
                    {movingStudent && movingStudent.fromGroupId !== group.id && (
                      <button
                        onClick={() => handleMoveStudent(group.id)}
                        className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 animate-pulse"
                      >
                        移入此組
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-info: gender ratio */}
                {(malesCount > 0 || femalesCount > 0) && (
                  <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-2">
                    <span>男女比例：{malesCount} 男 • {femalesCount} 女</span>
                  </div>
                )}

                {/* Member Chips List */}
                <div className="space-y-2">
                  {group.members.map((member) => {
                    const isLeader = group.leaderId === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`group p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isLeader
                            ? 'bg-amber-100/90 border-amber-300 text-amber-950 shadow-2xs font-bold'
                            : 'bg-white/90 border-slate-200/80 text-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        <div 
                          className="flex items-center space-x-2 cursor-pointer flex-1"
                          onClick={() => handleToggleLeader(group.id, member.id)}
                          title="點擊設定為組長"
                        >
                          {isLeader ? (
                            <Crown className="w-4 h-4 text-amber-600 fill-amber-400" />
                          ) : (
                            <span className="text-slate-400 text-xs">
                              {member.gender === 'M' ? '👦' : member.gender === 'F' ? '👧' : '•'}
                            </span>
                          )}
                          <span className="text-xs font-bold">
                            {member.name}
                          </span>
                          {member.seatNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{member.seatNumber}
                            </span>
                          )}
                        </div>

                        {/* Move student action */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setMovingStudent({ student: member, fromGroupId: group.id })}
                            title="移動此學生至其他組"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 text-[10px]"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {group.members.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed rounded-xl">
                      此組目前無成員
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Projector Fullscreen Modal for Groups */}
      {isProjectorView && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col p-6 sm:p-10 overflow-y-auto animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
            <div>
              <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
                CLASSROOM DISPLAY • 課堂分組投影檢視
              </span>
              <h2 className="text-2xl font-black text-white">{roster.name} 分組結果</h2>
            </div>
            <button
              onClick={() => setIsProjectorView(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
            >
              關閉投影 (Esc)
            </button>
          </div>

          {/* Big Grid of Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group, idx) => (
              <div
                key={group.id}
                className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h3 className="text-xl font-black text-amber-300">{group.name}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white font-bold">
                      {group.members.length} 人
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {group.members.map((member) => {
                      const isLeader = group.leaderId === member.id;
                      return (
                        <div
                          key={member.id}
                          className={`p-3 rounded-xl flex items-center justify-between ${
                            isLeader
                              ? 'bg-amber-400/20 border border-amber-400/60 text-amber-200'
                              : 'bg-white/5 border border-white/10 text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-300" />}
                            <span className="text-base font-bold tracking-wide">
                              {member.name}
                            </span>
                            {isLeader && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                                組長
                              </span>
                            )}
                          </div>
                          {member.seatNumber && (
                            <span className="text-xs font-mono text-slate-400">
                              #{member.seatNumber}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
