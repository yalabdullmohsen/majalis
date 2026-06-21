import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getLessons } from "@/lib/supabase";

const CATEGORIES = ["الكل", "فقه", "عقيدة", "تفسير", "حديث", "سيرة", "تزكية", "أخرى"];
const CITIES = ["كل المحافظات", "العاصمة", "حولي", "الفروانية", "الجهراء", "الأحمدي", "مبارك الكبير"];

export default function LessonsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [city, setCity] = useState("كل المحافظات");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lessons", category, city, search],
    queryFn: () => getLessons({ category, city, search }),
  });

  const lessons = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Platform.OS === "web" ? 67 : 0 }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث عن درس..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.pill,
              {
                backgroundColor: category === c ? colors.primary : colors.card,
                borderColor: category === c ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.pillText, { color: category === c ? "#FFF" : colors.foreground }]}>
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* City pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={{ flexGrow: 0 }}
      >
        {CITIES.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.pill,
              {
                backgroundColor: city === c ? colors.brass : colors.card,
                borderColor: city === c ? colors.brass : colors.border,
              },
            ]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.pillText, { color: city === c ? "#FFF" : colors.foreground }]}>
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا توجد دروس تطابق البحث
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{item.category}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
              </View>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.city}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="business-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.mosque || "—"}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.sheikhs?.name || "—"}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  pillsRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: "row-reverse",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontWeight: "600" },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: { gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", textAlign: "right", fontFamily: "Inter_700Bold" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "flex-end",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  cardMeta: { gap: 5 },
  metaItem: { flexDirection: "row-reverse", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
