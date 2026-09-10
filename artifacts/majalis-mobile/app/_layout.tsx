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
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

// Force RTL for Arabic — مرة واحدة عند الإقلاع
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleNotificationNavigation(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as
    | { screen?: string; id?: string }
    | undefined;

  if (!data) return;

  const { screen, id } = data;

  if (screen === "sheikh" && id) {
    router.push(`/sheikh/${id}`);
  } else if (screen === "lessons") {
    router.push("/(tabs)/lessons");
  } else if (screen === "fawaid") {
    router.push("/(tabs)/fawaid");
  } else if (screen === "library") {
    router.push("/library");
  } else if (screen === "qa") {
    router.push("/qa");
  } else if (screen === "miracles") {
    router.push("/miracles");
  }
}

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
    /* best-effort */
  }
}

function SplashController() {
  const { status } = useAuth();
  useEffect(() => {
    if (status === "initializing") return;
    void SplashScreen.hideAsync();
  }, [status]);
  return null;
}

function RootLayoutNav() {
  const colors = useColors();
  const { status, user } = useAuth();
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);
  const pushRegistered = useRef(false);

  // الإشعارات بعد استقرار الإقلاع — لا تنافس أول رسم
  useEffect(() => {
    if (status !== "ready" && status !== "error") return;
    if (pushRegistered.current) return;
    pushRegistered.current = true;

    const idle =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(() => {
            void registerForPushNotifications(user?.id);
          })
        : 0;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationNavigation(response);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationNavigation,
    );

    return () => {
      if (idle) cancelAnimationFrame(idle);
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [status, user?.id]);

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
        animation: "fade",
        animationDuration: 180,
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

function BootGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  // أبقِ الشجرة فارغة تحت الـ Splash الأصلي حتى لا تومض شاشة دخول/رئيسية خاطئة
  if (status === "initializing") return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsReady = fontsLoaded || Boolean(fontError);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SplashController />
            <BootGate>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </BootGate>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
