import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuthStore, useUIStore, useChildStore, useGameStore } from './src/store/store';
import { colors, radius, shadow } from './src/utils/colors';
import { initDatabase } from './src/data/database';
import { registerBackgroundSync } from './src/data/syncEngine';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { typography } from './src/utils/typography';

ExpoSplashScreen.preventAutoHideAsync();

// Auth Screens
import AuthSplashScreen from './src/screens/auth/SplashScreen';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import RoleSelectScreen from './src/screens/auth/RoleSelectScreen';
import SpecialistSignUpScreen from './src/screens/auth/SpecialistSignUpScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Onboarding
import ParentOnboardingScreen from './src/screens/onboarding/ParentOnboardingScreen';

// Parent Screens
import ParentHomeScreen from './src/screens/parent/ParentHomeScreen';
import GamesGalleryScreen from './src/screens/parent/GamesGalleryScreen';
import GameRunnerScreen from './src/screens/parent/GameRunnerScreen';
import ReportsScreen from './src/screens/parent/ReportsScreen';
import StoreScreen from './src/screens/parent/StoreScreen';
import SubscriptionUpgradeScreen from './src/screens/parent/SubscriptionUpgradeScreen';
import ProfileScreen from './src/screens/parent/ProfileScreen';
import AIInsightsScreen from './src/screens/parent/AIInsightsScreen';

// Screener
import AutismScreenerScreen from './src/screens/screener/AutismScreenerScreen';
import ScreenerResultsScreen from './src/screens/screener/ScreenerResultsScreen';
import AIScreeningScreen from './src/screens/screener/AIScreeningScreen';
import CSBSScreenerScreen from './src/screens/screener/CSBSScreenerScreen';
import QChatScreenerScreen from './src/screens/screener/QChatScreenerScreen';
import CastScreenerScreen from './src/screens/screener/CastScreenerScreen';
import OlderChildInfoScreen from './src/screens/screener/OlderChildInfoScreen';
import OlderChildArticleScreen from './src/screens/screener/OlderChildArticleScreen';

// Specialist Screens
import SpecialistDashboardScreen from './src/screens/specialist/SpecialistDashboardScreen';
import TelehealthSessionScreen from './src/screens/specialist/TelehealthSessionScreen';
import SoapNoteGeneratorScreen from './src/screens/specialist/SoapNoteGeneratorScreen';

// Caregiver
import CaregiverHomeScreen from './src/screens/caregiver/CaregiverHomeScreen';

// Telehealth
import TelehealthBookingScreen from './src/screens/telehealth/TelehealthBookingScreen';

import { ChildProfileGate } from './src/components/ChildProfileGate';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false, animationEnabled: true };

// ─── Auth Stack (unauthenticated users) ────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Splash" component={AuthSplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="SpecialistSignUp" component={SpecialistSignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ─── Onboarding Stack (new parents only) ───────────────────────────────────────
function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, gestureEnabled: false }}>
      <Stack.Screen name="ParentOnboarding" component={ParentOnboardingScreen} />
    </Stack.Navigator>
  );
}

// ─── Floating tab bar ─────────────────────────────────────────────────────────
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { user } = useAuthStore();
  const tier = user?.tier_level || 'FREE';
  const isFree = tier === 'FREE';

  const getIcon = (routeName: string, focused: boolean): string => {
    if (routeName === 'Home') return focused ? 'home' : 'home-outline';
    if (routeName === 'Games') return focused ? 'gamepad-variant' : 'gamepad-variant-outline';
    if (routeName === 'Reports') return isFree ? 'lock-outline' : 'chart-line';
    if (routeName === 'Store') return focused ? 'tag' : 'tag-outline';
    if (routeName === 'Insights') return 'brain';
    if (routeName === 'Profile') return focused ? 'account-circle' : 'account-circle-outline';
    return 'home-outline';
  };

  const isLocked = (routeName: string) => isFree && routeName === 'Reports';

  return (
    <View pointerEvents="box-none" style={tabStyles.wrapper}>
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;
          const locked = isLocked(route.name);
          const iconName = getIcon(route.name, isFocused);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={`${label} tab`}
              onPress={onPress}
              activeOpacity={0.85}
              style={[tabStyles.tab, isFocused && tabStyles.tabActive]}
            >
              <MaterialCommunityIcons
                name={iconName as any}
                size={22}
                color={locked ? colors.darkGrey : isFocused ? colors.white : colors.textBody}
              />
              {isFocused && (
                <Text style={tabStyles.tabLabel} numberOfLines={1}>{label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'ios' ? 28 : 18,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    gap: 6,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: colors.primary,
    ...shadow.primary,
  },
  tabLabel: {
    ...typography.badge,
    color: colors.white,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
});

// ─── Parent Tabs ───────────────────────────────────────────────────────────────
function ParentTabs() {
  const { user } = useAuthStore();
  const tier = user?.tier_level || 'FREE';
  const isPremium = tier === 'PREMIUM';

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={ParentHomeScreen} />
      <Tab.Screen name="Games" component={GamesGalleryScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
      {isPremium && (
        <Tab.Screen name="Insights" component={AIInsightsScreen} options={{ tabBarLabel: 'AI' }} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Parent Stack ──────────────────────────────────────────────────────────────
function ParentStack() {
  return (
    <>
      <ChildProfileGate />
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ParentTabs" component={ParentTabs} />
        <Stack.Screen name="GameRunner" component={GameRunnerScreen} />
        <Stack.Screen name="AutismScreener" component={AutismScreenerScreen} />
  <Stack.Screen name="CSBSScreener" component={CSBSScreenerScreen} />
  <Stack.Screen name="QChatScreener" component={QChatScreenerScreen} />
  <Stack.Screen name="CastScreener" component={CastScreenerScreen} />
  <Stack.Screen name="OlderChildInfo" component={OlderChildInfoScreen} />
  <Stack.Screen name="OlderChildArticle" component={OlderChildArticleScreen} />
        <Stack.Screen name="ScreenerResults" component={ScreenerResultsScreen} />
        <Stack.Screen name="AIScreening" component={AIScreeningScreen} />
        <Stack.Screen name="SubscriptionUpgrade" component={SubscriptionUpgradeScreen} />
        <Stack.Screen name="TelehealthBooking" component={TelehealthBookingScreen} />
      </Stack.Navigator>
    </>
  );
}

// ─── Specialist Stack ─────────────────────────────────────────────────────────
// No separate specialist login — unified Supabase auth handles it.
// Role === 'SPECIALIST' routes here directly after login.
function SpecialistStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SpecialistDashboard" component={SpecialistDashboardScreen} />
      <Stack.Screen name="TelehealthSession" component={TelehealthSessionScreen} />
      <Stack.Screen name="SoapNoteGenerator" component={SoapNoteGeneratorScreen} />
    </Stack.Navigator>
  );
}

// ─── Caregiver Stack ──────────────────────────────────────────────────────────
function CaregiverStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="CaregiverHome" component={CaregiverHomeScreen} />
      <Stack.Screen name="GameRunner" component={GameRunnerScreen} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────────────────
function RootNavigator() {
  const { user } = useAuthStore();
  const { onboardingComplete } = useUIStore();

  if (!user) return <AuthStack />;

  if (user.role === 'SPECIALIST') return <SpecialistStack />;
  if (user.role === 'CAREGIVER') return <CaregiverStack />;

  // PARENT: require onboarding before home
  if (!onboardingComplete) return <OnboardingStack />;

  return <ParentStack />;
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const { hydrateLocale, hydrateOnboardingStatus } = useUIStore();

  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Poppins': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
  });

  useEffect(() => {
    const init = async () => {
      try {
        await useAuthStore.getState().initializeAuth();
        await hydrateOnboardingStatus();
        hydrateLocale();
        await initDatabase();
        registerBackgroundSync().catch(console.error);

        const user = useAuthStore.getState().user;
        if (user) {
          await useChildStore.getState().hydrateChildren(user.id);
          const children = useChildStore.getState().children;
          if (children.length > 0) {
            await useGameStore.getState().hydrateGames();
          }
        }
      } catch (e) {
        console.error('Init error', e);
      } finally {
        if (fontsLoaded) {
          await ExpoSplashScreen.hideAsync();
        }
      }
    };

    if (fontsLoaded) {
      init();
    }
  }, [fontsLoaded, hydrateLocale, hydrateOnboardingStatus]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
