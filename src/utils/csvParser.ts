import { Student } from '../types/student';

/**
 * Parses raw text or CSV content into structured Student objects.
 * Supports comma, tab, semicolon, and simple newline formats.
 */
export function parseStudentText(rawText: string): Student[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const students: Student[] = [];

  // Check if first row is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = 
    firstLine.includes('姓名') || 
    firstLine.includes('name') || 
    firstLine.includes('座號') || 
    firstLine.includes('號碼') ||
    firstLine.includes('student');

  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma, tab, or semicolon
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      // Split by comma respecting quotes
      parts = splitCsvLine(line);
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else {
      // Single token or space-separated
      parts = [line];
    }

    parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

    if (parts.length === 0 || !parts[0]) continue;

    let seatNumber: string | number | undefined = undefined;
    let name: string = '';
    let gender: 'M' | 'F' | 'Other' | undefined = undefined;
    let note: string | undefined = undefined;

    if (parts.length === 1) {
      // Could be "1. 王小明" or "01 王小明" or simply "王小明"
      const single = parts[0];
      const match = single.match(/^(\d+)[\.\s、,-]+(.+)$/);
      if (match) {
        seatNumber = match[1];
        name = match[2].trim();
      } else {
        seatNumber = i - startIndex + 1;
        name = single.trim();
      }
    } else if (parts.length >= 2) {
      // Could be [座號, 姓名] or [姓名, 座號] or [座號, 姓名, 性別, 備註]
      const isFirstNum = /^\d+$/.test(parts[0]);
      if (isFirstNum) {
        seatNumber = parts[0];
        name = parts[1];
        if (parts[2]) {
          gender = detectGender(parts[2]);
        }
        if (parts[3]) {
          note = parts[3];
        }
      } else {
        name = parts[0];
        if (/^\d+$/.test(parts[1])) {
          seatNumber = parts[1];
        } else {
          seatNumber = i - startIndex + 1;
          gender = detectGender(parts[1]);
        }
        if (parts[2]) {
          if (!gender) gender = detectGender(parts[2]);
          else note = parts[2];
        }
        if (parts[3]) {
          note = parts[3];
        }
      }
    }

    if (name) {
      students.push({
        id: `std_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        seatNumber: seatNumber || (students.length + 1),
        gender,
        note,
        isPresent: true,
        isPicked: false,
        pickedCount: 0,
      });
    }
  }

  return students;
}

function detectGender(str: string): 'M' | 'F' | 'Other' | undefined {
  const s = str.trim().toLowerCase();
  if (s === '男' || s === 'm' || s === 'male' || s === 'boy') return 'M';
  if (s === '女' || s === 'f' || s === 'female' || s === 'girl') return 'F';
  return undefined;
}

function splitCsvLine(text: string): string[] {
  const result: string[] = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(curr.trim());
      curr = '';
    } else {
      curr += char;
    }
  }
  result.push(curr.trim());
  return result;
}

export function exportRosterToCsv(students: Student[], className: string): string {
  const header = ['座號', '姓名', '性別', '備註', '出缺席狀態'];
  const rows = students.map(s => [
    s.seatNumber ?? '',
    `"${s.name.replace(/"/g, '""')}"`,
    s.gender === 'M' ? '男' : s.gender === 'F' ? '女' : '',
    `"${(s.note || '').replace(/"/g, '""')}"`,
    s.isPresent ? '出席' : '請假',
  ]);

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadCsvFile(content: string, filename: string) {
  // Add UTF-8 BOM so Excel opens traditional Chinese correctly
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Preset sample rosters ready to use immediately
 */
export const SAMPLE_ROSTERS = [
  {
    name: '國中示範班級（28人）',
    students: [
      { seatNumber: 1, name: '王品涵', gender: 'F' },
      { seatNumber: 2, name: '林宇軒', gender: 'M' },
      { seatNumber: 3, name: '張家銘', gender: 'M' },
      { seatNumber: 4, name: '陳思妤', gender: 'F' },
      { seatNumber: 5, name: '黃冠宇', gender: 'M' },
      { seatNumber: 6, name: '李佳蓉', gender: 'F' },
      { seatNumber: 7, name: '吳伯翰', gender: 'M' },
      { seatNumber: 8, name: '蔡欣潔', gender: 'F' },
      { seatNumber: 9, name: '楊承恩', gender: 'M' },
      { seatNumber: 10, name: '許庭瑋', gender: 'F' },
      { seatNumber: 11, name: '鄭宥廷', gender: 'M' },
      { seatNumber: 12, name: '謝沛珊', gender: 'F' },
      { seatNumber: 13, name: '劉子傑', gender: 'M' },
      { seatNumber: 14, name: '洪婉婷', gender: 'F' },
      { seatNumber: 15, name: '邱建良', gender: 'M' },
      { seatNumber: 16, name: '曾雅婷', gender: 'F' },
      { seatNumber: 17, name: '廖柏睿', gender: 'M' },
      { seatNumber: 18, name: '賴羽晨', gender: 'F' },
      { seatNumber: 19, name: '徐博翔', gender: 'M' },
      { seatNumber: 20, name: '周宜萱', gender: 'F' },
      { seatNumber: 21, name: '葉俊廷', gender: 'M' },
      { seatNumber: 22, name: '蘇若晴', gender: 'F' },
      { seatNumber: 23, name: '莊凱元', gender: 'M' },
      { seatNumber: 24, name: '江芷晴', gender: 'F' },
      { seatNumber: 25, name: '何彥勳', gender: 'M' },
      { seatNumber: 26, name: '潘宥希', gender: 'F' },
      { seatNumber: 27, name: '施柏安', gender: 'M' },
      { seatNumber: 28, name: '鐘曼晴', gender: 'F' },
    ] as Array<{ seatNumber: number; name: string; gender: 'M' | 'F' }>,
  },
  {
    name: '自然科學探究小組（18人）',
    students: [
      { seatNumber: 1, name: '陳均佑', gender: 'M' },
      { seatNumber: 2, name: '林若嵐', gender: 'F' },
      { seatNumber: 3, name: '黃俊傑', gender: 'M' },
      { seatNumber: 4, name: '張語涵', gender: 'F' },
      { seatNumber: 5, name: '李承翰', gender: 'M' },
      { seatNumber: 6, name: '王敏萱', gender: 'F' },
      { seatNumber: 7, name: '吳睿恩', gender: 'M' },
      { seatNumber: 8, name: '蔡依珊', gender: 'F' },
      { seatNumber: 9, name: '鄭宇晨', gender: 'M' },
      { seatNumber: 10, name: '許羽晴', gender: 'F' },
      { seatNumber: 11, name: '楊士勳', gender: 'M' },
      { seatNumber: 12, name: '謝以柔', gender: 'F' },
      { seatNumber: 13, name: '劉恩齊', gender: 'M' },
      { seatNumber: 14, name: '周子筠', gender: 'F' },
      { seatNumber: 15, name: '賴冠名', gender: 'M' },
      { seatNumber: 16, name: '曾郁心', gender: 'F' },
      { seatNumber: 17, name: '邱振哲', gender: 'M' },
      { seatNumber: 18, name: '洪靜芳', gender: 'F' },
    ] as Array<{ seatNumber: number; name: string; gender: 'M' | 'F' }>,
  },
];
