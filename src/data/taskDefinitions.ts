import { Child } from '../types';

export type TaskType =
  | 'name_response'
  | 'free_play'
  | 'face_interaction'
  | 'joint_attention';

export interface TaskDefinition {
  type:         TaskType;
  title:        string;
  subtitle:     string;
  duration:     number;   // seconds
  accentColor:  string;
  steps:        string[]; // parent instructions, numbered
  setupTip:     string;   // single setup reminder
  cueAt?:       number;   // seconds into recording when cue fires
  cueText?:     string;   // overlay text shown at cueAt
}

export const TASKS: TaskDefinition[] = [
  {
    type:        'name_response',
    title:       'Name Response',
    subtitle:    'Does your child turn when called?',
    duration:    60,
    accentColor: '#FFD23F',
    steps: [
      'Place the phone on a stable surface. Your child should be in full view.',
      'Let your child settle and focus on playing with a toy.',
      'Stand or sit behind or to the side — outside their natural line of sight.',
      'When the yellow flash appears on screen, say your child\'s name clearly, at normal volume. Not a shout.',
      'Wait 5 seconds. The prompt will flash again. Say the name a second time.',
      'One final prompt will appear for a third call. Do the same.',
    ],
    setupTip:  'Your child should not be looking at you when you start.',
    cueAt:     20,
    cueText:   'SAY NAME NOW',
  },
  {
    type:        'free_play',
    title:       'Free Play',
    subtitle:    'How does your child play on their own?',
    duration:    75,
    accentColor: '#2CB67D',
    steps: [
      'Place the phone where it can see your child clearly from the front.',
      'Give your child their favourite toy or a few objects.',
      'Walk to the side of the room or sit quietly nearby.',
      'Do not interact, talk, or get your child\'s attention.',
      'Just let them play naturally for the full duration.',
    ],
    setupTip:  'The more natural, the better. Pretend you\'re reading a book.',
  },
  {
    type:        'face_interaction',
    title:       'Face to Face',
    subtitle:    'Does your child respond to your face?',
    duration:    60,
    accentColor: '#A29BFE',
    steps: [
      'Sit or crouch directly in front of your child at their eye level.',
      'Stay about arm\'s length away. Put any toys out of reach.',
      'Look at your child and smile warmly.',
      'Make a gentle funny face, or play a short peekaboo.',
      'Try to catch your child\'s eye. Do not force it.',
      'Use only your face and voice — no toys, no phone, just you.',
    ],
    setupTip:  'Prop the phone behind you so it records your child facing you.',
  },
  {
    type:        'joint_attention',
    title:       'Joint Attention',
    subtitle:    'Does your child follow where you point?',
    duration:    60,
    accentColor: '#35D0BA',
    steps: [
      'Sit beside or slightly in front of your child.',
      'Get their attention with a gentle tap or their name.',
      'Point clearly at something in the room — a picture, a window, an object across the room.',
      'Say "Look!" or "What\'s that?" in a curious voice.',
      'See if your child looks at what you\'re pointing at.',
      'Try this 2 to 3 times pointing at different things.',
    ],
    setupTip:  'Make sure the phone can see your child\'s face, not just the back of their head.',
  },
];

// ─── Age helpers ─────────────────────────────────────────────────────────────

export function ageInMonths(child: Child): number {
  const dob  = new Date(child.date_of_birth);
  const now  = new Date();
  const diff = (now.getFullYear() - dob.getFullYear()) * 12
             + (now.getMonth()   - dob.getMonth());
  return Math.max(0, diff);
}

export function ageLabel(months: number): string {
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} years ${m} months` : `${y} years`;
}

// ─── Per-task Gemini prompt ───────────────────────────────────────────────────

function ageContext(months: number): string {
  if (months < 12)
    return 'At this age, social smiling should be established. Eye contact is present but inconsistent. Name response is emerging. Joint attention is very early.';
  if (months < 18)
    return 'Eye contact with caregivers is expected. Social smiling should be clear. Name response is usually reliable (turn within 1–2 s). Pointing comprehension is emerging.';
  if (months < 24)
    return 'Good eye contact with familiar people is expected. Social smiling is frequent. Consistent name response is expected. Joint attention through gaze and gesture should be present.';
  if (months < 36)
    return 'Frequent eye contact during interaction is expected. Social smiling is well-established. Immediate name response is expected. Clear joint attention including following a point and looking back to share interest.';
  if (months < 48)
    return 'Sustained eye contact in conversation is expected. Reciprocal smiling in context. Immediate name response. Rich shared attention including commenting and showing behaviours.';
  return 'Natural eye contact in social interaction, appropriate social smiling, immediate name response, and complex joint attention are all expected.';
}

function taskContext(task: TaskDefinition): string {
  switch (task.type) {
    case 'name_response':
      return 'The parent called the child\'s name 3 times during the recording. A visual cue on the phone indicated each call moment. Listen for or observe orientation toward the parent\'s voice at each call.';
    case 'free_play':
      return 'The child played alone with toys. The parent was present but not interacting. Look for spontaneous eye contact toward the parent, spontaneous smiling, and any repetitive or unusual movements.';
    case 'face_interaction':
      return 'The parent sat face-to-face with the child at eye level, making eye contact and expressions (smiling, peekaboo). No toys. Observe whether the child looks at the parent\'s face, smiles in response, or engages.';
    case 'joint_attention':
      return 'The parent pointed at objects in the room 2–3 times and said "Look!" Observe whether the child follows the pointing gesture, shifts gaze toward the indicated object, and looks back at the parent to share the moment.';
  }
}

export function buildGeminiPrompt(task: TaskDefinition, child: Child): string {
  const months = ageInMonths(child);
  return `You are a behavioural observation specialist reviewing a home screening video.

Child: ${child.first_name}, aged ${months} months (${ageLabel(months)}).
Task: ${task.title}
Context: ${taskContext(task)}

Analyse ONLY what is visually or audibly observable in the video. Do not make diagnostic inferences or mention any condition by name.

Return ONLY a valid JSON object — no markdown, no explanation, nothing outside the JSON:

{
  "eye_contact": {
    "frequency": "<one of: none | rare | occasional | frequent | consistent>",
    "quality": "<one of: fleeting | brief | sustained | not_observed>",
    "count_estimate": <integer 0–20, best estimate of distinct eye contact moments>,
    "observation": "<one neutral sentence describing exactly what was seen>"
  },
  "social_smiling": {
    "observed": <true | false>,
    "type": "<one of: responsive | spontaneous | both | none>",
    "count_estimate": <integer 0–10>,
    "observation": "<one neutral sentence>"
  },
  "name_response": {
    "applicable": <true only for name_response task, otherwise false>,
    "responded": "<one of: yes | partial | no | not_applicable>",
    "latency": "<one of: immediate | delayed | none | not_applicable>",
    "observation": "<one neutral sentence describing the specific moment(s)>"
  },
  "shared_attention": {
    "quality": "<one of: none | minimal | emerging | clear>",
    "gaze_shifts_to_person": <true | false>,
    "follows_referential_cues": <true | false | null>,
    "observation": "<one neutral sentence>"
  },
  "notable_behaviors": "<any repetitive movements, unusual postures, or other notable observations — write none if nothing notable>",
  "video_quality": "<one of: good | partial | poor>",
  "confidence": "<one of: high | medium | low>"
}

Age context for ${months} months: ${ageContext(months)}`;
}
