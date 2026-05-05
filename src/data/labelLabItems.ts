/**
 * Label Lab — Clinical Item Library
 * 60 items across 6 ABLLS-R categories.
 * Each item tagged with feature, function, class for FFC trials.
 */

export interface LabItem {
  id: string;
  en: string;
  bn: string;
  category: ItemCategory;
  feature: string;   // color/size/shape descriptor
  fnc: string;       // function — what you do with it
  cls: string;       // class — category it belongs to
}

export type ItemCategory =
  | 'Household'
  | 'Food'
  | 'Body'
  | 'Clothing'
  | 'Actions'
  | 'Animals';

export type ItemStatus = 'new' | 'learning' | 'mastered';

export interface ItemMastery {
  itemId: string;
  status: ItemStatus;
  consecutiveCorrect: number;  // resets on error
  totalAttempts: number;
  totalCorrect: number;
  lastSeen: string;
}

export const LAB_ITEMS: LabItem[] = [
  // ── Household (15) ──
  { id: 'cup',     en: 'Cup',     bn: 'কাপ',     category: 'Household', feature: 'round',  fnc: 'drink from', cls: 'kitchen' },
  { id: 'spoon',   en: 'Spoon',   bn: 'চামচ',    category: 'Household', feature: 'small',  fnc: 'eat with',   cls: 'kitchen' },
  { id: 'book',    en: 'Book',    bn: 'বই',      category: 'Household', feature: 'flat',   fnc: 'read',       cls: 'school' },
  { id: 'pencil',  en: 'Pencil',  bn: 'পেন্সিল', category: 'Household', feature: 'long',   fnc: 'write with', cls: 'school' },
  { id: 'chair',   en: 'Chair',   bn: 'চেয়ার',   category: 'Household', feature: 'big',    fnc: 'sit on',     cls: 'furniture' },
  { id: 'key',     en: 'Key',     bn: 'চাবি',    category: 'Household', feature: 'small',  fnc: 'open door',  cls: 'tools' },
  { id: 'phone',   en: 'Phone',   bn: 'ফোন',     category: 'Household', feature: 'flat',   fnc: 'call with',  cls: 'electronics' },
  { id: 'clock',   en: 'Clock',   bn: 'ঘড়ি',     category: 'Household', feature: 'round',  fnc: 'tell time',  cls: 'tools' },
  { id: 'lamp',    en: 'Lamp',    bn: 'বাতি',    category: 'Household', feature: 'bright', fnc: 'give light', cls: 'electronics' },
  { id: 'bag',     en: 'Bag',     bn: 'ব্যাগ',    category: 'Household', feature: 'big',    fnc: 'carry things', cls: 'school' },
  // ── Food (12) ──
  { id: 'banana',  en: 'Banana',  bn: 'কলা',     category: 'Food', feature: 'yellow', fnc: 'eat',     cls: 'fruit' },
  { id: 'apple',   en: 'Apple',   bn: 'আপেল',    category: 'Food', feature: 'red',    fnc: 'eat',     cls: 'fruit' },
  { id: 'rice',    en: 'Rice',    bn: 'ভাত',     category: 'Food', feature: 'white',  fnc: 'eat',     cls: 'meal' },
  { id: 'water',   en: 'Water',   bn: 'পানি',    category: 'Food', feature: 'clear',  fnc: 'drink',   cls: 'drink' },
  { id: 'milk',    en: 'Milk',    bn: 'দুধ',     category: 'Food', feature: 'white',  fnc: 'drink',   cls: 'drink' },
  { id: 'egg',     en: 'Egg',     bn: 'ডিম',     category: 'Food', feature: 'oval',   fnc: 'eat',     cls: 'protein' },
  { id: 'bread',   en: 'Bread',   bn: 'রুটি',    category: 'Food', feature: 'brown',  fnc: 'eat',     cls: 'meal' },
  { id: 'mango',   en: 'Mango',   bn: 'আম',      category: 'Food', feature: 'yellow', fnc: 'eat',     cls: 'fruit' },
  { id: 'fish',    en: 'Fish',    bn: 'মাছ',     category: 'Food', feature: 'silver', fnc: 'eat',     cls: 'protein' },
  { id: 'cake',    en: 'Cake',    bn: 'কেক',     category: 'Food', feature: 'sweet',  fnc: 'eat',     cls: 'dessert' },
  // ── Body Parts (10) ──
  { id: 'hand',    en: 'Hand',    bn: 'হাত',     category: 'Body', feature: 'flat',   fnc: 'hold things',  cls: 'body' },
  { id: 'eye',     en: 'Eye',     bn: 'চোখ',     category: 'Body', feature: 'round',  fnc: 'see with',     cls: 'face' },
  { id: 'nose',    en: 'Nose',    bn: 'নাক',     category: 'Body', feature: 'small',  fnc: 'smell with',   cls: 'face' },
  { id: 'ear',     en: 'Ear',     bn: 'কান',     category: 'Body', feature: 'curved', fnc: 'hear with',    cls: 'face' },
  { id: 'mouth',   en: 'Mouth',   bn: 'মুখ',     category: 'Body', feature: 'red',    fnc: 'talk with',    cls: 'face' },
  { id: 'foot',    en: 'Foot',    bn: 'পা',      category: 'Body', feature: 'flat',   fnc: 'walk with',    cls: 'body' },
  { id: 'teeth',   en: 'Teeth',   bn: 'দাঁত',    category: 'Body', feature: 'white',  fnc: 'chew with',    cls: 'face' },
  { id: 'hair',    en: 'Hair',    bn: 'চুল',     category: 'Body', feature: 'long',   fnc: 'comb',         cls: 'body' },
  // ── Clothing (8) ──
  { id: 'shirt',   en: 'Shirt',   bn: 'জামা',    category: 'Clothing', feature: 'soft',  fnc: 'wear on body', cls: 'clothes' },
  { id: 'shoes',   en: 'Shoes',   bn: 'জুতা',    category: 'Clothing', feature: 'hard',  fnc: 'wear on feet', cls: 'clothes' },
  { id: 'hat',     en: 'Hat',     bn: 'টুপি',    category: 'Clothing', feature: 'round', fnc: 'wear on head', cls: 'clothes' },
  { id: 'socks',   en: 'Socks',   bn: 'মোজা',    category: 'Clothing', feature: 'soft',  fnc: 'wear on feet', cls: 'clothes' },
  { id: 'pants',   en: 'Pants',   bn: 'প্যান্ট',  category: 'Clothing', feature: 'long',  fnc: 'wear on legs', cls: 'clothes' },
  // ── Animals (8) ──
  { id: 'cat',     en: 'Cat',     bn: 'বিড়াল',   category: 'Animals', feature: 'soft',  fnc: 'pet',       cls: 'pet' },
  { id: 'dog',     en: 'Dog',     bn: 'কুকুর',   category: 'Animals', feature: 'furry', fnc: 'pet',       cls: 'pet' },
  { id: 'bird',    en: 'Bird',    bn: 'পাখি',    category: 'Animals', feature: 'small', fnc: 'fly',       cls: 'wild' },
  { id: 'cow',     en: 'Cow',     bn: 'গরু',     category: 'Animals', feature: 'big',   fnc: 'give milk', cls: 'farm' },
  { id: 'chicken', en: 'Chicken', bn: 'মুরগি',   category: 'Animals', feature: 'small', fnc: 'lay eggs',  cls: 'farm' },
  { id: 'goat',    en: 'Goat',    bn: 'ছাগল',    category: 'Animals', feature: 'medium',fnc: 'give milk', cls: 'farm' },
  // ── Actions (7) ──
  { id: 'running', en: 'Running', bn: 'দৌড়ানো',  category: 'Actions', feature: 'fast',  fnc: 'move fast',  cls: 'movement' },
  { id: 'eating',  en: 'Eating',  bn: 'খাওয়া',   category: 'Actions', feature: 'slow',  fnc: 'get food',   cls: 'daily' },
  { id: 'sleeping',en: 'Sleeping',bn: 'ঘুমানো',  category: 'Actions', feature: 'quiet', fnc: 'rest',       cls: 'daily' },
  { id: 'crying',  en: 'Crying',  bn: 'কান্না',   category: 'Actions', feature: 'sad',   fnc: 'feel sad',   cls: 'emotion' },
  { id: 'laughing',en: 'Laughing',bn: 'হাসা',    category: 'Actions', feature: 'happy', fnc: 'feel happy', cls: 'emotion' },
  { id: 'washing', en: 'Washing', bn: 'ধোয়া',    category: 'Actions', feature: 'wet',   fnc: 'get clean',  cls: 'daily' },
  { id: 'clapping',en: 'Clapping',bn: 'তালি দেওয়া', category: 'Actions', feature: 'loud', fnc: 'make sound', cls: 'movement' },
];

/** Intraverbal prompts for Stage 4 */
export const INTRAVERBAL_PROMPTS: { prompt_en: string; prompt_bn: string; answer: string }[] = [
  { prompt_en: 'You eat with a...',       prompt_bn: 'তুমি খাও... দিয়ে',      answer: 'spoon' },
  { prompt_en: 'You drink from a...',     prompt_bn: 'তুমি পান করো... থেকে',   answer: 'cup' },
  { prompt_en: 'You write with a...',     prompt_bn: 'তুমি লেখো... দিয়ে',     answer: 'pencil' },
  { prompt_en: 'You read a...',           prompt_bn: 'তুমি পড়ো একটি...',      answer: 'book' },
  { prompt_en: 'You wear shoes on your...', prompt_bn: 'তুমি জুতা পরো... -এ', answer: 'foot' },
  { prompt_en: 'You see with your...',    prompt_bn: 'তুমি দেখো তোমার... দিয়ে', answer: 'eye' },
  { prompt_en: 'You hear with your...',   prompt_bn: 'তুমি শোনো তোমার... দিয়ে', answer: 'ear' },
  { prompt_en: 'You sit on a...',         prompt_bn: 'তুমি বসো একটি... -এ',    answer: 'chair' },
  { prompt_en: 'A cat says...',           prompt_bn: 'একটি বিড়াল বলে...',      answer: 'meow' },
  { prompt_en: 'You brush your...',       prompt_bn: 'তুমি ব্রাশ করো তোমার...', answer: 'teeth' },
];
