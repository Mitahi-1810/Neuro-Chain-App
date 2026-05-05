import { BACKEND_URL } from '../config/api';
import { TaskDefinition, buildGeminiPrompt } from '../data/taskDefinitions';
import { Child } from '../types';
import { TaskAnalysisResult } from './geminiVideoAnalysis';

export async function processTaskVideoViaBackend(
  videoUri: string,
  task: TaskDefinition,
  child: Child,
): Promise<TaskAnalysisResult> {
  const prompt = buildGeminiPrompt(task, child);

  const body = new FormData();
  body.append('video', {
    uri:  videoUri,
    name: 'screening.mp4',
    type: 'video/mp4',
  } as any);
  body.append('prompt', prompt);

  const res = await fetch(`${BACKEND_URL}/api/analyze-task`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    let message = `Server error (${res.status})`;
    try {
      const data = await res.json() as { error?: string };
      if (data.error) message = data.error;
    } catch { /* ignore parse failure */ }
    throw new Error(message);
  }

  return res.json() as Promise<TaskAnalysisResult>;
}
