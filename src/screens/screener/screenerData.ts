import { ScreenerQuestion } from '../../types';

export const MCHAT_QUESTIONS: ScreenerQuestion[] = [
  {
    id: 1,
    question: 'If you point at something across the room, does your child look at it?',
    is_reversed: false,
  },
  {
    id: 2,
    question: 'Have you ever wondered if your child might be deaf?',
    is_reversed: true,
  },
  {
    id: 3,
    question: 'Does your child play pretend or make-believe?',
    is_reversed: false,
  },
  {
    id: 4,
    question: 'Does your child like climbing on things?',
    is_reversed: false,
  },
  {
    id: 5,
    question: 'Does your child make unusual finger movements near his or her eyes?',
    is_reversed: true,
  },
  {
    id: 6,
    question: 'Does your child point with one finger to ask for something or to get help?',
    is_reversed: false,
  },
  {
    id: 7,
    question: 'Does your child point with one finger to show you something interesting?',
    is_reversed: false,
  },
  {
    id: 8,
    question: 'Is your child interested in other children?',
    is_reversed: false,
  },
  {
    id: 9,
    question: 'Does your child show you things by bringing them to you or holding them up for you to see?',
    is_reversed: false,
  },
  {
    id: 10,
    question: 'Does your child respond when you call his or her name?',
    is_reversed: false,
  },
  {
    id: 11,
    question: 'When you smile at your child, does he or she smile back at you?',
    is_reversed: false,
  },
  {
    id: 12,
    question: 'Does your child get upset by everyday noises?',
    is_reversed: true,
  },
  {
    id: 13,
    question: 'Does your child walk?',
    is_reversed: false,
  },
  {
    id: 14,
    question: 'Does your child look you in the eye when you are talking, playing, or dressing him or her?',
    is_reversed: false,
  },
  {
    id: 15,
    question: 'Does your child try to copy what you do?',
    is_reversed: false,
  },
  {
    id: 16,
    question: 'If you turn your head to look at something, does your child look around to see what you are looking at?',
    is_reversed: false,
  },
  {
    id: 17,
    question: 'Does your child try to get you to watch him or her?',
    is_reversed: false,
  },
  {
    id: 18,
    question: 'Does your child understand when you tell him or her to do something?',
    is_reversed: false,
  },
  {
    id: 19,
    question: 'If something new happens, does your child look at your face to see how you feel about it?',
    is_reversed: false,
  },
  {
    id: 20,
    question: 'Does your child like movement activities?',
    is_reversed: false,
  },
];

export const CSBS_QUESTIONS = [
  { id: 1, question: 'When your child plays with toys, does he/she look at you to see if you are watching?' },
  { id: 2, question: 'Does your child smile or laugh while looking at you?' },
  { id: 3, question: 'When you look at and point to a toy across the room, does your child look at it?' },
  { id: 4, question: 'Does your child let you know that he/she needs help or wants an object out of reach?' },
  { id: 5, question: 'Does your child do things just to get you to laugh?' },
  { id: 6, question: 'Does your child try to get you to look at him/her?' },
  { id: 7, question: 'Does your child reach his/her arms up toward you to be picked up?' },
  { id: 8, question: 'How many different speech sounds does your child make?' },
  { id: 9, question: 'Does your child use sounds or words to get your attention or help?' },
  { id: 10, question: 'How many words does your child use meaningfully?' },
  { id: 11, question: 'Does your child put two words together?' },
  { id: 12, question: 'Does your child use sounds or words to protest?' },
  { id: 13, question: 'Does your child use sounds or words to greet people?' },
  { id: 14, question: 'Does your child use sounds or words to make requests?' },
  { id: 15, question: 'Does your child use sounds or words to describe something?' },
  { id: 16, question: 'Does your child stack blocks or rings?' },
  { id: 17, question: 'Does your child put objects into a container?' },
  { id: 18, question: 'Does your child take objects out of a container?' },
  { id: 19, question: 'Does your child pretend to play with toys? (e.g., feed a stuffed animal, put a doll to sleep)' },
  { id: 20, question: 'Does your child show interest in pictures in books?' },
  { id: 21, question: 'Does your child point to pictures in a book?' },
  { id: 22, question: 'Does your child use gestures like waving or nodding head?' },
  { id: 23, question: 'Does your child show you things by pointing at them?' },
  { id: 24, question: 'Does your child share attention with you by pointing, showing, or giving objects to you?' },
];

export const QCHAT_QUESTIONS = [
  { id: 1, question: 'Does your child look at you when you call his/her name?' },
  { id: 2, question: 'How easy is it to make eye contact with your child?' },
  { id: 3, question: 'Does your child point to indicate that he/she wants something (e.g., a toy that is out of reach)?' },
  { id: 4, question: 'Does your child point to share interest with you (e.g., pointing at an interesting sight)?' },
  { id: 5, question: 'Does your child pretend? (e.g., care for dolls, talk on a toy phone)' },
  { id: 6, question: 'Does your child follow where you are looking?' },
  { id: 7, question: 'If you or someone else in the family is visibly upset, does your child show signs of wanting to comfort them?' },
  { id: 8, question: "Would you describe your child's first words as unusual? (e.g., not typical naming words)" },
  { id: 9, question: 'Does your child use simple gestures? (e.g., wave goodbye)' },
  { id: 10, question: 'Does your child stare at nothing with no apparent purpose?' },
];

export const QCHAT_REVERSED_INDICES = new Set([8, 10]);

export const CAST_QUESTIONS = [
  { id: 1, question: 'Does s/he join in playing games with other children easily?', scored: true, riskAnswer: 'no' },
  { id: 2, question: 'Does s/he come up to you spontaneously for a chat?', scored: true, riskAnswer: 'no' },
  { id: 3, question: 'Was s/he speaking by 2 years old?', scored: false },
  { id: 4, question: 'Does s/he enjoy sports?', scored: true, riskAnswer: 'no' },
  { id: 5, question: 'Is it important to him/her to fit in with the peer group?', scored: true, riskAnswer: 'no' },
  { id: 6, question: 'Does s/he appear to notice unusual details that others miss?', scored: true, riskAnswer: 'yes' },
  { id: 7, question: 'Does s/he tend to take things literally?', scored: true, riskAnswer: 'yes' },
  { id: 8, question: 'When s/he was 3 years old, did s/he spend a lot of time pretending (e.g., being a superhero, or setting up a imaginary world)?', scored: true, riskAnswer: 'no' },
  { id: 9, question: 'Does s/he like to do things over and over again, in the same way all the time?', scored: true, riskAnswer: 'yes' },
  { id: 10, question: 'Does s/he find it easy to interact with other children?', scored: true, riskAnswer: 'no' },
  { id: 11, question: 'Can s/he keep a two-way conversation going?', scored: true, riskAnswer: 'no' },
  { id: 12, question: 'Can s/he read appropriately for his/her age?', scored: false },
  { id: 13, question: 'Does s/he mostly have the same interests as his/her peers?', scored: true, riskAnswer: 'no' },
  { id: 14, question: 'Does s/he have an interest which takes up so much time that s/he does little else?', scored: true, riskAnswer: 'yes' },
  { id: 15, question: 'Does s/he have friends, rather than just acquaintances?', scored: true, riskAnswer: 'no' },
  { id: 16, question: 'Does s/he often bring you things s/he is interested in to show you?', scored: true, riskAnswer: 'no' },
  { id: 17, question: 'Does s/he enjoy joking around?', scored: true, riskAnswer: 'no' },
  { id: 18, question: 'Does s/he have difficulty understanding the rules for polite behavior?', scored: true, riskAnswer: 'yes' },
  { id: 19, question: 'Does s/he appear to have an unusual memory for details?', scored: true, riskAnswer: 'yes' },
  { id: 20, question: 'Is his/her voice unusual (e.g., overly adult, flat, or very monotonous)?', scored: true, riskAnswer: 'yes' },
  { id: 21, question: 'Are people important to him/her?', scored: true, riskAnswer: 'no' },
  { id: 22, question: 'Can s/he dress him/herself?', scored: false },
  { id: 23, question: 'Is s/he good at turn-taking in conversation?', scored: true, riskAnswer: 'no' },
  { id: 24, question: 'Does s/he play imaginatively with other children, and engage in role-play?', scored: true, riskAnswer: 'no' },
  { id: 25, question: 'Does s/he often do or say things that are tactless or socially inappropriate?', scored: true, riskAnswer: 'yes' },
  { id: 26, question: 'Can s/he count to 50 without help?', scored: false },
  { id: 27, question: 'Does s/he make normal eye contact?', scored: true, riskAnswer: 'no' },
  { id: 28, question: 'Does s/he have any unusual and repetitive movements?', scored: true, riskAnswer: 'yes' },
  { id: 29, question: 'Is his/her social behavior very one-sided?', scored: true, riskAnswer: 'yes' },
  { id: 30, question: 'Does s/he sometimes say "you" or "s/he" when s/he means "I"?', scored: true, riskAnswer: 'yes' },
  { id: 31, question: 'Does s/he prefer imaginative activities such as play-acting or story-telling?', scored: true, riskAnswer: 'no' },
  { id: 32, question: 'Does s/he seem to be unusually fearful or anxious?', scored: false },
  { id: 33, question: "Does s/he find other children's games and activities uninteresting?", scored: true, riskAnswer: 'yes' },
  { id: 34, question: 'Does s/he like to talk to adults more than children?', scored: true, riskAnswer: 'yes' },
  { id: 35, question: 'Does s/he dislike changes in routine?', scored: true, riskAnswer: 'yes' },
  { id: 36, question: 'Does s/he ever talk to you just to be friendly?', scored: true, riskAnswer: 'no' },
  { id: 37, question: 'Does s/he have an even temperament without sudden changes in mood?', scored: false },
];

export const SCREENING_DISCLAIMER =
  'This screening is not a medical diagnosis. Results indicate risk level only. A formal diagnosis requires evaluation by a qualified clinical specialist.';
