export interface Student {
  id: string;
  name: string;
  seatNumber?: string | number;
  gender?: 'M' | 'F' | 'Other';
  note?: string;
  isPresent: boolean; // 是否出席/參與
  isPicked?: boolean;  // 隨機抽籤中是否已被抽中
  pickedCount?: number;
}

export interface ClassRoster {
  id: string;
  name: string;
  students: Student[];
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  members: Student[];
  leaderId?: string;
}

export type GroupMode = 'byMemberCount' | 'byGroupCount';
export type RemainderStrategy = 'distribute' | 'createExtra';

export interface GroupConfig {
  mode: GroupMode;
  targetCount: number; // 每組人數 或 總組數
  remainderStrategy: RemainderStrategy;
  balanceGender: boolean;
  autoAssignLeader: boolean;
}

export interface DrawRecord {
  id: string;
  timestamp: number;
  students: Student[];
  mode: 'single' | 'multiple';
}
