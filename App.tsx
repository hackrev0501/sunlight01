// App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GLASS_HEIGHT = SCREEN_H * 0.45;

const FACTS_POOL = [
  'Short daily sun exposure helps your body produce Vitamin D for bones and immunity.',
  'Morning sunlight helps set your circadian rhythm and can improve sleep.',
  'Sunlight increases serotonin — it can lift mood and energy.',
  'Getting sun safely supports bone health and muscle function.',
  'Small regular exposures are usually better than rare long ones.',
  'Vitamin D plays a role in immune resilience and overall well-being.',
];

const SKIN_COLORS = ['#fff5e6', '#f6d3b0', '#e6b07a', '#c0763f', '#7f4a2b', '#3b1f0c'];

type Screen = 'intro' | 'onboard' | 'main';
type ChatMsg = { id: string; sender: 'user' | 'ai'; text: string };

export default function App(): JSX.Element {
  // ---------------- screens ----------------
  const [screen, setScreen] = useState<Screen>('intro');

  // ---------------- intro animations (sun feel) ----------------
  const sunScale = useRef(new Animated.Value(0.6)).current;
  const sunGlow = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(1)).current;

  const facts = useMemo(() => {
    const arr = [...FACTS_POOL];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
  }, []);

  useEffect(() => {
    // pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunScale, { toValue: 0.64, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sunScale, { toValue: 0.6, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunGlow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sunGlow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // engulf -> onboarding
    const t = setTimeout(() => {
      sunScale.stopAnimation();
      sunGlow.stopAnimation();

      Animated.parallel([
        Animated.timing(sunScale, { toValue: 18, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(introOpacity, { toValue: 0, duration: 700, easing: Easing.linear, useNativeDriver: true }),
      ]).start(() => {
        setScreen('onboard');
      });
    }, 1600);

    return () => clearTimeout(t);
  }, [sunGlow, sunScale, introOpacity]);

  // ---------------- onboarding animated pieces (screen-2) ----------------
  const titleAnim = useRef(new Animated.Value(0)).current;
  const paletteAnim = useRef(new Animated.Value(0)).current;
  const helperAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const yesBlockAnim = useRef(new Animated.Value(0)).current;
  const guessAnimsRef = useRef<Animated.Value[]>([]);
  if (guessAnimsRef.current.length === 0) {
    guessAnimsRef.current = Array.from({ length: 5 }, () => new Animated.Value(0));
  }

  const [selectedSkinIndex, setSelectedSkinIndex] = useState<number | null>(null);
  const [isGuessMode, setIsGuessMode] = useState(false);
  const [enteredDValue, setEnteredDValue] = useState<string>('');
  const [enteredUnit, setEnteredUnit] = useState<'ng/mL' | 'nmol/L'>('ng/mL');
  const [lifestyleAnswers, setLifestyleAnswers] = useState({
    freqOutPerWeek: '',
    minutesPerDay: '',
    clothing: '',
    diet: '',
    freeText: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem('@skinIndex');
        if (s !== null) setSelectedSkinIndex(Number(s));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (screen === 'onboard') {
      // reset
      [titleAnim, paletteAnim, helperAnim, buttonsAnim, yesBlockAnim].forEach((a) => a.setValue(0));
      guessAnimsRef.current.forEach((a) => a.setValue(0));
      setIsGuessMode(false);

      Animated.sequence([
        Animated.timing(titleAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.stagger(160, [
          Animated.timing(paletteAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(helperAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(buttonsAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(yesBlockAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [screen, titleAnim, paletteAnim, helperAnim, buttonsAnim, yesBlockAnim]);

  async function selectSkin(i: number) {
    setSelectedSkinIndex(i);
    await AsyncStorage.setItem('@skinIndex', String(i));
  }

  function handleYesTest() {
    setIsGuessMode(false);
    Animated.timing(yesBlockAnim, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();
  }
  function handleGuessFlow() {
    setIsGuessMode(true);
    Animated.stagger(
      180,
      guessAnimsRef.current.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.quad) })
      )
    ).start();
  }

  async function handleSaveDValue() {
    const v = Number(enteredDValue);
    if (isNaN(v) || v <= 0) {
      Alert.alert('Invalid value', 'Please enter a numeric vitamin D value.');
      return;
    }
    await AsyncStorage.setItem('@serumD', JSON.stringify({ value: v, unit: enteredUnit }));
    setScreen('main');
  }

  async function handleSubmitGuess() {
    await AsyncStorage.setItem('@guessAnswers', JSON.stringify(lifestyleAnswers));
    const est = estimateDFromAnswers(lifestyleAnswers, selectedSkinIndex);
    await AsyncStorage.setItem('@estimatedD', JSON.stringify({ value: est, unit: 'ng/mL' }));
    setScreen('main');
  }

  // ---------------- main screen (battery + chat slide) ----------------
  const [dValue, setDValue] = useState<number | null>(null); // ng/mL
  const batteryAnim = useRef(new Animated.Value(0)).current; // 0..1
  const [isFilling, setIsFilling] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // battery & chat slide positions
  const batterySlide = useRef(new Animated.Value(0)).current; // 0 -> -SCREEN_W*0.8
  const chatTranslate = useRef(new Animated.Value(SCREEN_W)).current; // SCREEN_W -> 0

  // chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const listRef = useRef<FlatList<ChatMsg>>(null);

  useEffect(() => {
    (async () => {
      const serum = await AsyncStorage.getItem('@serumD');
      const est = await AsyncStorage.getItem('@estimatedD');
      if (serum) {
        const s = JSON.parse(serum);
        setDValue(s.value);
        animateBatteryFromD(s.value);
      } else if (est) {
        const e = JSON.parse(est);
        setDValue(e.value);
        animateBatteryFromD(e.value);
      } else {
        setDValue(null);
        batteryAnim.setValue(0.2);
      }
    })();
  }, [screen]);

  function animateBatteryFromD(d: number) {
    const t = Math.max(0, Math.min(1, d / 60));
    Animated.timing(batteryAnim, { toValue: t, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.quad) }).start();
  }

  function toggleSunSession() {
    if (!isFilling) {
      setIsFilling(true);
      Animated.timing(batteryAnim, {
        toValue: 1,
        duration: 1000 * 60 * 5,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start();
    } else {
      setIsFilling(false);
      batteryAnim.stopAnimation();
    }
  }

  // battery <-> chat slide (also used by "X" close)
  function toggleChat() {
    const goingOpen = !chatOpen;
    const toChat = goingOpen ? 0 : SCREEN_W; // 0 = visible, SCREEN_W = off-screen
    const toBattery = goingOpen ? -SCREEN_W * 0.8 : 0;

    Animated.parallel([
      Animated.timing(chatTranslate, { toValue: toChat, duration: 520, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(batterySlide, { toValue: toBattery, duration: 520, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setChatOpen(goingOpen);
    });
  }

  // mocked AI for prototype
  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg: ChatMsg = { id: `${Date.now()}-u`, sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Scroll after adding user msg
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    // Mock AI reply; replace with real backend later
    setTimeout(() => {
      const aiMsg: ChatMsg = {
        id: `${Date.now()}-a`,
        sender: 'ai',
        text:
          "Got it. I'll adjust your estimate. (Prototype reply — connect backend next.)",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 30);
    }, 600);
  }

  // ---------------- helpers ----------------
  function estimateDFromAnswers(
    answers: { freqOutPerWeek: string; minutesPerDay: string; clothing: string; diet: string },
    skinIndex: number | null
  ) {
    const freq = Number(answers.freqOutPerWeek) || 3;
    const mins = Number(answers.minutesPerDay) || 20;
    const clothingFactor = answers.clothing && answers.clothing.toLowerCase().includes('heavy') ? 0.4 : 0.85;
    const dietFactor = answers.diet && answers.diet.toLowerCase().includes('vegan') ? 0.8 : 1.0;
    const skinFactor = 1 - (skinIndex ?? 2) * 0.08;
    const score = freq * mins * clothingFactor * dietFactor * skinFactor;
    const est = Math.max(5, Math.min(60, Math.round(score / 6 + 10)));
    return est;
  }

  // ---------------- render ----------------
  // Intro
  if (screen === 'intro') {
    const scale = sunScale;
    const glow = sunGlow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
    const opacity = introOpacity;
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <StatusBar hidden />
        <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={200} height={200} viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id="g" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFF7C2" stopOpacity="1" />
                <Stop offset="40%" stopColor="#FFD84A" stopOpacity="1" />
                <Stop offset="100%" stopColor="#FFB400" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Circle cx="100" cy="100" r="60" fill="url(#g)" />
          </Svg>
          <Animated.Text style={[styles.introTitle, { marginTop: 18, transform: [{ scale: glow }] }]}>
            Welcome to the Sun App
          </Animated.Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Onboarding / Screen 2
  if (screen === 'onboard') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFF9EA' }]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.onboardContainer}>
          {/* Title */}
          <Animated.View
            style={{
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.h1}>Choose your skin type</Text>
          </Animated.View>

          {/* Palette */}
          <Animated.View
            style={{
              opacity: paletteAnim,
              transform: [{ translateY: paletteAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              marginTop: 16,
            }}
          >
            <View style={styles.paletteRowCentered}>
              {SKIN_COLORS.map((c, i) => {
                const selected = selectedSkinIndex === i;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => selectSkin(i)}
                    activeOpacity={0.85}
                    style={[
                      styles.swatch,
                      { backgroundColor: c, borderColor: selected ? '#ffd700' : '#ddd', borderWidth: selected ? 3 : 1 },
                    ]}
                  >
                    <Text style={[styles.swatchLabel, { color: i < 2 ? '#000' : '#fff' }]}>{i + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Helper */}
          <Animated.View
            style={{
              opacity: helperAnim,
              transform: [{ translateY: helperAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              marginTop: 28,
              alignItems: 'center',
            }}
          >
            <Text style={styles.h1}>Did you get your vit-D tested recently?</Text>
            <Text style={styles.helper}>If not, we can guess it for you.</Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View
            style={{
              opacity: buttonsAnim,
              transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              marginTop: 18,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity style={[styles.primaryBtn, { marginRight: 12 }]} onPress={handleYesTest}>
              <Text style={styles.primaryBtnText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={handleGuessFlow}>
              <Text style={styles.ghostBtnText}>Guess</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Yes input block */}
          {!isGuessMode && (
            <Animated.View
              style={{
                opacity: yesBlockAnim,
                transform: [{ translateY: yesBlockAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                width: '90%',
                marginTop: 20,
                alignSelf: 'center',
              }}
            >
              <Text style={{ fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>Enter serum vitamin D value</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  placeholder="e.g. 24"
                  keyboardType="numeric"
                  value={enteredDValue}
                  onChangeText={setEnteredDValue}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setEnteredUnit((u) => (u === 'ng/mL' ? 'nmol/L' : 'ng/mL'))}
                  style={{ marginLeft: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}
                >
                  <Text>{enteredUnit}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveDValue}>
                  <Text style={styles.primaryBtnText}>Save & Continue</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
                  Standard vitamin D units: <Text style={{ fontWeight: '700' }}>ng/mL</Text> (common) or{' '}
                  <Text style={{ fontWeight: '700' }}>nmol/L</Text>. (1 ng/mL ≈ 2.5 nmol/L)
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Guess flow */}
          {isGuessMode && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
              <View style={{ width: '90%', marginTop: 18 }}>
                <Text style={{ fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
                  Let's guess your D-levels — quick answers
                </Text>

                {[
                  { label: '1. How frequently do you go outside in a week? (times/week)', key: 'freqOutPerWeek' },
                  { label: '2. Minutes spent in sun on a typical outing', key: 'minutesPerDay' },
                  { label: '3. What clothing do you usually wear? (light/heavy)', key: 'clothing' },
                  { label: '4. Diet (omnivore / vegetarian / vegan / other)', key: 'diet' },
                  { label: 'Optional: notes about schedule or medications', key: 'freeText' },
                ].map((q, i) => {
                  const anim = guessAnimsRef.current[i];
                  return (
                    <Animated.View
                      key={q.key}
                      style={{
                        opacity: anim,
                        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                        marginBottom: 12,
                      }}
                    >
                      <Text style={styles.q}>{q.label}</Text>
                      <TextInput
                        value={(lifestyleAnswers as any)[q.key]}
                        onChangeText={(t) =>
                          setLifestyleAnswers((s) => ({ ...s, [(q.key as keyof typeof lifestyleAnswers)]: t }))
                        }
                        style={[styles.input, q.key === 'freeText' ? { height: 80 } : {}]}
                        multiline={q.key === 'freeText'}
                        keyboardType={q.key === 'freqOutPerWeek' || q.key === 'minutesPerDay' ? 'numeric' : 'default'}
                      />
                    </Animated.View>
                  );
                })}

                <View style={{ alignItems: 'center', marginTop: 6 }}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitGuess}>
                    <Text style={styles.primaryBtnText}>Estimate & Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main screen (battery + chat sliding)
  const fillHeight = batteryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GLASS_HEIGHT * 0.1, GLASS_HEIGHT * 0.9],
  });
  const fillColor = batteryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(255,223,160)', 'rgb(255,180,0)'],
  });

  const batteryTranslateStyle = { transform: [{ translateX: batterySlide }] };
  const chatTranslateStyle = { transform: [{ translateX: chatTranslate }] };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#071717' }]}>
      <StatusBar barStyle="light-content" />
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={[styles.h1, { color: '#FFEFA8' }]}>Your Vitamin D</Text>
        <Text style={{ color: '#DAD2A7', marginTop: 6 }}>{dValue ? `Current: ${dValue} ng/mL` : 'No reading yet'}</Text>

        <View style={{ height: 32 }} />

        {/* Battery area */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={[styles.glassContainer, batteryTranslateStyle]}>
            <Animated.View style={[styles.fill, { height: fillHeight as any, backgroundColor: fillColor as any }]} />
            <View style={styles.glassOverlay}>
              <Text style={{ color: '#2b1b00', fontWeight: '700' }}>
                {dValue ? `${Math.round((dValue / 60) * 100)}%` : ''}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={toggleSunSession}>
            <Text style={styles.primaryBtnText}>{isFilling ? 'Stop Sun Session' : 'Start Sun Session'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={toggleChat}>
            <Text style={{ color: '#111', fontWeight: '700' }}>{chatOpen ? 'Close Chat' : 'Open Chat'}</Text>
          </TouchableOpacity>
        </View>

        {/* Chat panel full-height, with close X and bottom input */}
        <Animated.View style={[styles.chatPanelFull, chatTranslateStyle]}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={toggleChat} style={styles.chatCloseButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.chatCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.chatTitle}>AI Assistant</Text>
          </View>

          {/* Messages list */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input row (fixed at bottom of panel) */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputBar}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type your update..."
                placeholderTextColor="#806f35"
                multiline
                style={styles.chatInput}
              />
              <TouchableOpacity onPress={sendChat} style={styles.sendButton}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  introTitle: { fontSize: 26, fontWeight: '900', color: '#4a2f00' },

  onboardContainer: { padding: 20, alignItems: 'center', justifyContent: 'flex-start' },
  h1: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center' },
  helper: { marginTop: 6, fontSize: 15, color: '#666', textAlign: 'center' },

  paletteRowCentered: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, paddingHorizontal: 2 },
  swatch: {
    width: 62,
    height: 62,
    borderRadius: 32,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchLabel: { fontSize: 12, fontWeight: '900' },

  primaryBtn: {
    backgroundColor: '#FFD166',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  primaryBtnText: { color: '#111', fontWeight: '800' },
  ghostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  ghostBtnText: { color: '#333', fontWeight: '700' },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },

  q: { marginTop: 4, marginBottom: 6, fontWeight: '600' },

  /* battery */
  glassContainer: {
    width: SCREEN_W * 0.7,
    height: GLASS_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff7df',
    borderWidth: 2,
    borderColor: '#ffd97a',
    justifyContent: 'flex-end',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  glassOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryBtn: {
    backgroundColor: '#FFE9A6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  /* Chat full-panel */
  chatPanelFull: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: SCREEN_W * 0.8,
    height: SCREEN_H,
    backgroundColor: '#FFF4D9',
    borderLeftWidth: 1,
    borderLeftColor: '#ffe6a8',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    paddingBottom: 0, // space managed by inputBar
    flexDirection: 'column', // <-- ADD
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFE9A6',
    borderBottomWidth: 1,
    borderBottomColor: '#f6dda0',
  },
  chatCloseButton: {
    paddingRight: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  chatCloseText: { fontSize: 18, color: '#5a4a14', fontWeight: '900' },
  chatTitle: { fontSize: 16, fontWeight: '800', color: '#3b2a00' },

  messagesContainer: {
    padding: 14,
    flex: 1, 
  },
  messageBubble: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 14,
    maxWidth: '82%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD166',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEFC2',
    borderTopLeftRadius: 4,
  },
  messageText: { fontSize: 14, color: '#231a00' },

  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 60,
    backgroundColor: '#FFF7DB',
    borderTopWidth: 1,
    borderTopColor: '#f6dda0',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ead28f',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#2c1f00',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#FFD166',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  sendText: { fontWeight: '800', color: '#3b2a00' },
});
