import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  Download, 
  RotateCcw, 
  CheckSquare, 
  XSquare, 
  Search, 
  Edit2, 
  Check, 
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ClassRoster, Student } from '../types/student';
import { parseStudentText, exportRosterToCsv, downloadCsvFile, SAMPLE_ROSTERS } from '../utils/csvParser';
import { soundManager } from '../utils/audio';

interface RosterManagerProps {
  roster: ClassRoster;
  onUpdateRoster: (updated: ClassRoster) => void;
  onDeleteRoster: (id: string) => void;
  onRenameRoster: (id: string, newName: string) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  roster,
  onUpdateRoster,
  onDeleteRoster,
  onRenameRoster,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'upload' | 'preset'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newRosterTitle, setNewRosterTitle] = useState(roster.name);

  // New student quick add
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState<string>('');
  const [newStudentGender, setNewStudentGender] = useState<'M' | 'F' | 'Other'>('M');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply parsed students to roster
  const handleApplyPasted = (mode: 'replace' | 'append') => {
    if (!pasteText.trim()) return;
    const parsed = parseStudentText(pasteText);
    if (parsed.length === 0) return;

    let updatedStudents: Student[];
    if (mode === 'replace') {
      updatedStudents = parsed;
    } else {
      updatedStudents = [...roster.students, ...parsed];
    }

    onUpdateRoster({
      ...roster,
      students: updatedStudents,
    });

    setPasteText('');
    soundManager.playFanfare();
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseStudentText(content);
        if (parsed.length > 0) {
          onUpdateRoster({
            ...roster,
            students: parsed,
          });
          soundManager.playFanfare();
        }
      }
    };
    reader.readAsText(file, 'utf-8');
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load a preset template
  const handleLoadPreset = (index: number) => {
    const preset = SAMPLE_ROSTERS[index];
    if (!preset) return;

    const students: Student[] = preset.students.map((s, idx) => ({
      id: `std_${Date.now()}_${idx}`,
      name: s.name,
      seatNumber: s.seatNumber,
      gender: s.gender,
      isPresent: true,
      isPicked: false,
      pickedCount: 0,
    }));

    onUpdateRoster({
      ...roster,
      name: preset.name,
      students,
    });
    setNewRosterTitle(preset.name);
    soundManager.playFanfare();
  };

  // Toggle present status
  const handleTogglePresent = (studentId: string) => {
    const updated = roster.students.map(s => 
      s.id === studentId ? { ...s, isPresent: !s.isPresent } : s
    );
    onUpdateRoster({ ...roster, students: updated });
    soundManager.playClick();
  };

  // Toggle gender
  const handleToggleGender = (studentId: string) => {
    const updated = roster.students.map(s => {
      if (s.id !== studentId) return s;
      const nextGender: 'M' | 'F' | 'Other' = 
        s.gender === 'M' ? 'F' : s.gender === 'F' ? 'Other' : 'M';
      return { ...s, gender: nextGender };
    });
    onUpdateRoster({ ...roster, students: updated });
    soundManager.playClick();
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    const updated = roster.students.filter(s => s.id !== studentId);
    onUpdateRoster({ ...roster, students: updated });
    soundManager.playClick();
  };

  // Reset all picked states
  const handleResetPicked = () => {
    const updated = roster.students.map(s => ({ ...s, isPicked: false, pickedCount: 0 }));
    onUpdateRoster({ ...roster, students: updated });
    soundManager.playClick();
  };

  // Set all present / absent
  const handleSetAllPresence = (isPresent: boolean) => {
    const updated = roster.students.map(s => ({ ...s, isPresent }));
    onUpdateRoster({ ...roster, students: updated });
    soundManager.playClick();
  };

  // Add individual student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newStudentName.trim(),
      seatNumber: newStudentSeat || (roster.students.length + 1),
      gender: newStudentGender,
      isPresent: true,
      isPicked: false,
      pickedCount: 0,
    };

    onUpdateRoster({
      ...roster,
      students: [...roster.students, newStudent],
    });

    setNewStudentName('');
    setNewStudentSeat('');
    soundManager.playClick();
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = exportRosterToCsv(roster.students, roster.name);
    downloadCsvFile(csv, `${roster.name}_學生名單.csv`);
    soundManager.playClick();
  };

  // Filtered students for display
  const filteredStudents = roster.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.seatNumber !== undefined && String(s.seatNumber).includes(searchTerm))
  );

  const presentCount = roster.students.filter(s => s.isPresent).length;
  const pickedCount = roster.students.filter(s => s.isPicked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header card with class title and bulk actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            {isRenaming ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newRosterTitle}
                  onChange={(e) => setNewRosterTitle(e.target.value)}
                  className="text-xl font-bold text-slate-800 border-b-2 border-indigo-600 focus:outline-none px-1"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newRosterTitle.trim()) {
                      onRenameRoster(roster.id, newRosterTitle.trim());
                      setIsRenaming(false);
                      soundManager.playClick();
                    }
                  }}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{roster.name}</h2>
                <button
                  onClick={() => {
                    setNewRosterTitle(roster.name);
                    setIsRenaming(true);
                  }}
                  title="修改班級名稱"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span>總人數：<b className="text-slate-800 font-semibold">{roster.students.length}</b> 人</span>
            <span>•</span>
            <span>在席可參與：<b className="text-emerald-700 font-semibold">{presentCount}</b> 人</span>
            <span>•</span>
            <span>點名已抽中：<b className="text-indigo-700 font-semibold">{pickedCount}</b> 人</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出名單 CSV</span>
          </button>

          <button
            type="button"
            onClick={handleResetPicked}
            title="將所有學生的「已抽中」標記清除"
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置抽籤狀態</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(`確定要刪除「${roster.name}」班級嗎？此操作無法還原。`)) {
                onDeleteRoster(roster.id);
              }
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>刪除班級</span>
          </button>
        </div>
      </div>

      {/* Roster Input & Import Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                inputMode === 'paste'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>貼上名單 (文字 / Excel)</span>
            </button>

            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                inputMode === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上傳 CSV 檔案</span>
            </button>

            <button
              onClick={() => setInputMode('preset')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                inputMode === 'preset'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>載入範例名單</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>支援「座號 姓名 性別」或純姓名</span>
          </div>
        </div>

        {/* Input Mode 1: Paste */}
        {inputMode === 'paste' && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="請在此貼上學生名單，支援多種格式，例如：&#10;1. 王小明&#10;2. 李大華, 男&#10;03 陳美美, 女&#10;或是直接從 Excel 複製「座號、姓名、性別」欄位貼上！"
                className="w-full text-sm font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                貼上後點擊下方按鈕即可自動辨識座號、姓名與性別。
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={() => handleApplyPasted('append')}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                >
                  追加至現有名單
                </button>
                <button
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={() => handleApplyPasted('replace')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs"
                >
                  取代目前名單
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Mode 2: Upload CSV */}
        {inputMode === 'upload' && (
          <div className="space-y-4 py-2">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">點擊選取或拖曳 CSV 檔案至此</h4>
              <p className="text-xs text-slate-500 mt-1">支援 .csv, .txt 格式（編碼 UTF-8）</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>CSV 建議欄位順序：座號, 姓名, 性別（男/女）, 備註</span>
              <button
                type="button"
                onClick={() => {
                  const demoCsv = '座號,姓名,性別,備註\n1,王品涵,女,隊長\n2,林宇軒,男,\n3,張家銘,男,\n4,陳思妤,女,學藝';
                  downloadCsvFile(demoCsv, '示範學生名單格式.csv');
                }}
                className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                下載示範 CSV 格式
              </button>
            </div>
          </div>
        )}

        {/* Input Mode 3: Presets */}
        {inputMode === 'preset' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {SAMPLE_ROSTERS.map((preset, idx) => (
              <div
                key={preset.name}
                className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{preset.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">共 {preset.students.length} 位學生，包含座號與性別</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadPreset(idx)}
                  className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors shadow-2xs"
                >
                  載入此名單
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student List Table & Quick Add Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table top toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜尋學生姓名或座號..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>

            <div className="flex space-x-1 text-xs">
              <button
                type="button"
                onClick={() => handleSetAllPresence(true)}
                className="px-2.5 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md font-medium"
              >
                全班出席
              </button>
              <button
                type="button"
                onClick={() => handleSetAllPresence(false)}
                className="px-2.5 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md font-medium"
              >
                全部請假
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-500">
            顯示 {filteredStudents.length} / {roster.students.length} 位學生
          </span>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleAddStudent} className="p-3 bg-indigo-50/40 border-b border-indigo-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-indigo-900 ml-1">快速新增學生：</span>
          <input
            type="text"
            placeholder="座號 (選填)"
            value={newStudentSeat}
            onChange={(e) => setNewStudentSeat(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="學生姓名 (必填)"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="w-36 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newStudentGender}
            onChange={(e) => setNewStudentGender(e.target.value as 'M' | 'F' | 'Other')}
            className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
          >
            <option value="M">男同學</option>
            <option value="F">女同學</option>
            <option value="Other">其他 / 未標註</option>
          </select>
          <button
            type="submit"
            disabled={!newStudentName.trim()}
            className="inline-flex items-center space-x-1 px-3 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增</span>
          </button>
        </form>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 text-center w-20">狀態</th>
                <th scope="col" className="px-4 py-3 w-20">座號</th>
                <th scope="col" className="px-4 py-3">姓名</th>
                <th scope="col" className="px-4 py-3 w-24">性別</th>
                <th scope="col" className="px-4 py-3 w-28 text-center">點名抽中</th>
                <th scope="col" className="px-4 py-3 text-right w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    目前名單為空，請由上方貼上文字或匯入 CSV！
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !s.isPresent ? 'opacity-40 bg-slate-100/50' : ''
                    }`}
                  >
                    {/* Attendance Toggle */}
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePresent(s.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          s.isPresent
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {s.isPresent ? '出席' : '請假'}
                      </button>
                    </td>

                    {/* Seat number */}
                    <td className="px-4 py-2.5 font-mono text-slate-500">
                      #{s.seatNumber ?? '-'}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-2.5 font-bold text-slate-900 text-sm">
                      {s.name}
                      {s.note && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                          {s.note}
                        </span>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleGender(s.id)}
                        title="點擊切換性別"
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          s.gender === 'M'
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            : s.gender === 'F'
                            ? 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {s.gender === 'M' ? '男 👦' : s.gender === 'F' ? '女 👧' : '未註明'}
                      </button>
                    </td>

                    {/* Picked status */}
                    <td className="px-4 py-2.5 text-center">
                      {s.isPicked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                          已抽中 ({s.pickedCount || 1}次)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">未抽中</span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(s.id)}
                        title="刪除"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
