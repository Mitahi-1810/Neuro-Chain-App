import React, { useEffect } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuthStore, useUIStore, useChildStore, useGameStore } from './src/store/store';
import { colors } from './src/utils/colors';
import { initDatabase } from './src/data/database';
import { registerBackgroundSync } from './src/data/syncEngine';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';

// Keep splash screen visible until fonts load
ExpoSplashScreen.preventAutoHideAsync();

// Auth Screens
import AuthSplashScreen from './src/screens/auth/SplashScreen';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';

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

// Specialist Screens
import SpecialistLoginScreen from './src/screens/specialist/SpecialistLoginScreen';
import SpecialistDashboardScreen from './src/screens/specialist/SpecialistDashboardScreen';
import TelehealthSessionScreen from './src/screens/specialist/TelehealthSessionScreen';
import SoapNoteGeneratorScreen from './src/screens/specialist/SoapNoteGeneratorScreen';
import CaregiverHomeScreen from './src/screens/caregiver/CaregiverHomeScreen';

// Telehealth Screens
import TelehealthBookingScreen from './src/screens/telehealth/TelehealthBookingScreen';
import { ChildProfileGate } from './src/components/ChildProfileGate';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  animationEnabled: true,
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Splash" component={AuthSplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function ParentTabs() {
  const { user } = useAuthStore();
  const tier = user?.tier_level || 'FREE';
  const isFree = tier === 'FREE';
  const isPremium = tier === 'PREMIUM';

  const handleLockedTab = () => {
    Alert.alert(
      'Upgrade Required',
      'Upgrade to Basic to unlock this section.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Games')
            iconName = isFree ? 'lock-outline' : (focused ? 'gamepad-variant' : 'gamepad-variant-outline');
          else if (route.name === 'Reports')
            iconName = isFree ? 'lock-outline' : (focused ? 'chart-line' : 'chart-line');
          else if (route.name === 'Store') iconName = focused ? 'tag' : 'tag-outline';
          else if (route.name === 'Insights') iconName = focused ? 'brain' : 'brain';
          else if (route.name === 'Profile') iconName = focused ? 'account-circle' : 'account-circle-outline';

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={24}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGrey,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          fontFamily: 'Inter',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={ParentHomeScreen} />
      <Tab.Screen
        name="Games"
        component={GamesGalleryScreen}
        options={{
          tabBarButton: (props) =>
            isFree ? (
              <TouchableOpacity
                {...props}
                onPress={handleLockedTab}
                style={props.style}
              />
            ) : (
              <TouchableOpacity {...props} style={props.style} />
            ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarButton: (props) =>
            isFree ? (
              <TouchableOpacity
                {...props}
                onPress={handleLockedTab}
                style={props.style}
              />
            ) : (
              <TouchableOpacity {...props} style={props.style} />
            ),
        }}
      />
      <Tab.Screen name="Store" component={StoreScreen} />
      {isPremium && (
        <Tab.Screen
          name="Insights"
          component={AIInsightsScreen}
          options={{ tabBarLabel: 'AI Insights' }}
        />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ParentStack() {
  return (
    <>
      <ChildProfileGate />
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ParentTabs" component={ParentTabs} />
        <Stack.Screen name="GameRunner" component={GameRunnerScreen} />
        <Stack.Screen name="AutismScreener" component={AutismScreenerScreen} />
        <Stack.Screen
          name="ScreenerResults"
          component={ScreenerResultsScreen}
        />
        <Stack.Screen
          name="SubscriptionUpgrade"
          component={SubscriptionUpgradeScreen}
        />
        <Stack.Screen
          name="TelehealthBooking"
          component={TelehealthBookingScreen}
        />
      </Stack.Navigator>
    </>
  );
}

function SpecialistStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SpecialistLogin" component={SpecialistLoginScreen} />
      <Stack.Screen
        name="SpecialistDashboard"
        component={SpecialistDashboardScreen}
      />
      <Stack.Screen name="TelehealthSession" component={TelehealthSessionScreen} />
      <Stack.Screen name="SoapNoteGenerator" component={SoapNoteGeneratorScreen} />
    </Stack.Navigator>
  );
}

function CaregiverStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="CaregiverHome" component={CaregiverHomeScreen} />
      <Stack.Screen name="GameRunner" component={GameRunnerScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuthStore();

  if (!user) {
    return <AuthStack />;
  }

  if (user.role === 'SPECIALIST') {
    return <SpecialistStack />;
  }

  if (user.role === 'CAREGIVER') {
    return <CaregiverStack />;
  }

  return <ParentStack />;
}

export default function App() {
  const { hydrateLocale } = useUIStore();

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
        hydrateLocale();
        await initDatabase();
        registerBackgroundSync().catch(console.error);

        // If user exists after auth init, hydrate their data
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
  }, [hydrateLocale, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

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
