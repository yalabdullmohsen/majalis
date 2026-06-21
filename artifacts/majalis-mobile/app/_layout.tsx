import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import type { Subscription } from "expo-notifications";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

// Configure how incoming notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Navigate to the correct screen based on notification data payload */
function handleNotificationNavigation(
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as
    | { screen?: string; id?: string }
    | undefined;

  if (!data) return;

  const { screen, id } = data;

  if (screen === "sheikh" && id) {
    router.push(`/sheikh/${id}` as any);
  } else if (screen === "lessons") {
    router.push("/(tabs)/lessons" as any);
  } else if (screen === "fawaid") {
    router.push("/(tabs)/fawaid" as any);
  }
}

/** Request permission and register the Expo push token with the API server */
async function registerForPushNotifications(userId?: string): Promise<void> {
  if (Platform.OS === "web") return;
  if (!API_BASE) return;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const platform: "ios" | "android" = Platform.OS === "ios" ? "ios" : "android";

    await fetch(`${API_BASE}/api/notifications/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenData.data,
        platform,
        ...(userId ? { userId } : {}),
      }),
    });
  } catch {
    // Push notifications are a best-effort enhancement — never crash the app
  }
}

function RootLayoutNav() {
  const colors = useColors();
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  useEffect(() => {
    // Request permission and register push token on first load
    registerForPushNotifications();

    // Foreground notification listener (already shown via setNotificationHandler)
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});

    // Tap handler — navigate to the correct screen
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationNavigation,
      );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.foreground,
          fontFamily: "Inter_700Bold",
        },
        headerBackTitle: "رجوع",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="sheikh/[id]"
        options={{ title: "الشيخ", headerShown: true }}
      />
      <Stack.Screen
        name="library/index"
        options={{ title: "المكتبة العلمية", headerShown: true }}
      />
      <Stack.Screen
        name="miracles/index"
        options={{ title: "الإعجاز العلمي", headerShown: true }}
      />
      <Stack.Screen
        name="qa/index"
        options={{ title: "الأسئلة والأجوبة", headerShown: true }}
      />
      <Stack.Screen
        name="admin"
        options={{ title: "لوحة الإشراف", headerShown: true }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
