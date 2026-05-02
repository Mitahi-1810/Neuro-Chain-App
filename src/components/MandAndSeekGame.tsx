/**
 * MandAndSeekGame — Game 2 · Communication · Requesting (Manding)
 * Spec: neurochain_games_activities.md — GAME 2
 *
 * Child must identify and request a partially-revealed item, then
 * go find it. Supports AAC Tap / Sentence Builder / Verbal modes.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, ScrollView,
} from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

const { width } = Dimensions.get('window');

// Built-in item library (parent can add custom in full app)
const ITEMS = [
  { id: 'cup',     emoji: '🥛', en: 'Cup',     bn: 'কাপ',     category: 'food' },
  { id: 'ball',    emoji: '⚽', en: 'Ball',    bn: 'বল',      category: 'toy' },
  { id: 'book',    emoji: '📚', en: 'Book',    bn: 'বই',      category: 'activity' },
  { id: 'apple',   emoji: '🍎', en: 'Apple',   bn: 'আপেল',    category: 'food' },
  { id: 'pencil',  emoji: '✏️', en: 'Pencil',  bn: 'পেন্সিল', category: 'activity' },
  { id: 'car',     emoji: '🚗', en: 'Car',     bn: 'গাড়ি',    category: 'toy' },
  { id: 'banana',  emoji: '🍌', en: 'Banana',  bn: 'কলা',     category: 'food' },
  { id: 'doll',    emoji: '🪆', en: 'Doll',    bn: 'পুতুল',   category: 'toy' },
];

type Mode = 'aac' | 'sentence' | 'verbal';
type Phase = 'setup' | 'reveal' | 'request' | 'seek' | 'reward' | 'summary';
type Lang = 'en' | 'bn';

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

interface TrialLog { item: string; mode: Mode; success: boolean; seekDuration: number; }
interface Props { onFinish: (m: any) => void; }

const ROUNDS = 5;
const SEEK_SECONDS = 60;

export const MandAndSeekGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<Mode>('aac');
  const [lang, setLang] = useState<Lang>('en');
  const [round, setRound] = useState(0);
  const [queue] = useState(() => shuffle(ITEMS).slice(0, ROUNDS));
  const [log, setLog] = useState<TrialLog[]>([]);
  const [seekTimer, setSeekTimer] = useState(SEEK_SECONDS);
  const [seekStart, setSeekStart] = useState(0);
  const [selectedAcc, setSelectedAcc] = useState<string | null>(null);
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const revealAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const current = queue[round];

  useEffect(() => {
    if (phase !== 'reveal') return;
    revealAnim.setValue(0);
    Animated.timing(revealAnim, { toValue: 1, duration: 2500, useNativeDriver: false }).start(() => {
      setPhase('request');
      setSentenceWords([]);
      setSelectedAcc(null);
    });
  }, [phase, round]);

  useEffect(() => {
    if (phase !== 'seek') return;
    setSeekTimer(SEEK_SECONDS);
    const iv = setInterval(() => {
      setSeekTimer(t => {
        if (t <= 1) { clearInterval(iv); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, round]);

  const startRound = () => {
    setSelectedAcc(null);
    setSentenceWords([]);
    setPhase('reveal');
    revealAnim.setValue(0);
  };

  const handleModeSelect = (m: Mode) => {
    setMode(m);
    startRound();
  };

  const handleAacTap = (id: string) => {
    setSelectedAcc(id);
  };

  const handleAacConfirm = () => {
    if (selectedAcc === current.id) advance(true);
    else { setSelectedAcc(null); }
  };

  const SENTENCE_CHIPS = ['I', 'want', 'please', current.en, current.bn];

  const handleWordChip = (w: string) => {
    setSentenceWords(ws => {
      if (ws.includes(w)) return ws;
      return [...ws, w];
    });
  };

  const handleSentenceConfirm = () => {
    const ok = sentenceWords.includes(current.en) || sentenceWords.includes(current.bn);
    advance(ok);
  };

  const handleVerbalConfirm = (ok: boolean) => advance(ok);

  const advance = (success: boolean) => {
    setSeekStart(Date.now());
    setPhase('seek');
  };

  const handleFound = () => {
    const dur = Math.round((Date.now() - seekStart) / 1000);
    const newLog = [...log, { item: current.id, mode, success: true, seekDuration: dur }];
    setLog(newLog);
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setPhase('reward');
    setTimeout(() => {
      if (round + 1 >= ROUNDS) setPhase('summary');
      else { setRound(r => r + 1); startRound(); }
    }, 1800);
  };

  // ── SETUP ──
  if (phase === 'setup') {
    return (
      <View style={s.setup}>
        <Text style={s.h1}>Mand & Seek 🔍</Text>
        <Text style={s.sub}>Request the item to unlock it!</Text>
        <View style={s.langRow}>
          {(['en', 'bn'] as Lang[]).map(l => (
            <TouchableOpacity key={l} style={[s.langBtn, lang === l && s.langActive]} onPress={() => setLang(l)}>
              <Text style={[s.langTxt, lang === l && s.langTxtActive]}>{l === 'en' ? '🇬🇧 EN' : '🇧🇩 BN'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.modeTitle}>Choose Request Mode</Text>
        {([
          { id: 'aac', icon: '🔲', label: 'AAC Tap', desc: 'Tap symbol grid to request' },
          { id: 'sentence', icon: '🧩', label: 'Sentence Builder', desc: 'Drag word chips to build a sentence' },
          { id: 'verbal', icon: '🎤', label: 'Verbal', desc: 'Speak the item name aloud' },
        ] as { id: Mode; icon: string; label: string; desc: string }[]).map(m => (
          <TouchableOpacity key={m.id} style={s.modeCard} onPress={() => handleModeSelect(m.id)} activeOpacity={0.8}>
            <Text style={{ fontSize: 28 }}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.modeLabel}>{m.label}</Text>
              <Text style={s.modeDesc}>{m.desc}</Text>
            </View>
            <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ── SUMMARY ──
  if (phase === 'summary') {
    const total = log.length;
    const ok = log.filter(l => l.success).length;
    const avgSeek = total ? Math.round(log.reduce((a, l) => a + l.seekDuration, 0) / total) : 0;
    return (
      <ScrollView contentContainerStyle={s.summary}>
        <Text style={s.h1}>Well done! 🎉</Text>
        <View style={s.statRow}>
          <View style={s.statBox}><Text style={s.statNum}>{ok}/{total}</Text><Text style={s.statLbl}>Successful Requests</Text></View>
          <View style={s.statBox}><Text style={s.statNum}>{avgSeek}s</Text><Text style={s.statLbl}>Avg Seek Time</Text></View>
        </View>
        <Text style={s.sectionLbl}>Items Requested</Text>
        {log.map((l, i) => {
          const it = ITEMS.find(x => x.id === l.item)!;
          return (
            <View key={i} style={s.logRow}>
              <Text style={{ fontSize: 24 }}>{it.emoji}</Text>
              <Text style={s.logName}>{it.en}</Text>
              <Text style={s.logMode}>{l.mode.toUpperCase()}</Text>
              <Text style={[s.logResult, { color: l.success ? colors.success : colors.danger }]}>{l.success ? '✓' : '✗'}</Text>
            </View>
          );
        })}
        <TouchableOpacity style={s.doneBtn} onPress={() => onFinish({
          accuracy_percentage: Math.round((ok / total) * 100),
          session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
          total_items: total, successful_requests: ok, mode_used: mode,
        })}>
          <Text style={s.doneTxt}>Finish Session</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!current) return null;

  // ── REVEAL ──
  if (phase === 'reveal') {
    const blurH = revealAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });
    return (
      <View style={s.game}>
        <Text style={s.roundLbl}>Round {round + 1} of {ROUNDS}</Text>
        <Text style={s.revealTitle}>What is this? 👀</Text>
        <View style={s.revealFrame}>
          <Text style={{ fontSize: 110 }}>{current.emoji}</Text>
          <Animated.View style={[s.blurOverlay, { opacity: blurH.interpolate({ inputRange: [0, 100], outputRange: [0, 1] }) }]} />
        </View>
        <Text style={s.revealHint}>Revealing…</Text>
      </View>
    );
  }

  // ── REQUEST ──
  if (phase === 'request') {
    const distractors = ITEMS.filter(x => x.id !== current.id).slice(0, mode === 'aac' ? 3 : 0);
    const grid = shuffle([current, ...distractors]);

    return (
      <View style={s.game}>
        <Text style={s.roundLbl}>Round {round + 1} of {ROUNDS}</Text>
        <Text style={{ fontSize: 72, marginBottom: 16 }}>{current.emoji}</Text>
        <Text style={s.requestTitle}>
          {mode === 'aac' ? 'Tap to request!' : mode === 'sentence' ? 'Build your sentence!' : 'Say it aloud!'}
        </Text>

        {mode === 'aac' && (
          <>
            <View style={s.aacGrid}>
              {grid.map(item => (
                <TouchableOpacity key={item.id} style={[s.aacBtn, selectedAcc === item.id && s.aacSelected]}
                  onPress={() => handleAacTap(item.id)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                  <Text style={s.aacLbl}>{lang === 'en' ? item.en : item.bn}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedAcc && (
              <TouchableOpacity style={s.confirmBtn} onPress={handleAacConfirm}>
                <Text style={s.confirmTxt}>I want {ITEMS.find(x => x.id === selectedAcc)?.[lang === 'en' ? 'en' : 'bn']}!</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {mode === 'sentence' && (
          <>
            <View style={s.sentenceBar}>
              {sentenceWords.length === 0
                ? <Text style={s.sentencePlaceholder}>Tap chips below →</Text>
                : sentenceWords.map((w, i) => <Text key={i} style={s.sentenceWord}>{w}</Text>)
              }
            </View>
            <View style={s.chipRow}>
              {SENTENCE_CHIPS.map(w => (
                <TouchableOpacity key={w} style={[s.chip, sentenceWords.includes(w) && s.chipUsed]}
                  onPress={() => handleWordChip(w)} disabled={sentenceWords.includes(w)}>
                  <Text style={s.chipTxt}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {sentenceWords.length >= 2 && (
              <TouchableOpacity style={s.confirmBtn} onPress={handleSentenceConfirm}>
                <Text style={s.confirmTxt}>Submit Sentence</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {mode === 'verbal' && (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Text style={s.verbalHint}>Say: "{lang === 'en' ? current.en : current.bn}"</Text>
            <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.success }]} onPress={() => handleVerbalConfirm(true)}>
              <Text style={s.confirmTxt}>✓ I said it!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => handleVerbalConfirm(false)}>
              <Text style={[s.confirmTxt, { color: colors.textMuted }]}>Need help</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── SEEK ──
  if (phase === 'seek') {
    return (
      <View style={[s.game, { justifyContent: 'center', gap: 24 }]}>
        <Text style={s.seekTitle}>GO FIND IT! 🏃</Text>
        <Text style={{ fontSize: 90 }}>{current.emoji}</Text>
        <Text style={s.seekItem}>{lang === 'en' ? current.en : current.bn}</Text>
        <View style={s.timerCircle}>
          <Text style={s.timerNum}>{seekTimer}</Text>
          <Text style={s.timerLbl}>seconds</Text>
        </View>
        <TouchableOpacity style={s.foundBtn} onPress={handleFound}>
          <Text style={s.foundTxt}>🎉 I Found It!</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── REWARD ──
  if (phase === 'reward') {
    return (
      <View style={[s.game, { justifyContent: 'center', alignItems: 'center', gap: 20 }]}>
        <Animated.Text style={{ fontSize: 100, transform: [{ scale: bounceAnim }] }}>🌟</Animated.Text>
        <Text style={s.rewardTxt}>Amazing! You found it!</Text>
        <Text style={{ fontSize: 60 }}>{current.emoji}</Text>
      </View>
    );
  }

  return null;
};

const s = StyleSheet.create({
  setup: { flex: 1, backgroundColor: colors.cream, padding: 28, paddingTop: 60 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 20 },
  langRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  langBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: 'transparent' },
  langActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  langTxt: { fontSize: 14, fontWeight: '700', color: colors.textMuted, fontFamily: 'Inter' },
  langTxtActive: { color: colors.primary },
  modeTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 12 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  modeLabel: { fontSize: 15, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  modeDesc: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', marginTop: 3 },

  game: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', paddingTop: 60, padding: 24 },
  roundLbl: { fontSize: 13, fontWeight: '600', color: colors.textMuted, fontFamily: 'Inter', marginBottom: 12 },
  revealTitle: { fontSize: 22, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 24 },
  revealFrame: { width: width * 0.7, height: width * 0.7, borderRadius: 30, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', ...shadow.lg },
  blurOverlay: { position: 'absolute', inset: 0, backgroundColor: colors.primary } as any,
  revealHint: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter', marginTop: 20 },

  requestTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 20 },
  aacGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 20 },
  aacBtn: { width: width * 0.38, alignItems: 'center', padding: 16, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, ...shadow.sm },
  aacSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  aacLbl: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Inter', marginTop: 6 },

  sentenceBar: { width: '100%', minHeight: 52, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, marginBottom: 16, flexWrap: 'wrap' },
  sentencePlaceholder: { color: colors.textMuted, fontFamily: 'Inter', fontSize: 14 },
  sentenceWord: { fontSize: 15, fontWeight: '700', color: colors.primary, fontFamily: 'Poppins', paddingHorizontal: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.secondaryLight, borderWidth: 1, borderColor: colors.secondary },
  chipUsed: { opacity: 0.35 },
  chipTxt: { fontSize: 14, fontWeight: '700', color: colors.secondary, fontFamily: 'Inter' },

  verbalHint: { fontSize: 18, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', textAlign: 'center' },

  confirmBtn: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: radius.full, marginTop: 4 },
  confirmTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 15 },

  seekTitle: { fontSize: 30, fontWeight: '900', color: colors.textDark, fontFamily: 'Poppins' },
  seekItem: { fontSize: 22, fontWeight: '700', color: colors.primary, fontFamily: 'Poppins' },
  timerCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 5, borderColor: colors.warning, justifyContent: 'center', alignItems: 'center' },
  timerNum: { fontSize: 28, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  timerLbl: { fontSize: 11, color: colors.textMuted, fontFamily: 'Inter' },
  foundBtn: { backgroundColor: colors.success, paddingHorizontal: 36, paddingVertical: 16, borderRadius: radius.full },
  foundTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 18 },

  rewardTxt: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },

  summary: { flexGrow: 1, backgroundColor: colors.cream, alignItems: 'center', padding: 28, paddingTop: 52 },
  statRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  statBox: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, alignItems: 'center', ...shadow.sm },
  statNum: { fontSize: 28, fontWeight: '800', color: colors.primary, fontFamily: 'Poppins' },
  statLbl: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', marginTop: 4, textAlign: 'center' },
  sectionLbl: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', alignSelf: 'flex-start', marginBottom: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  logName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textBody, fontFamily: 'Inter' },
  logMode: { fontSize: 11, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  logResult: { fontSize: 18, fontWeight: '800' },
  doneBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: radius.full, marginTop: 24 },
  doneTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 16 },
});
