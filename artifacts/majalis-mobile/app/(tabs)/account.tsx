import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { signIn, signUp } from "@/lib/supabase";

type Mode = "login" | "register";

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email.trim(), password.trim());
        if (error) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        if (!fullName.trim()) {
          Alert.alert("خطأ", "يرجى إدخال الاسم الكامل");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email.trim(), password.trim(), fullName.trim());
        if (error) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("تم التسجيل", "تم إنشاء حسابك بنجاح");
      }
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Platform.OS === "web" ? 67 + 24 : 24 }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.email, { color: colors.foreground }]}>{user.email}</Text>
          <Text style={[styles.memberLabel, { color: colors.mutedForeground }]}>عضو في مجالس</Text>
        </View>

        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable style={[styles.menuItem, { borderColor: colors.border }]}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.foreground }]}>دروسي المسجلة</Text>
              <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderTopWidth: 1, borderColor: colors.border }]}
              onPress={() => router.push("/admin" as any)}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.brass} />
              <Text style={[styles.menuText, { color: colors.foreground }]}>لوحة الإشراف</Text>
              <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderTopWidth: 1, borderColor: colors.border }]}
              onPress={async () => {
                await signOut();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
              <Text style={[styles.menuText, { color: colors.destructive }]}>تسجيل الخروج</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 24, paddingTop: Platform.OS === "web" ? 67 + 24 : 24, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.titleArea}>
        <Ionicons name="book" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {mode === "login"
            ? "ادخل للوصول إلى الدروس والمحتوى الكامل"
            : "أنشئ حساباً جديداً للانضمام إلى مجالس"}
        </Text>
      </View>

      <View style={styles.form}>
        {mode === "register" && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>الاسم الكامل</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="أدخل اسمك الكامل"
              placeholderTextColor={colors.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
              textAlign="right"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>البريد الإلكتروني</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="example@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>كلمة المرور</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />
        </View>

        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {mode === "login" ? "دخول" : "إنشاء حساب"}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.switchMode}
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
            {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
            <Text style={[styles.switchLink, { color: colors.primary }]}>
              {mode === "login" ? "أنشئ حساباً" : "سجل الدخول"}
            </Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleArea: { alignItems: "center", gap: 10, marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "800", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", textAlign: "right" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  switchMode: { alignItems: "center", paddingVertical: 8 },
  switchText: { fontSize: 14 },
  switchLink: { fontWeight: "700" },
  profileCard: {
    marginHorizontal: 20,
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  email: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  memberLabel: { fontSize: 14 },
  section: { paddingHorizontal: 20 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuText: { flex: 1, fontSize: 16, textAlign: "right" },
});
