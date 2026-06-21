import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FawaidAdmin } from "@/components/admin/FawaidAdmin";
import { LibraryAdmin } from "@/components/admin/LibraryAdmin";
import { LessonsAdmin } from "@/components/admin/LessonsAdmin";
import { MiraclesAdmin } from "@/components/admin/MiraclesAdmin";
import { SheikhsAdmin } from "@/components/admin/SheikhsAdmin";
import { UsersAdmin } from "@/components/admin/UsersAdmin";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Section = "sheikhs" | "lessons" | "library" | "miracles" | "fawaid" | "users";

const TABS: { key: Section; label: string; icon: string }[] = [
  { key: "sheikhs",  label: "المشايخ",         icon: "person-outline" },
  { key: "lessons",  label: "الدروس",           icon: "book-outline" },
  { key: "library",  label: "المكتبة",          icon: "library-outline" },
  { key: "miracles", label: "الإعجاز",          icon: "moon-outline" },
  { key: "fawaid",   label: "الفوائد",          icon: "sparkles-outline" },
  { key: "users",    label: "المستخدمون",        icon: "people-outline" },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAdmin } = useAuth();
  const [section, setSection] = useState<Section>("sheikhs");

  if (!user || !isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32, backgroundColor: colors.background }}>
        <Ionicons name="lock-closed-outline" size={44} color={colors.mutedForeground} />
        <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: "center", lineHeight: 26 }}>
          {!user ? "يجب تسجيل الدخول للوصول إلى هذه الصفحة" : "هذه الصفحة للمشرفين فقط."}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top tab bar */}
      <View
        style={{
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
          borderBottomWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 0, flexDirection: "row-reverse" }}
        >
          {TABS.map((t) => {
            const active = section === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setSection(t.key)}
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginHorizontal: 2,
                  borderBottomWidth: 2.5,
                  borderColor: active ? colors.primary : "transparent",
                }}
              >
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? "700" : "400",
                    color: active ? colors.primary : colors.mutedForeground,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Section content */}
      <View
        style={{
          flex: 1,
          padding: 16,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
        }}
      >
        {section === "sheikhs"  && <SheikhsAdmin />}
        {section === "lessons"  && <LessonsAdmin />}
        {section === "library"  && <LibraryAdmin />}
        {section === "miracles" && <MiraclesAdmin />}
        {section === "fawaid"   && <FawaidAdmin />}
        {section === "users"    && <UsersAdmin />}
      </View>
    </View>
  );
}
