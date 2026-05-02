/**
 * StoryNavigatorGame — Game 3 · Cognitive · Social Stories · Behavioral
 * Spec: neurochain_games_activities.md — GAME 3
 *
 * Interactive branching social narrative where child makes choices for
 * the protagonist and sees the consequences. 6 scenario categories,
 * descriptive/perspective/directive sentence balance.
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, Animated,
} from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

const { width } = Dimensions.get('window');

// ── Story library (6 categories × simplified stories) ───────────────────────
const STORIES = [
  {
    id: 1,
    category: 'Sharing & Turn-Taking',
    categoryEmoji: '🤝',
    title: 'The Red Crayon',
    difficulty: 1,
    scenes: [
      {
        type: 'descriptive',
        text: 'Rahim and Sara are sitting at the table. They both want the red crayon.',
        emoji: '✏️',
        perspective: null,
        choices: null,
        nextScene: 1,
      },
      {
        type: 'perspective',
        text: 'Sara reached for the crayon first.',
        emoji: '😟',
        perspective: 'Rahim feels sad because he really wanted to draw too.',
        choices: null,
        nextScene: 2,
      },
      {
        type: 'directive',
        text: 'What should Rahim do?',
        emoji: '🤔',
        perspective: null,
        choices: [
          { label: 'Ask politely: "Can I have it next?"', emoji: '😊', outcome: 'good', nextScene: 3 },
          { label: 'Grab the crayon away', emoji: '😠', outcome: 'bad', nextScene: 4 },
        ],
        nextScene: null,
      },
      {
        id: 3,
        type: 'outcome_good',
        text: 'Rahim asked politely. Sara smiled and said "Sure! I\'ll be done soon." They both drew beautiful pictures together!',
        emoji: '🌈',
        perspective: null,
        choices: null,
        nextScene: -1,
      },
      {
        id: 4,
        type: 'outcome_bad',
        text: 'Rahim grabbed the crayon. Sara started crying. Their teacher came over and they both had to sit out.',
        emoji: '😢',
        perspective: 'Grabbing things makes friends feel sad and hurt. Let\'s try asking next time!',
        choices: [{ label: 'Try again the right way!', emoji: '💪', outcome: 'retry', nextScene: 2 }],
        nextScene: null,
      },
    ],
  },
  {
    id: 2,
    category: 'Handling Frustration',
    categoryEmoji: '😤',
    title: 'The Broken Tower',
    difficulty: 1,
    scenes: [
      {
        type: 'descriptive',
        text: 'Mia spent 10 minutes building a tall block tower. Then it fell down with a crash!',
        emoji: '🏗️',
        perspective: null,
        choices: null,
        nextScene: 1,
      },
      {
        type: 'perspective',
        text: 'Mia\'s face turned red.',
        emoji: '😤',
        perspective: 'Mia feels very frustrated. That is okay! Frustration is a normal feeling.',
        choices: null,
        nextScene: 2,
      },
      {
        type: 'directive',
        text: 'What is a good thing for Mia to do?',
        emoji: '🤔',
        perspective: null,
        choices: [
          { label: 'Take 3 deep breaths, then rebuild', emoji: '😤', outcome: 'good', nextScene: 3 },
          { label: 'Throw the blocks across the room', emoji: '😡', outcome: 'bad', nextScene: 4 },
        ],
        nextScene: null,
      },
      {
        id: 3,
        type: 'outcome_good',
        text: 'Mia took 3 deep breaths. She felt calmer. She rebuilt her tower — even taller this time! She felt so proud!',
        emoji: '🏆',
        perspective: null,
        choices: null,
        nextScene: -1,
      },
      {
        id: 4,
        type: 'outcome_bad',
        text: 'Mia threw the blocks. One hit the wall. She felt worse after, and had to clean up the mess.',
        emoji: '😔',
        perspective: 'When we throw things, we can hurt people or break things. Breathing helps more!',
        choices: [{ label: 'Try the calm way!', emoji: '🌬️', outcome: 'retry', nextScene: 2 }],
        nextScene: null,
      },
    ],
  },
  {
    id: 3,
    category: 'Greetings',
    categoryEmoji: '👋',
    title: 'Meeting a New Friend',
    difficulty: 1,
    scenes: [
      {
        type: 'descriptive',
        text: 'Today is Rafi\'s first day at the playground. He sees a girl playing alone with a ball.',
        emoji: '⚽',
        perspective: null,
        choices: null,
        nextScene: 1,
      },
      {
        type: 'perspective',
        text: 'The girl looks up at Rafi.',
        emoji: '👀',
        perspective: 'She might feel lonely. Rafi feels nervous too!',
        choices: null,
        nextScene: 2,
      },
      {
        type: 'directive',
        text: 'What can Rafi do?',
        emoji: '🤔',
        perspective: null,
        choices: [
          { label: 'Say hi and ask to play', emoji: '😊', outcome: 'good', nextScene: 3 },
          { label: 'Walk away without talking', emoji: '😶', outcome: 'bad', nextScene: 4 },
        ],
        nextScene: null,
      },
      {
        id: 3,
        type: 'outcome_good',
        text: '"Hi! I\'m Rafi. Can I play with you?" The girl smiled. "Yes! I\'m Nadia." They played together and had so much fun!',
        emoji: '🌟',
        perspective: null,
        choices: null,
        nextScene: -1,
      },
      {
        id: 4,
        type: 'outcome_bad',
        text: 'Rafi walked away. Nadia felt ignored and sad. Rafi played alone and felt lonely.',
        emoji: '😞',
        perspective: 'A small "hello" can start a great friendship. Let\'s be brave!',
        choices: [{ label: 'Be brave — say hi!', emoji: '💪', outcome: 'retry', nextScene: 2 }],
        nextScene: null,
      },
    ],
  },
];

type Phase = 'library' | 'play' | 'roleplay' | 'summary';

interface ChoiceLog { storyId: number; choice: string; outcome: string; }
interface Props { onFinish: (m: any) => void; }

export const StoryNavigatorGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>('library');
  const [storyIdx, setStoryIdx] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [choiceLogs, setChoiceLogs] = useState<ChoiceLog[]>([]);
  const [completedStories, setCompleted] = useState<number[]>([]);
  const [startTime] = useState(Date.now());

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const story = STORIES[storyIdx];
  const scene = story?.scenes[sceneIdx];

  const fadeTransition = (cb: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleStorySelect = (idx: number) => {
    setStoryIdx(idx);
    setSceneIdx(0);
    setPhase('play');
  };

  const handleNext = () => {
    if (!scene) return;
    fadeTransition(() => {
      if (scene.nextScene === -1) {
        setCompleted(c => [...c, story.id]);
        setPhase('roleplay');
      } else if (scene.nextScene !== null) {
        setSceneIdx(scene.nextScene);
      }
    });
  };

  const handleChoice = (choice: { label: string; emoji: string; outcome: string; nextScene: number }) => {
    setChoiceLogs(cl => [...cl, { storyId: story.id, choice: choice.label, outcome: choice.outcome }]);
    fadeTransition(() => {
      setSceneIdx(choice.nextScene);
    });
  };

  const handleRolePlayDone = () => {
    if (storyIdx + 1 < STORIES.length) {
      setStoryIdx(storyIdx + 1);
      setSceneIdx(0);
      setPhase('library');
    } else {
      setPhase('summary');
    }
  };

  // ── LIBRARY ──
  if (phase === 'library') {
    return (
      <ScrollView contentContainerStyle={s.library}>
        <Text style={s.h1}>Story Navigator 📖</Text>
        <Text style={s.sub}>Choose a story to explore</Text>
        {STORIES.map((st, i) => {
          const done = completedStories.includes(st.id);
          return (
            <TouchableOpacity key={st.id} style={[s.storyCard, done && s.storyDone]} onPress={() => handleStorySelect(i)} activeOpacity={0.8}>
              <View style={s.storyEmoji}><Text style={{ fontSize: 32 }}>{st.categoryEmoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.storyTitle}>{st.title}</Text>
                <Text style={s.storyCategory}>{st.category}</Text>
              </View>
              {done && <Text style={s.doneBadge}>✓ Done</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  // ── ROLEPLAY LAUNCHER ──
  if (phase === 'roleplay') {
    return (
      <View style={s.rolePay}>
        <Text style={{ fontSize: 72 }}>🎭</Text>
        <Text style={s.rpTitle}>Now let's practice!</Text>
        <Text style={s.rpSub}>Try the story in real life. Use props and act it out with your child.</Text>
        <View style={s.rpCard}>
          <Text style={s.rpCardTitle}>Props needed:</Text>
          <Text style={s.rpCardText}>
            {story.id === 1 ? '• Crayons or pencils\n• A piece of paper\n• Stuffed animal as "Sara"' :
             story.id === 2 ? '• Building blocks or pillows\n• A timer\n• A calm spot to breathe' :
             '• A ball or toy\n• An open space\n• Stuffed animal as "Nadia"'}
          </Text>
        </View>
        <TouchableOpacity style={s.doneBtn} onPress={handleRolePlayDone}>
          <Text style={s.doneTxt}>
            {storyIdx + 1 < STORIES.length ? 'Next Story →' : 'Finish Session'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── SUMMARY ──
  if (phase === 'summary') {
    const goodChoices = choiceLogs.filter(c => c.outcome === 'good').length;
    const total = choiceLogs.filter(c => c.outcome !== 'retry').length;
    return (
      <ScrollView contentContainerStyle={s.summary}>
        <Text style={s.h1}>All done! 🌟</Text>
        <View style={s.scoreCircle}>
          <Text style={s.scoreNum}>{goodChoices}/{total}</Text>
          <Text style={s.scoreLbl}>Good Choices</Text>
        </View>
        <Text style={s.sectionLbl}>Choice History</Text>
        {choiceLogs.filter(c => c.outcome !== 'retry').map((c, i) => (
          <View key={i} style={s.choiceRow}>
            <Text style={{ fontSize: 18 }}>{c.outcome === 'good' ? '✅' : '🔁'}</Text>
            <Text style={s.choiceTxt} numberOfLines={2}>{c.choice}</Text>
          </View>
        ))}
        <TouchableOpacity style={s.doneBtn} onPress={() => onFinish({
          accuracy_percentage: total > 0 ? Math.round((goodChoices / total) * 100) : 0,
          session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
          stories_completed: completedStories.length,
          good_choices: goodChoices,
          choice_log: choiceLogs,
        })}>
          <Text style={s.doneTxt}>Finish Session</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── PLAY ──
  if (!scene) return null;

  const bgColor =
    scene.type === 'outcome_good' ? '#F0FDF4' :
    scene.type === 'outcome_bad' ? '#FFF1F2' :
    scene.type === 'perspective' ? '#FDF4FF' : colors.cream;

  return (
    <Animated.View style={[s.play, { opacity: fadeAnim, backgroundColor: bgColor }]}>
      <View style={s.playHeader}>
        <Text style={s.playStory}>{story.title}</Text>
        <Text style={s.playScene}>{sceneIdx + 1}/{story.scenes.length}</Text>
      </View>

      <View style={s.sceneCard}>
        <Text style={{ fontSize: 80, marginBottom: 20 }}>{scene.emoji}</Text>
        {scene.type !== 'directive' && (
          <View style={[s.sceneTypePill, {
            backgroundColor: scene.type === 'descriptive' ? colors.primaryLight :
                             scene.type === 'perspective' ? colors.secondaryLight :
                             scene.type === 'outcome_good' ? colors.successLight : colors.dangerLight,
          }]}>
            <Text style={[s.sceneTypeTxt, {
              color: scene.type === 'descriptive' ? colors.primary :
                     scene.type === 'perspective' ? colors.secondary :
                     scene.type === 'outcome_good' ? colors.success : colors.danger,
            }]}>
              {scene.type === 'descriptive' ? '📝 Story' : scene.type === 'perspective' ? '💭 Feelings' : scene.type === 'outcome_good' ? '⭐ Good Outcome' : '⚠️ Consequence'}
            </Text>
          </View>
        )}
        <Text style={s.sceneText}>{scene.text}</Text>
        {scene.perspective && (
          <View style={s.perspectiveBubble}>
            <Text style={s.perspectiveText}>💬 {scene.perspective}</Text>
          </View>
        )}
      </View>

      {scene.choices ? (
        <View style={s.choicesContainer}>
          <Text style={s.choicePrompt}>What should happen next?</Text>
          {scene.choices.map((ch, i) => (
            <TouchableOpacity key={i} style={s.choiceBtn} onPress={() => handleChoice(ch)} activeOpacity={0.8}>
              <Text style={{ fontSize: 28 }}>{ch.emoji}</Text>
              <Text style={s.choiceBtnTxt}>{ch.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={s.nextTxt}>{scene.nextScene === -1 ? '🎉 Finish Story' : 'Next →'}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  library: { flexGrow: 1, backgroundColor: colors.cream, padding: 28, paddingTop: 60 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 24 },
  storyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  storyDone: { opacity: 0.65 },
  storyEmoji: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  storyTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  storyCategory: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', marginTop: 3 },
  doneBadge: { fontSize: 12, fontWeight: '700', color: colors.success, fontFamily: 'Inter' },

  play: { flex: 1, padding: 24, paddingTop: 52 },
  playHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  playStory: { fontSize: 16, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  playScene: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter' },
  sceneCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 24, alignItems: 'center', ...shadow.md, marginBottom: 20 },
  sceneTypePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, marginBottom: 14 },
  sceneTypeTxt: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter' },
  sceneText: { fontSize: 17, fontWeight: '600', color: colors.textDark, fontFamily: 'Inter', textAlign: 'center', lineHeight: 26 },
  perspectiveBubble: { marginTop: 16, backgroundColor: colors.secondaryLight, borderRadius: radius.md, padding: 14, borderLeftWidth: 3, borderLeftColor: colors.secondary },
  perspectiveText: { fontSize: 14, color: colors.secondary, fontFamily: 'Inter', fontWeight: '600', fontStyle: 'italic', lineHeight: 20 },

  choicesContainer: { gap: 12 },
  choicePrompt: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', textAlign: 'center', marginBottom: 8 },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, borderWidth: 2, borderColor: colors.border, ...shadow.sm },
  choiceBtnTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textDark, fontFamily: 'Inter', lineHeight: 20 },
  nextBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: radius.full, alignSelf: 'center' },
  nextTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 16 },

  rolePay: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  rpTitle: { fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', textAlign: 'center' },
  rpSub: { fontSize: 15, color: colors.textMuted, fontFamily: 'Inter', textAlign: 'center', lineHeight: 22 },
  rpCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, width: '100%', ...shadow.sm },
  rpCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 10 },
  rpCardText: { fontSize: 14, color: colors.textBody, fontFamily: 'Inter', lineHeight: 22 },

  summary: { flexGrow: 1, backgroundColor: colors.cream, alignItems: 'center', padding: 28, paddingTop: 52 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 5, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  scoreNum: { fontSize: 30, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  scoreLbl: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter' },
  sectionLbl: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', alignSelf: 'flex-start', marginBottom: 12 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  choiceTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textBody, fontFamily: 'Inter' },
  doneBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: radius.full, marginTop: 20 },
  doneTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 16 },
});
