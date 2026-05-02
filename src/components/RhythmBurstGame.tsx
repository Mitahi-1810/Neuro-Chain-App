/**
 * RhythmBurstGame — Game 4 · Motor Skills · Sensory · Proprioception
 * Spec: neurochain_games_activities.md — GAME 4
 *
 * Animated animal avatar performs movement; child mirrors it.
 * Parent selects regulation state → app serves correct movement sequence.
 * Parent taps DONE after each movement; Energy Meter at end.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, ScrollView,
} from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

const { width } = Dimensions.get('window');

// ── Movement Library ─────────────────────────────────────────────────────────
const MOVEMENTS = [
  { id: 'bear_crawl',   name: 'Bear Crawl',    emoji: '🐻', sensory: 'calming',  desc: 'Get on all fours and crawl like a bear!', duration: '30 sec', reps: null },
  { id: 'frog_jump',    name: 'Frog Jump',     emoji: '🐸', sensory: 'alerting', desc: 'Squat down and jump up high like a frog!', duration: null, reps: '10 jumps' },
  { id: 'crab_walk',    name: 'Crab Walk',     emoji: '🦀', sensory: 'calming',  desc: 'Sit, put hands behind you, lift up and walk sideways!', duration: '30 sec', reps: null },
  { id: 'wall_push',    name: 'Wall Push',     emoji: '🧱', sensory: 'calming',  desc: 'Stand at a wall, push with both hands as hard as you can!', duration: '10 sec', reps: '× 3' },
  { id: 'log_roll',     name: 'Log Roll',      emoji: '🪵', sensory: 'calming',  desc: 'Lie flat on the floor and roll like a log!', duration: null, reps: '5 rolls' },
  { id: 'spin_freeze',  name: 'Spin & Freeze', emoji: '🌀', sensory: 'alerting', desc: 'Spin in a circle then FREEZE like a statue!', duration: '5 sec', reps: '× 3 spins' },
  { id: 'elephant_stomp', name: 'Elephant Stomp', emoji: '🐘', sensory: 'calming', desc: 'March heavily like a big elephant!', duration: null, reps: '20 stomps' },
  { id: 'star_jump',    name: 'Star Jump',     emoji: '⭐', sensory: 'alerting', desc: 'Jump and spread your arms and legs like a star!', duration: null, reps: '15 jumps' },
];

type RegState = 'too_high' | 'too_low' | 'regulated';
type Phase = 'checkin' | 'avatar' | 'moving' | 'done_confirm' | 'energy_meter' | 'summary';
type AvatarId = 'bear' | 'frog' | 'crab' | 'elephant';

const AVATARS: Record<AvatarId, { emoji: string; label: string }> = {
  bear:     { emoji: '🐻', label: 'Bear' },
  frog:     { emoji: '🐸', label: 'Frog' },
  crab:     { emoji: '🦀', label: 'Crab' },
  elephant: { emoji: '🐘', label: 'Elephant' },
};

function getSequence(state: RegState): typeof MOVEMENTS {
  const calming = MOVEMENTS.filter(m => m.sensory === 'calming');
  const alerting = MOVEMENTS.filter(m => m.sensory === 'alerting');
  if (state === 'too_high') return [...calming, calming[0]].slice(0, 4);
  if (state === 'too_low') return [...alerting, alerting[0]].slice(0, 4);
  return [MOVEMENTS[0], MOVEMENTS[1], MOVEMENTS[4], MOVEMENTS[6]]; // mix
}

interface Props { onFinish: (m: any) => void; }

export const RhythmBurstGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>('checkin');
  const [regState, setRegState] = useState<RegState>('regulated');
  const [avatar, setAvatar] = useState<AvatarId>('bear');
  const [sequence, setSequence] = useState<typeof MOVEMENTS>([]);
  const [moveIdx, setMoveIdx] = useState(0);
  const [completedMoves, setCompleted] = useState<string[]>([]);
  const [postRating, setPostRating] = useState(3);
  const [startTime] = useState(Date.now());

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 'moving') {
      scaleAnim.setValue(0.7);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
      startBounce();
    }
  }, [phase, moveIdx]);

  const startBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      { iterations: 8 }
    ).start();
  };

  const handleStart = (state: RegState, av: AvatarId) => {
    setRegState(state);
    setAvatar(av);
    const seq = getSequence(state);
    setSequence(seq);
    setMoveIdx(0);
    setCompleted([]);
    setPhase('moving');
  };

  const handleDone = () => {
    const move = sequence[moveIdx];
    const newCompleted = [...completedMoves, move.id];
    setCompleted(newCompleted);
    if (moveIdx + 1 >= sequence.length) {
      setPhase('energy_meter');
    } else {
      setMoveIdx(i => i + 1);
    }
  };

  const handleRating = (r: number) => setPostRating(r);

  const handleFinish = () => {
    const alertingCount = completedMoves.filter(id => MOVEMENTS.find(m => m.id === id)?.sensory === 'alerting').length;
    const calmingCount = completedMoves.length - alertingCount;
    onFinish({
      accuracy_percentage: Math.round((completedMoves.length / sequence.length) * 100),
      session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
      moves_completed: completedMoves.length,
      alerting_moves: alertingCount,
      calming_moves: calmingCount,
      post_regulation_rating: postRating,
      regulation_state_input: regState,
    });
  };

  // ── CHECK-IN ──
  if (phase === 'checkin') {
    return (
      <ScrollView contentContainerStyle={s.checkin}>
        <Text style={s.h1}>Rhythm Burst 🎵</Text>
        <Text style={s.sub}>Move your body to feel great!</Text>

        <Text style={s.sectionLbl}>How is your child feeling right now?</Text>
        {([
          { id: 'too_high', emoji: '🌪️', label: 'Too Activated / Hyper', desc: 'Jumping, can\'t stop, loud', color: '#EF4444' },
          { id: 'too_low', emoji: '🌑', label: 'Too Low / Lethargic', desc: 'Tired, sluggish, not engaging', color: '#6366F1' },
          { id: 'regulated', emoji: '✅', label: 'Just Right', desc: 'Calm, focused, ready to play', color: '#10B981' },
        ] as { id: RegState; emoji: string; label: string; desc: string; color: string }[]).map(r => (
          <TouchableOpacity key={r.id} style={[s.regCard, regState === r.id && { borderColor: r.color }]}
            onPress={() => setRegState(r.id)} activeOpacity={0.8}>
            <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.regLabel}>{r.label}</Text>
              <Text style={s.regDesc}>{r.desc}</Text>
            </View>
            {regState === r.id && <View style={[s.regCheck, { backgroundColor: r.color }]}><Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text></View>}
          </TouchableOpacity>
        ))}

        <Text style={[s.sectionLbl, { marginTop: 20 }]}>Choose your animal avatar</Text>
        <View style={s.avatarRow}>
          {(Object.entries(AVATARS) as [AvatarId, { emoji: string; label: string }][]).map(([id, av]) => (
            <TouchableOpacity key={id} style={[s.avatarBtn, avatar === id && s.avatarSelected]}
              onPress={() => setAvatar(id)} activeOpacity={0.8}>
              <Text style={{ fontSize: 36 }}>{av.emoji}</Text>
              <Text style={s.avatarLbl}>{av.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.startBtn} onPress={() => handleStart(regState, avatar)} activeOpacity={0.85}>
          <Text style={s.startTxt}>Start Moving! 🚀</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── MOVING ──
  if (phase === 'moving' && sequence[moveIdx]) {
    const move = sequence[moveIdx];
    const isCalmMove = move.sensory === 'calming';
    const bgColor = isCalmMove ? '#EFF6FF' : '#FFF7ED';
    const accentColor = isCalmMove ? colors.primary : colors.warning;

    return (
      <View style={[s.game, { backgroundColor: bgColor }]}>
        <View style={s.moveHeader}>
          <Text style={s.moveProgress}>{moveIdx + 1} / {sequence.length}</Text>
          <View style={[s.sensoryPill, { backgroundColor: accentColor + '22' }]}>
            <Text style={[s.sensoryTxt, { color: accentColor }]}>{isCalmMove ? '🌊 Calming' : '⚡ Alerting'}</Text>
          </View>
        </View>

        <Animated.Text style={[s.avatarEmoji, { transform: [{ scale: Animated.multiply(bounceAnim, scaleAnim) }] }]}>
          {AVATARS[avatar].emoji}
        </Animated.Text>

        <View style={s.moveCard}>
          <Text style={s.moveName}>{move.name}</Text>
          <Text style={{ fontSize: 40, marginVertical: 10 }}>{move.emoji}</Text>
          <Text style={s.moveDesc}>{move.desc}</Text>
          <View style={s.metaRow}>
            {move.duration && <View style={s.metaChip}><Text style={s.metaChipTxt}>⏱ {move.duration}</Text></View>}
            {move.reps && <View style={s.metaChip}><Text style={s.metaChipTxt}>🔁 {move.reps}</Text></View>}
          </View>
        </View>

        <TouchableOpacity style={[s.doneBtn, { backgroundColor: accentColor }]} onPress={handleDone} activeOpacity={0.85}>
          <Text style={s.doneTxt}>✓ DONE!</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── ENERGY METER ──
  if (phase === 'energy_meter') {
    const alertingC = completedMoves.filter(id => MOVEMENTS.find(m => m.id === id)?.sensory === 'alerting').length;
    const calmingC = completedMoves.length - alertingC;
    return (
      <View style={s.meter}>
        <Text style={s.h1}>Energy Report ⚡</Text>
        <View style={s.meterCard}>
          <Text style={s.meterLabel}>Calming Moves</Text>
          <View style={s.meterBar}>
            <View style={[s.meterFill, { width: `${(calmingC / completedMoves.length) * 100}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={s.meterCount}>{calmingC} moves</Text>
        </View>
        <View style={s.meterCard}>
          <Text style={s.meterLabel}>Alerting Moves</Text>
          <View style={s.meterBar}>
            <View style={[s.meterFill, { width: `${(alertingC / completedMoves.length) * 100}%` as any, backgroundColor: colors.warning }]} />
          </View>
          <Text style={s.meterCount}>{alertingC} moves</Text>
        </View>

        <Text style={s.ratingLbl}>How regulated is your child now?</Text>
        <View style={s.ratingRow}>
          {[1, 2, 3, 4, 5].map(r => (
            <TouchableOpacity key={r} style={[s.ratingBtn, postRating === r && s.ratingActive]}
              onPress={() => handleRating(r)}>
              <Text style={s.ratingTxt}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.ratingHint}>1 = Meltdown · 5 = Fully Calm</Text>

        <TouchableOpacity style={s.startBtn} onPress={handleFinish} activeOpacity={0.85}>
          <Text style={s.startTxt}>Finish Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const s = StyleSheet.create({
  checkin: { flexGrow: 1, backgroundColor: colors.cream, padding: 28, paddingTop: 60 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 24 },
  sectionLbl: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 12 },
  regCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: colors.border, ...shadow.sm },
  regLabel: { fontSize: 15, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  regDesc: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', marginTop: 3 },
  regCheck: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 24 },
  avatarBtn: { width: (width - 80) / 4, alignItems: 'center', padding: 12, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border },
  avatarSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  avatarLbl: { fontSize: 11, fontWeight: '700', color: colors.textDark, fontFamily: 'Inter', marginTop: 6 },
  startBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: radius.full, alignItems: 'center', marginTop: 8 },
  startTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 16 },

  game: { flex: 1, alignItems: 'center', paddingTop: 52, padding: 24 },
  moveHeader: { position: 'absolute', top: 12, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moveProgress: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  sensoryPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  sensoryTxt: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter' },
  avatarEmoji: { fontSize: 110, marginBottom: 20 },
  moveCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 24, width: '100%', alignItems: 'center', ...shadow.md, marginBottom: 20 },
  moveName: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  moveDesc: { fontSize: 15, color: colors.textBody, fontFamily: 'Inter', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metaChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceAlt },
  metaChipTxt: { fontSize: 13, fontWeight: '600', color: colors.textBody, fontFamily: 'Inter' },
  doneBtn: { paddingHorizontal: 60, paddingVertical: 18, borderRadius: radius.full },
  doneTxt: { color: '#fff', fontWeight: '900', fontFamily: 'Poppins', fontSize: 20 },

  meter: { flex: 1, backgroundColor: colors.cream, padding: 28, paddingTop: 60 },
  meterCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, marginBottom: 14, ...shadow.sm },
  meterLabel: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 10 },
  meterBar: { height: 14, backgroundColor: colors.border, borderRadius: 7, overflow: 'hidden', marginBottom: 6 },
  meterFill: { height: 14, borderRadius: 7 },
  meterCount: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter' },
  ratingLbl: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginTop: 20, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  ratingBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  ratingActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  ratingTxt: { fontSize: 18, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  ratingHint: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 24 },
});
