import { Group, GroupConfig, Student } from '../types/student';

export const GROUP_THEME_COLORS = [
  { bg: 'bg-indigo-50 border-indigo-200 text-indigo-900', badge: 'bg-indigo-600 text-white', ring: 'ring-indigo-400', accent: 'indigo' },
  { bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', badge: 'bg-emerald-600 text-white', ring: 'ring-emerald-400', accent: 'emerald' },
  { bg: 'bg-amber-50 border-amber-200 text-amber-900', badge: 'bg-amber-600 text-white', ring: 'ring-amber-400', accent: 'amber' },
  { bg: 'bg-rose-50 border-rose-200 text-rose-900', badge: 'bg-rose-600 text-white', ring: 'ring-rose-400', accent: 'rose' },
  { bg: 'bg-cyan-50 border-cyan-200 text-cyan-900', badge: 'bg-cyan-600 text-white', ring: 'ring-cyan-400', accent: 'cyan' },
  { bg: 'bg-violet-50 border-violet-200 text-violet-900', badge: 'bg-violet-600 text-white', ring: 'ring-violet-400', accent: 'violet' },
  { bg: 'bg-orange-50 border-orange-200 text-orange-900', badge: 'bg-orange-600 text-white', ring: 'ring-orange-400', accent: 'orange' },
  { bg: 'bg-teal-50 border-teal-200 text-teal-900', badge: 'bg-teal-600 text-white', ring: 'ring-teal-400', accent: 'teal' },
  { bg: 'bg-pink-50 border-pink-200 text-pink-900', badge: 'bg-pink-600 text-white', ring: 'ring-pink-400', accent: 'pink' },
  { bg: 'bg-sky-50 border-sky-200 text-sky-900', badge: 'bg-sky-600 text-white', ring: 'ring-sky-400', accent: 'sky' },
  { bg: 'bg-lime-50 border-lime-200 text-lime-900', badge: 'bg-lime-600 text-white', ring: 'ring-lime-400', accent: 'lime' },
  { bg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900', badge: 'bg-fuchsia-600 text-white', ring: 'ring-fuchsia-400', accent: 'fuchsia' },
];

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate smart groups based on config
 */
export function autoGroupStudents(
  allStudents: Student[],
  config: GroupConfig
): Group[] {
  // Only active & present students participate
  const pool = allStudents.filter(s => s.isPresent);
  const totalCount = pool.length;

  if (totalCount === 0) return [];

  let numGroups = 1;

  if (config.mode === 'byMemberCount') {
    const memberTarget = Math.max(1, config.targetCount);
    if (config.remainderStrategy === 'createExtra') {
      numGroups = Math.ceil(totalCount / memberTarget);
    } else {
      // Distribute remainder into existing groups
      numGroups = Math.max(1, Math.floor(totalCount / memberTarget));
    }
  } else {
    // Mode is byGroupCount
    numGroups = Math.min(totalCount, Math.max(1, config.targetCount));
  }

  // Initialize groups
  const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
    id: `grp_${i + 1}`,
    name: `第 ${i + 1} 組`,
    color: GROUP_THEME_COLORS[i % GROUP_THEME_COLORS.length].accent,
    members: [],
  }));

  if (config.balanceGender) {
    // Split into M, F, and Others
    const males = shuffleArray(pool.filter(s => s.gender === 'M'));
    const females = shuffleArray(pool.filter(s => s.gender === 'F'));
    const others = shuffleArray(pool.filter(s => s.gender !== 'M' && s.gender !== 'F'));

    // Distribute males across groups round-robin
    let gIdx = 0;
    for (const m of males) {
      groups[gIdx].members.push(m);
      gIdx = (gIdx + 1) % numGroups;
    }

    // Distribute females in reverse round-robin or continuing round-robin to balance
    for (const f of females) {
      groups[gIdx].members.push(f);
      gIdx = (gIdx + 1) % numGroups;
    }

    // Distribute others
    for (const o of others) {
      groups[gIdx].members.push(o);
      gIdx = (gIdx + 1) % numGroups;
    }
  } else {
    // Standard random shuffle
    const shuffled = shuffleArray(pool);
    let gIdx = 0;
    for (const student of shuffled) {
      groups[gIdx].members.push(student);
      gIdx = (gIdx + 1) % numGroups;
    }
  }

  // Optionally auto-assign a leader to each group
  if (config.autoAssignLeader) {
    groups.forEach(g => {
      if (g.members.length > 0) {
        const leaderIndex = Math.floor(Math.random() * g.members.length);
        g.leaderId = g.members[leaderIndex].id;
      }
    });
  }

  return groups;
}

/**
 * Format group results into copyable text
 */
export function formatGroupsAsText(groups: Group[], title: string = '分組結果'): string {
  const lines: string[] = [`【${title}】 共 ${groups.length} 組`];
  lines.push('─'.repeat(24));

  groups.forEach((g) => {
    const leader = g.members.find(m => m.id === g.leaderId);
    const memberNames = g.members.map(m => {
      const isLeader = m.id === g.leaderId;
      const num = m.seatNumber ? `(${m.seatNumber}號)` : '';
      return `${m.name}${num}${isLeader ? ' ★組長' : ''}`;
    }).join('、 ');

    lines.push(`▶ ${g.name} (${g.members.length}人)：`);
    lines.push(`   成員：${memberNames || '無成員'}`);
    if (leader) {
      lines.push(`   組長：${leader.name}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format group results into CSV
 */
export function exportGroupsToCsv(groups: Group[]): string {
  const rows: string[] = ['組別,座號,姓名,性別,角色'];
  groups.forEach(g => {
    g.members.forEach(m => {
      const isLeader = m.id === g.leaderId ? '組長' : '組員';
      const gender = m.gender === 'M' ? '男' : m.gender === 'F' ? '女' : '';
      rows.push(`"${g.name}",${m.seatNumber ?? ''},"${m.name.replace(/"/g, '""')}",${gender},${isLeader}`);
    });
  });
  return rows.join('\n');
}
