import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { colors, radius, shadow } from '../utils/colors';
import { LAB_ITEMS, LabItem, ItemMastery, INTRAVERBAL_PROMPTS } from '../data/labelLabItems';
import {
  Stage,
  Trial,
  ErrorCorrectionState,
  initMasteryMap,
  updateMastery,
  selectTrialItem,
  generateDistractors,
  getFieldSize,
  computeSessionStats,
} from '../engine/labelLabEngine';

const { width } = Dimensions.get('window');

type Phase = 'setup' | 'trial' | 'feedback' | 'summary';

interface Props {
  onFinish: (metrics: any) => void;
}

export const LabelLabGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [stage, setStage] = useState<Stage>(1);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [targetTrials, setTargetTrials] = useState(10);
  
  // Game State
  const [masteryMap, setMasteryMap] = useState<Map<string, ItemMastery>>(initMasteryMap());
  const [trialLog, setTrialLog] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const [currentItem, setCurrentItem] = useState<LabItem | null>(null);
  const [options, setOptions] = useState<LabItem[]>([]);
  
  // Stage 2 State
  const [sentence, setSentence] = useState<string[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  
  // Stage 4 State
  const [intraverbalPrompt, setIntraverbalPrompt] = useState<{ prompt_en: string; prompt_bn: string; answer: string } | null>(null);

  // Engine State
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [errorQueue, setErrorQueue] = useState<string[]>([]);
  const [errorState, setErrorState] = useState<ErrorCorrectionState>({
    active: false,
    step: 'model',
    item: LAB_ITEMS[0],
    trialsSinceError: 0,
  });
  
  // Session Stats
  const [startTime, setStartTime] = useState<number>(0);
  
  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ── Setup & Next Trial ──────────────────────────────────────────────────

  const startGame = (selectedStage: Stage, numTrials: number) => {
    setStage(selectedStage);
    setTargetTrials(numTrials);
    setTrialLog([]);
    setCurrentTrial(1);
    setStartTime(Date.now());
    setRecentItems([]);
    setErrorQueue([]);
    setErrorState({ active: false, step: 'model', item: LAB_ITEMS[0], trialsSinceError: 0 });
    
    // Seed intraverbal prompt if stage 4
    if (selectedStage === 4) {
       loadNextIntraverbal();
    } else {
       loadNextTrial();
    }
  };

  const loadNextTrial = () => {
    if (currentTrial > targetTrials) {
      setPhase('summary');
      return;
    }

    // Advance error delayed test counter
    if (errorState.active && errorState.step === 'delayed') {
      const nextCount = errorState.trialsSinceError + 1;
      if (nextCount >= 2) {
        // Fire delayed test now
        const item = errorState.item;
        const fieldSize = getFieldSize(masteryMap.get(item.id)!);
        setCurrentItem(item);
        setOptions(generateDistractors(item, fieldSize));
        setPhase('trial');
        return; // wait for child
      } else {
        setErrorState({ ...errorState, trialsSinceError: nextCount });
      }
    }

    const nextItem = selectTrialItem(masteryMap, recentItems, errorQueue);
    setCurrentItem(nextItem);
    setRecentItems(prev => [...prev, nextItem.id].slice(-3));

    if (errorQueue.length > 0 && errorQueue[0] === nextItem.id) {
       setErrorQueue(q => q.slice(1));
    }

    const mastery = masteryMap.get(nextItem.id)!;
    const fieldSize = getFieldSize(mastery);
    setOptions(generateDistractors(nextItem, fieldSize));

    if (stage === 2) {
      const isEn = lang === 'en';
      const itemLabel = isEn ? nextItem.en : nextItem.bn;
      const featLabel = nextItem.feature; // Simplified logic, ideally localized
      setChips([itemLabel, featLabel, 'is', 'The', 'big', 'small', 'blue', 'red'].sort(() => 0.5 - Math.random()));
      setSentence([]);
    }

    setPhase('trial');
  };
  
  const loadNextIntraverbal = () => {
    if (currentTrial > targetTrials) {
      setPhase('summary');
      return;
    }
    const prompt = INTRAVERBAL_PROMPTS[Math.floor(Math.random() * INTRAVERBAL_PROMPTS.length)];
    setIntraverbalPrompt(prompt);
    
    // Create options based on answer
    const targetItem = LAB_ITEMS.find(i => i.en.toLowerCase() === prompt.answer.toLowerCase()) || LAB_ITEMS[0];
    setCurrentItem(targetItem);
    setOptions(generateDistractors(targetItem, 4));
    
    setPhase('trial');
  }

  // ── Handling Responses ──────────────────────────────────────────────────

  const speak = (text: string) => {
    Speech.speak(text, { language: lang === 'en' ? 'en-US' : 'bn-BD', rate: 0.9 });
  };

  const handleStage1Or3Select = (selectedId: string) => {
    if (!currentItem) return;
    const isCorrect = selectedId === currentItem.id;
    processTrialResult(isCorrect);
  };

  const handleStage2Check = () => {
    if (!currentItem) return;
    const targetWord = lang === 'en' ? currentItem.en : currentItem.bn;
    const isCorrect = sentence.includes(targetWord);
    processTrialResult(isCorrect);
  };
  
  const handleStage4Select = (selectedId: string) => {
     if (!currentItem) return;
     const isCorrect = selectedId === currentItem.id;
     processTrialResult(isCorrect);
  }

  const processTrialResult = (isCorrect: boolean) => {
    if (!currentItem) return;

    // Determine Prompt Level
    let promptLvl: 'independent' | 'model' = 'independent';
    if (errorState.active && errorState.step === 'lead') promptLvl = 'model';
    
    // Update Mastery
    if (promptLvl === 'independent') {
      const newMap = new Map(masteryMap);
      updateMastery(newMap, currentItem.id, isCorrect);
      setMasteryMap(newMap);
    }

    // Log Trial
    const trialRecord: Trial = {
      trialId: Math.random().toString(36).substr(2, 9),
      item: currentItem,
      stage,
      correct: isCorrect,
      responseTimeMs: 2000, // mock latency
      promptLevel: promptLvl,
      attemptNumber: 1,
      fieldSize: options.length,
      timestamp: new Date().toISOString(),
    };
    setTrialLog(prev => [...prev, trialRecord]);

    if (isCorrect) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  const handleCorrect = () => {
    setPhase('feedback');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (currentItem) {
      speak(lang === 'en' ? currentItem.en : currentItem.bn);
    }

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      // Clear error state if we passed the delayed test
      if (errorState.active && errorState.step === 'delayed') {
        setErrorState({ active: false, step: 'model', item: LAB_ITEMS[0], trialsSinceError: 0 });
      } else if (errorState.active && errorState.step === 'lead') {
         setErrorState({ ...errorState, step: 'delayed', trialsSinceError: 0 });
      }

      setCurrentTrial(prev => prev + 1);
      if (stage === 4) {
          loadNextIntraverbal();
      } else {
          loadNextTrial();
      }
    }, 1200);
  };

  const handleIncorrect = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    if (currentItem) {
      // DTT Model Prompt
      speak(lang === 'en' ? currentItem.en : currentItem.bn);
      
      // Init error correction sequence
      setErrorState({
        active: true,
        step: 'lead',
        item: currentItem,
        trialsSinceError: 0
      });
      // Add to queue for delayed test
      if (!errorQueue.includes(currentItem.id)) {
        setErrorQueue(prev => [...prev, currentItem.id]);
      }
    }

    setTimeout(() => {
       // Re-present same trial immediately for 'Lead' step
       setPhase('trial');
    }, 1500);
  };

  // ── Render Helpers ──────────────────────────────────────────────────────

  const renderStage1 = () => (
    <>
      <Text style={s.instruction}>{lang === 'en' ? 'What is this?' : 'এটা কী?'}</Text>
      <View style={s.cardGrid}>
        {options.map((opt) => {
          const isTargetAndLead = opt.id === currentItem?.id && errorState.active && errorState.step === 'lead';
          return (
            <TouchableOpacity
              key={opt.id}
              style={[s.optionCard, isTargetAndLead && s.optionCardHint]}
              onPress={() => handleStage1Or3Select(opt.id)}
            >
              <Text style={s.optionEmoji}>{opt.emoji}</Text>
              <Text style={s.optionLabel}>{lang === 'en' ? opt.en : opt.bn}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderStage2 = () => (
    <>
      <Text style={s.instruction}>{lang === 'en' ? 'Build the sentence' : 'বাক্য তৈরি করো'}</Text>
      <View style={s.sentenceBar}>
        {sentence.length === 0 ? (
          <Text style={s.placeholderText}>Tap words below...</Text>
        ) : (
          sentence.map((w, i) => <Text key={i} style={s.sentenceWord}>{w} </Text>)
        )}
      </View>
      <View style={s.chipContainer}>
        {chips.map((chip, i) => (
          <TouchableOpacity
            key={i}
            style={[s.chip, sentence.includes(chip) && s.chipUsed]}
            onPress={() => !sentence.includes(chip) && setSentence(prev => [...prev, chip])}
          >
            <Text style={s.chipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {sentence.length > 0 && (
        <View style={s.actionRow}>
          <TouchableOpacity style={s.clearBtn} onPress={() => setSentence([])}>
             <Text style={s.clearBtnTxt}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.checkBtn} onPress={handleStage2Check}>
             <Text style={s.checkBtnTxt}>Check ✓</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderStage3 = () => (
    <>
      <View style={s.receptiveBox}>
        <Text style={s.receptiveIcon}>👂</Text>
        <Text style={s.receptiveText}>
          {lang === 'en' ? `Touch the ${currentItem?.en}` : `${currentItem?.bn} স্পর্শ করো`}
        </Text>
      </View>
      <TouchableOpacity 
         style={s.playAudioBtn}
         onPress={() => speak(lang === 'en' ? `Touch the ${currentItem?.en}` : `${currentItem?.bn} স্পর্শ করো`)}>
         <Text style={s.playAudioTxt}>🔊 Play Audio</Text>
      </TouchableOpacity>
      
      {/* For MVP digital testing, we still show cards, but clinically this is physical */}
      <View style={s.cardGrid}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={s.optionCard}
            onPress={() => handleStage1Or3Select(opt.id)}
          >
            <Text style={s.optionEmoji}>{opt.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
  
  const renderStage4 = () => (
      <>
        <View style={s.receptiveBox}>
          <Text style={s.receptiveIcon}>💬</Text>
          <Text style={s.receptiveText}>
            {lang === 'en' ? intraverbalPrompt?.prompt_en : intraverbalPrompt?.prompt_bn}
          </Text>
        </View>
        <TouchableOpacity 
           style={s.playAudioBtn}
           onPress={() => speak(lang === 'en' ? intraverbalPrompt?.prompt_en || '' : intraverbalPrompt?.prompt_bn || '')}>
           <Text style={s.playAudioTxt}>🔊 Play Audio</Text>
        </TouchableOpacity>
        
        <View style={s.cardGrid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={s.optionCard}
              onPress={() => handleStage4Select(opt.id)}
            >
              <Text style={s.optionEmoji}>{opt.emoji}</Text>
              <Text style={s.optionLabel}>{lang === 'en' ? opt.en : opt.bn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );

  // ── Screens ─────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <View style={s.setup}>
        <Text style={s.h1}>Label Lab 🔬</Text>
        <Text style={s.sub}>Clinical ABA Protocol</Text>
        
        <View style={s.langRow}>
          <TouchableOpacity style={[s.langBtn, lang === 'en' && s.langActive]} onPress={() => setLang('en')}>
             <Text style={[s.langTxt, lang === 'en' && s.langTxtActive]}>🇬🇧 EN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.langBtn, lang === 'bn' && s.langActive]} onPress={() => setLang('bn')}>
             <Text style={[s.langTxt, lang === 'bn' && s.langTxtActive]}>🇧🇩 BN</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLbl}>Select Stage</Text>
        <TouchableOpacity style={s.stageCard} onPress={() => startGame(1, 10)}>
          <Text style={s.stageIcon}>👁️</Text>
          <View style={{flex: 1}}>
            <Text style={s.stageTitle}>Stage 1: Tacting</Text>
            <Text style={s.stageDesc}>"What is this?" (Expressive Labeling)</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.stageCard} onPress={() => startGame(2, 10)}>
          <Text style={s.stageIcon}>🧩</Text>
          <View style={{flex: 1}}>
            <Text style={s.stageTitle}>Stage 2: Syntax</Text>
            <Text style={s.stageDesc}>Build multi-word descriptors</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.stageCard} onPress={() => startGame(3, 10)}>
          <Text style={s.stageIcon}>👂</Text>
          <View style={{flex: 1}}>
            <Text style={s.stageTitle}>Stage 3: Receptive</Text>
            <Text style={s.stageDesc}>"Touch the [item]"</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.stageCard} onPress={() => startGame(4, 10)}>
          <Text style={s.stageIcon}>💬</Text>
          <View style={{flex: 1}}>
            <Text style={s.stageTitle}>Stage 4: Intraverbal</Text>
            <Text style={s.stageDesc}>"You eat with a..."</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'summary') {
    const stats = computeSessionStats(trialLog, masteryMap, stage, startTime);
    return (
      <ScrollView contentContainerStyle={s.summary}>
        <Text style={s.h1}>Session Complete</Text>
        <View style={[s.scoreCircle, { borderColor: stats.accuracy_percentage >= 80 ? colors.success : colors.warning }]}>
           <Text style={s.scoreNum}>{stats.accuracy_percentage}%</Text>
           <Text style={s.scoreLbl}>Independent</Text>
        </View>
        
        <View style={s.statRow}>
           <View style={s.statBox}>
              <Text style={s.statVal}>{stats.independent_correct}</Text>
              <Text style={s.statKey}>Independent</Text>
           </View>
           <View style={s.statBox}>
              <Text style={s.statVal}>{stats.prompted_correct}</Text>
              <Text style={s.statKey}>Prompted</Text>
           </View>
           <View style={s.statBox}>
              <Text style={s.statVal}>{stats.errors}</Text>
              <Text style={s.statKey}>Errors</Text>
           </View>
        </View>

        <Text style={s.sectionLbl}>Mastery Progress</Text>
        <View style={s.masteryBar}>
           <View style={[s.masteryFill, { flex: stats.mastery_progress.mastered, backgroundColor: colors.success }]} />
           <View style={[s.masteryFill, { flex: stats.mastery_progress.learning, backgroundColor: colors.warning }]} />
           <View style={[s.masteryFill, { flex: stats.mastery_progress.new_count, backgroundColor: colors.border }]} />
        </View>
        <View style={s.masteryLegend}>
           <Text style={{color: colors.successDark, fontSize: 12}}>Mastered: {stats.mastery_progress.mastered}</Text>
           <Text style={{color: colors.warning, fontSize: 12}}>Learning: {stats.mastery_progress.learning}</Text>
        </View>

        <TouchableOpacity 
           style={s.doneBtn} 
           onPress={() => onFinish({
              accuracy_percentage: stats.accuracy_percentage,
              session_duration_seconds: stats.session_duration_seconds,
              independent_correct: stats.independent_correct,
              stage: stage,
           })}>
           <Text style={s.doneTxt}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Trial & Feedback Screen ───────────────────────────────────────────────

  return (
    <View style={s.game}>
      {/* Header */}
      <View style={s.header}>
         <View style={s.stagePill}>
            <Text style={s.stagePillTxt}>Stage {stage}</Text>
         </View>
         <Text style={s.trialCounter}>Trial {Math.min(currentTrial, targetTrials)} / {targetTrials}</Text>
      </View>
      
      {/* Progress Bar */}
      <View style={s.pBar}>
         <View style={[s.pFill, { width: `${(Math.min(currentTrial, targetTrials) / targetTrials) * 100}%` as any }]} />
      </View>

      {/* Main Stimulus */}
      <Animated.View style={[s.stimulusFrame, { transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }]}>
         <Text style={s.stimulusEmoji}>{currentItem?.emoji}</Text>
      </Animated.View>

      {/* Dynamic Stage Content */}
      <View style={s.stageContent}>
         {stage === 1 && renderStage1()}
         {stage === 2 && renderStage2()}
         {stage === 3 && renderStage3()}
         {stage === 4 && renderStage4()}
      </View>
      
      {/* Error Correction Indicator */}
      {errorState.active && errorState.step === 'lead' && (
         <View style={s.errorPill}>
            <Text style={s.errorTxt}>Prompt: Model → Lead</Text>
         </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  setup: { flex: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60 },
  h1: { fontSize: 28, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  sub: { fontSize: 15, color: colors.primary, fontFamily: 'Inter', fontWeight: '600', marginBottom: 24 },
  langRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  langBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  langActive: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  langTxt: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  langTxtActive: { color: colors.primary },
  sectionLbl: { fontSize: 16, fontWeight: '700', color: colors.textDark, marginBottom: 16, fontFamily: 'Poppins' },
  stageCard: { flexDirection: 'row', backgroundColor: colors.white, padding: 16, borderRadius: radius.lg, marginBottom: 12, alignItems: 'center', ...shadow.sm },
  stageIcon: { fontSize: 32, marginRight: 16 },
  stageTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  stageDesc: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter', marginTop: 4 },

  game: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 12 },
  stagePill: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  stagePillTxt: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  trialCounter: { fontSize: 16, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  pBar: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 30 },
  pFill: { height: '100%', backgroundColor: colors.primary },

  stimulusFrame: { width: width * 0.5, height: width * 0.5, backgroundColor: colors.white, borderRadius: radius.xl, justifyContent: 'center', alignItems: 'center', ...shadow.md, borderWidth: 1, borderColor: colors.border },
  stimulusEmoji: { fontSize: 80 },

  stageContent: { width: '100%', flex: 1, marginTop: 30 },
  instruction: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center', marginBottom: 20, fontFamily: 'Poppins' },
  
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  optionCard: { width: (width - 52) / 2, backgroundColor: colors.white, paddingVertical: 20, borderRadius: radius.lg, alignItems: 'center', borderWidth: 2, borderColor: colors.border, ...shadow.sm },
  optionCardHint: { borderColor: colors.warning, backgroundColor: colors.warningLight },
  optionEmoji: { fontSize: 40, marginBottom: 8 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Inter' },

  sentenceBar: { width: '100%', minHeight: 60, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 12, marginBottom: 20 },
  placeholderText: { color: colors.textMuted, fontStyle: 'italic', fontSize: 15 },
  sentenceWord: { fontSize: 18, fontWeight: '700', color: colors.primary },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: { backgroundColor: colors.secondaryLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.secondary },
  chipUsed: { opacity: 0.3 },
  chipText: { fontSize: 16, fontWeight: '600', color: colors.secondary },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20 },
  clearBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: colors.surfaceAlt },
  clearBtnTxt: { color: colors.textDark, fontWeight: '600', fontSize: 15 },
  checkBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: colors.primary },
  checkBtnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },

  receptiveBox: { backgroundColor: colors.white, padding: 24, borderRadius: radius.lg, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  receptiveIcon: { fontSize: 48, marginBottom: 12 },
  receptiveText: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  playAudioBtn: { backgroundColor: colors.primaryLight, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, alignSelf: 'center', marginBottom: 30 },
  playAudioTxt: { color: colors.primary, fontWeight: '700', fontSize: 15 },

  errorPill: { position: 'absolute', bottom: 40, backgroundColor: (colors as any).warningDark || '#B45309', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  errorTxt: { color: colors.white, fontWeight: '700', fontSize: 13 },

  summary: { flexGrow: 1, backgroundColor: colors.cream, padding: 24, paddingTop: 60, alignItems: 'center' },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  scoreNum: { fontSize: 36, fontWeight: '800', color: colors.textDark },
  scoreLbl: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  statBox: { backgroundColor: colors.white, padding: 16, borderRadius: radius.md, alignItems: 'center', flex: 1, marginHorizontal: 4, ...shadow.sm },
  statVal: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statKey: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  masteryBar: { flexDirection: 'row', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  masteryFill: { height: '100%' },
  masteryLegend: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  doneBtn: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30, width: '100%', alignItems: 'center' },
  doneTxt: { color: colors.white, fontWeight: '800', fontSize: 18 },
});
