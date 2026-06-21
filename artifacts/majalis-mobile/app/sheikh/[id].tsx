import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getSheikhById } from "@/lib/supabase";

export default function SheikhDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["sheikh", id],
    queryFn: () => getSheikhById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const { sheikh, lessons } = data || { sheikh: null, lessons: [] };

  if (!sheikh) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>الشيخ غير موجود</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40 }}
    >
      {/* Profile header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Ionicons name="person" size={52} color="#FFF" />
        </View>
        <Text style={styles.name}>{sheikh.name}</Text>
        {sheikh.specialty ? (
          <Text style={styles.specialty}>{sheikh.specialty}</Text>
        ) : null}
        {sheikh.city ? (
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.city}>{sheikh.city}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 16 }}>
        {/* Bio */}
        {sheikh.bio ? (
          <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.bioLabel, { color: colors.mutedForeground }]}>نبذة</Text>
            <Text style={[styles.bio, { color: colors.foreground }]}>{sheikh.bio}</Text>
          </View>
        ) : null}

        {/* Lessons */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          الدروس ({lessons.length})
        </Text>
        {lessons.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              لا توجد دروس
            </Text>
          </View>
        ) : (
          lessons.map((lesson: any) => (
            <View
              key={lesson.id}
              style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.lessonTitle, { color: colors.foreground }]}>
                {lesson.title}
              </Text>
              <View style={styles.lessonMeta}>
                {lesson.category ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {lesson.category}
                    </Text>
                  </View>
                ) : null}
                {lesson.city ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {lesson.city}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    padding: 28,
    alignItems: "center",
    gap: 8,
    paddingTop: 40,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  specialty: { color: "rgba(255,255,255,0.85)", fontSize: 15, textAlign: "center" },
  cityRow: { flexDirection: "row-reverse", alignItems: "center", gap: 5 },
  city: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  bioCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 6,
  },
  bioLabel: { fontSize: 12, fontWeight: "600", textAlign: "right" },
  bio: { fontSize: 15, lineHeight: 24, textAlign: "right" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 12,
  },
  lessonCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  lessonTitle: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  lessonMeta: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  metaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 24, gap: 8 },
  emptyText: { fontSize: 14 },
});
