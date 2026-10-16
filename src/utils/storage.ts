import { ClassRoster, DrawRecord, Student } from '../types/student';
import { SAMPLE_ROSTERS } from './csvParser';

const STORAGE_KEY_CLASSES = 'classroom_tool_classes';
const STORAGE_KEY_ACTIVE_CLASS = 'classroom_tool_active_class_id';
const STORAGE_KEY_DRAW_HISTORY = 'classroom_tool_draw_history';

/**
 * Initializes default classes if localStorage is empty
 */
export function getSavedClasses(): ClassRoster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read classes from localStorage:', err);
  }

  // Populate initial sample classes
  const initialClasses: ClassRoster[] = SAMPLE_ROSTERS.map((s, idx) => ({
    id: `class_preset_${idx + 1}`,
    name: s.name,
    createdAt: Date.now() - idx * 10000,
    students: s.students.map((std, sIdx) => ({
      id: `std_p_${idx}_${sIdx}`,
      name: std.name,
      seatNumber: std.seatNumber,
      gender: std.gender,
      isPresent: true,
      isPicked: false,
      pickedCount: 0,
    })),
  }));

  saveClasses(initialClasses);
  return initialClasses;
}

export function saveClasses(classes: ClassRoster[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  } catch (err) {
    console.error('Failed to save classes to localStorage:', err);
  }
}

export function getActiveRosterId(): string {
  const classes = getSavedClasses();
  const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_CLASS);
  if (savedId && classes.some(c => c.id === savedId)) {
    return savedId;
  }
  return classes[0]?.id || '';
}

export function setActiveRosterId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_CLASS, id);
}

export function getDrawHistory(classId: string): DrawRecord[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_DRAW_HISTORY}_${classId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Return empty array
  }
  return [];
}

export function saveDrawHistory(classId: string, history: DrawRecord[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_DRAW_HISTORY}_${classId}`, JSON.stringify(history));
  } catch {
    // Safeguard
  }
}
