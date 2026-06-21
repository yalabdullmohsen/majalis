import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getApprovedFawaid, getLessons, getSheikhs } from "@/lib/supabase";

const CATEGORIES = [
  { icon: "book-outline", label: "الدروس والدورات", route: "/lessons" },
  { icon: "people-outline", label: "المشايخ والدعاة", route: "/sheikhs" },
  { icon: "library-outline", label: "المكتبة العلمية", route: "/library" },
  { icon: "planet-outline", label: "الإعجاز العلمي", route: "/miracles" },
  { icon: "help-circle-outline", label: "الأسئلة والأجوبة", route: "/qa" },
  { icon: "star-outline", label: "الفوائد", route: "/fawaid" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons-home"],
    queryFn: () => getLessons(),
  });
  const { data: sheikhsData } = useQuery({
    queryKey: ["sheikhs-home"],
    queryFn: getSheikhs,
  });
  const { data: fawaidData } = useQuery({
    queryKey: ["fawaid-home"],
    queryFn: getApprovedFawaid,
  });

  const recentLessons = (lessonsData?.data || []).slice(0, 5);
  const fawaidList = (fawaidData?.data || []).slice(0, 3);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20, backgroundColor: colors.primary }]}>
        <Text style={[styles.headerSub, { color: colors.accent }]}>المنصة العلمية الشرعية</Text>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>مجالس</Text>
        <Text style={[styles.headerDesc, { color: "rgba(255,255,255,0.8)" }]}>
          الدروس والمشايخ والمكتبة في مكان واحد
        </Text>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: "#FFFFFF" }]}
          onPress={() => router.push("/lessons")}
        >
          <Text style={[styles.headerBtnText, { color: colors.primary }]}>
            استعرض الدروس
          </Text>
        </Pressable>
      </View>

      {/* Category grid */}
      <View style={styles.section}>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.label}
              style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(cat.route as any)}
            >
              <Ionicons name={cat.icon as any} size={28} color={colors.primary} />
              <Text style={[styles.categoryLabel, { color: colors.foreground }]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Recent Lessons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>آخر الدروس</Text>
          <Pressable onPress={() => router.push("/lessons")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
          </Pressable>
        </View>
        {lessonsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : recentLessons.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا توجد دروس حالياً
          </Text>
        ) : (
          recentLessons.map((lesson: any) => (
            <View
              key={lesson.id}
              style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.lessonTitle, { color: colors.foreground }]}>
                {lesson.title}
              </Text>
              <View style={styles.lessonMeta}>
                <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.lessonMetaText, { color: colors.mutedForeground }]}>
                  {lesson.sheikhs?.name || "—"}
                </Text>
                <Ionicons name="location-outline" size={13} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <Text style={[styles.lessonMetaText, { color: colors.mutedForeground }]}>
                  {lesson.city || "—"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Fawaid */}
      {fawaidList.length > 0 && (
        <View style={[styles.section, { marginBottom: 8 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الفوائد</Text>
            <Pressable onPress={() => router.push("/fawaid")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </Pressable>
          </View>
          {fawaidList.map((f: any) => (
            <View
              key={f.id}
              style={[styles.fawaidCard, { backgroundColor: colors.parchmentDeep, borderColor: colors.border, borderRightColor: colors.brass }]}
            >
              <Text style={[styles.fawaidText, { color: colors.foreground }]}>{f.text}</Text>
              {f.author_name ? (
                <Text style={[styles.fawaidAuthor, { color: colors.brass }]}>— {f.author_name}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  headerSub: { fontSize: 13, letterSpacing: 0.5, marginBottom: 6 },
  headerTitle: { fontSize: 42, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  headerDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  headerBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  headerBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  categoryLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  lessonCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  lessonTitle: { fontSize: 15, fontWeight: "600", textAlign: "right", marginBottom: 6 },
  lessonMeta: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  lessonMetaText: { fontSize: 12 },
  fawaidCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderRightWidth: 4,
    marginBottom: 8,
  },
  fawaidText: { fontSize: 15, lineHeight: 24, textAlign: "right" },
  fawaidAuthor: { fontSize: 13, textAlign: "right", marginTop: 6, fontStyle: "italic" },
  emptyText: { textAlign: "center", padding: 20, fontSize: 14 },
});
