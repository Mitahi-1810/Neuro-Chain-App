import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScreenerDraft {
  answers: any[];
  questionIndex: number;
  savedAt: string;
}

const makeKey = (childId: string, testType: string) =>
  `screener_draft_v1_${childId}_${testType}`;

export async function saveScreenerDraft(
  childId: string,
  testType: string,
  answers: any[],
  questionIndex: number,
): Promise<void> {
  const draft: ScreenerDraft = { answers, questionIndex, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(makeKey(childId, testType), JSON.stringify(draft));
}

export async function loadScreenerDraft(
  childId: string,
  testType: string,
): Promise<ScreenerDraft | null> {
  const raw = await AsyncStorage.getItem(makeKey(childId, testType));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScreenerDraft;
  } catch {
    return null;
  }
}

export async function clearScreenerDraft(childId: string, testType: string): Promise<void> {
  await AsyncStorage.removeItem(makeKey(childId, testType));
}

export function formatDraftDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
