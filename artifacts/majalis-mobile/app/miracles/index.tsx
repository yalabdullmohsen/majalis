import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getMiracles } from "@/lib/supabase";

const CATEGORIES = ["الكل", "علوم", "طب", "فلك", "جيولوجيا", "أحياء", "أخرى"];
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];

export default function MiraclesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sourceType, setSourceType] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["miracles", category, sourceType],
    queryFn: () => getMiracles({ category, sourceType }),
  });

  const miracles = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillsRow, { paddingTop: Platform.OS === "web" ? 67 + 8 : 8 }]}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map((c) => {
          const val = c === "الكل" ? undefined : c;
          const active = category === val;
          return (
            <Pressable
              key={c}
              style={[
                styles.pill,
                { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
              ]}
              onPress={() => setCategory(val)}
            >
              <Text style={[styles.pillText, { color: active ? "#FFF" : colors.foreground }]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={{ flexGrow: 0 }}
      >
        {SOURCE_TYPES.map((s) => {
          const val = s === "الكل" ? undefined : s;
          const active = sourceType === val;
          return (
            <Pressable
              key={s}
              style={[
                styles.pill,
                { backgroundColor: active ? colors.brass : colors.card, borderColor: active ? colors.brass : colors.border },
              ]}
              onPress={() => setSourceType(val)}
            >
              <Text style={[styles.pillText, { color: active ? "#FFF" : colors.foreground }]}>{s}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={miracles}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="planet-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا يوجد محتوى حالياً
              </Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => item.source_url && Linking.openURL(item.source_url).catch(() => {})}
            >
              <View style={styles.cardTop}>
                {item.source_type ? (
                  <View style={[styles.sourceBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.sourceBadgeText}>{item.source_type}</Text>
                  </View>
                ) : null}
                {item.category ? (
                  <View style={[styles.categoryBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                      {item.category}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
              {item.summary ? (
                <Text style={[styles.summary, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {item.summary}
                </Text>
              ) : null}
              {item.source_url ? (
                <View style={styles.readMore}>
                  <Text style={[styles.readMoreText, { color: colors.primary }]}>اقرأ المزيد</Text>
                  <Ionicons name="arrow-back-outline" size={14} color={colors.primary} />
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pillsRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
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
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  cardTop: { flexDirection: "row-reverse", gap: 8 },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sourceBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "700", textAlign: "right", fontFamily: "Inter_700Bold" },
  summary: { fontSize: 14, lineHeight: 22, textAlign: "right" },
  readMore: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  readMoreText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
