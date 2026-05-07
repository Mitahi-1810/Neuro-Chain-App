export interface ScreenerSection {
  title: string;
  count: number;
}

export const SCREENER_SECTIONS: Record<string, ScreenerSection[]> = {
  MCHAT: [
    { title: 'Attention & Pointing', count: 5 },
    { title: 'Communication & Play', count: 5 },
    { title: 'Expression & Response', count: 5 },
    { title: 'Social Awareness', count: 5 },
  ],
  CSBS_ITC: [
    { title: 'Social & Emotional', count: 7 },
    { title: 'Speech & Language', count: 8 },
    { title: 'Symbolic Behaviors', count: 9 },
  ],
  QCHAT10: [
    { title: 'Part 1', count: 5 },
    { title: 'Part 2', count: 5 },
  ],
  CAST: [
    { title: 'Social Interaction', count: 8 },
    { title: 'Communication', count: 8 },
    { title: 'Behaviors & Interests', count: 8 },
    { title: 'Flexibility & Awareness', count: 7 },
    { title: 'Final Questions', count: 6 },
  ],
};

export interface SectionInfo {
  sectionIndex: number;
  totalSections: number;
  sectionTitle: string;
  sectionStart: number;
  sectionEnd: number;
  indexInSection: number;
  countInSection: number;
  isLastInSection: boolean;
  isLastSection: boolean;
}

export function getSectionInfo(sections: ScreenerSection[], questionIndex: number): SectionInfo {
  let cumulative = 0;
  for (let i = 0; i < sections.length; i++) {
    const end = cumulative + sections[i].count;
    if (questionIndex < end) {
      return {
        sectionIndex: i,
        totalSections: sections.length,
        sectionTitle: sections[i].title,
        sectionStart: cumulative,
        sectionEnd: end,
        indexInSection: questionIndex - cumulative,
        countInSection: sections[i].count,
        isLastInSection: questionIndex === end - 1,
        isLastSection: i === sections.length - 1,
      };
    }
    cumulative = end;
  }
  const lastIdx = sections.length - 1;
  const lastStart = cumulative - sections[lastIdx].count;
  return {
    sectionIndex: lastIdx,
    totalSections: sections.length,
    sectionTitle: sections[lastIdx].title,
    sectionStart: lastStart,
    sectionEnd: cumulative,
    indexInSection: sections[lastIdx].count - 1,
    countInSection: sections[lastIdx].count,
    isLastInSection: true,
    isLastSection: true,
  };
}
