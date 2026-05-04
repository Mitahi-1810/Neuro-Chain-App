/**
 * Module-level session store for the 4-task video screening.
 * Reset at the start of each new screening. Accumulates results
 * as the parent completes tasks so BehavioralReportScreen can
 * read all 4 without large navigation params.
 */

import { TaskType } from '../data/taskDefinitions';
import { TaskAnalysisResult } from '../services/geminiVideoAnalysis';

export interface CompletedTask {
  taskType:    TaskType;
  videoUri:    string;   // local file:// — deleted by caller after confirmation
  result:      TaskAnalysisResult | null;
  retakeCount: number;
  completedAt: string;
}

let _results: CompletedTask[] = [];
let _originalRisk: string     = 'MODERATE';
let _originalScore: number    = 0;

export const screeningSession = {
  start(originalRisk: string, originalScore: number) {
    _results       = [];
    _originalRisk  = originalRisk;
    _originalScore = originalScore;
  },

  push(task: CompletedTask) {
    // Replace if retaken
    const idx = _results.findIndex(r => r.taskType === task.taskType);
    if (idx >= 0) _results[idx] = task;
    else          _results.push(task);
  },

  getResults():       CompletedTask[] { return [..._results]; },
  getOriginalRisk():  string          { return _originalRisk; },
  getOriginalScore(): number          { return _originalScore; },
  completedCount():   number          { return _results.length; },
};
