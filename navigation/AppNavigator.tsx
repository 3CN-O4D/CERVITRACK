import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import ConsentScreen from '../screens/ConsentScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import MyHealthScreen from '../screens/MyHealthScreen';
import ScanScreen from '../screens/ScanScreen';
import MessagesScreen, { ChatDetail } from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LibraryScreen from '../screens/LibraryScreen';
import VaccineScreen from '../screens/VaccineScreen';
import SelfSamplingScreen from '../screens/SelfSamplingScreen';
import ScreeningScreen from '../screens/ScreeningScreen';
import LabResultsScreen from '../screens/LabResultsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import AppointmentBookingScreen from '../screens/AppointmentBookingScreen';
import ScreeningInfoScreen from '../screens/ScreeningInfoScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MsgStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackScreen() {
  const { colors, isDark } = useTheme();
  return (
    <HomeStack.Navigator
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="HealthLibrary"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Vaccines"
        component={VaccineScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="SelfSampling"
        component={SelfSamplingScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="RiskAssessment"
        component={ScreeningScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="LabResults"
        component={LabResultsScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="AppointmentBooking"
        component={AppointmentBookingScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ScreeningInfo"
        component={ScreeningInfoScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackScreen() {
  const { colors, isDark } = useTheme();
  return (
    <ProfileStack.Navigator
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

function MessagesStackScreen() {
  const { colors, isDark } = useTheme();
  return (
    <MsgStack.Navigator
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <MsgStack.Screen
        name="MessagesList"
        component={MessagesScreen}
        options={{ headerShown: false }}
      />
      <MsgStack.Screen
        name="ChatDetail"
        component={ChatDetail}
        options={{ headerShown: false }}
      />
    </MsgStack.Navigator>
  );
}

function AuthStack() {
  const { colors, isDark } = useTheme();
  return (
    <Stack.Navigator
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="AuthMain"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyHealth"
        component={MyHealthScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'heart-plus' : 'heart-plus-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStackScreen}
        options={{
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, consentAccepted, acceptConsent } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  if (!consentAccepted) {
    return <ConsentScreen onAccept={acceptConsent} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
