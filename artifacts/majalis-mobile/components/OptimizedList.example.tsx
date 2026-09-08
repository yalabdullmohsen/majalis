/**
 * Example only — not wired into production tabs.
 * Copy this pattern into a screen when migrating a long FlatList.
 */
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { CustomImage } from "@/components/CustomImage";
import { OptimizedList, memoListItem } from "@/components/OptimizedList";

type LessonRow = {
  id: string;
  title: string;
  coverUrl: string | null;
};

const LessonItem = memoListItem(function LessonItem({ item }: { item: LessonRow }) {
  return (
    <View style={styles.row}>
      <CustomImage
        source={item.coverUrl ? { uri: item.coverUrl } : require("@/assets/images/icon.png")}
        width={72}
        height={72}
        aspectRatio={1}
        borderRadius={12}
        priority="normal"
        recyclingKey={item.id}
        accessibilityLabel={item.title}
      />
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
    </View>
  );
});

export function OptimizedLessonsListExample({ data }: { data: LessonRow[] }) {
  const renderItem = useCallback(
    ({ item }: { item: LessonRow }) => <LessonItem item={item} />,
    [],
  );

  return (
    <OptimizedList
      data={data}
      keyExtractor={(item) => item.id}
      fixedItemSize
      estimatedItemSize={88}
      renderItem={renderItem}
      contentContainerStyle={styles.listPad}
    />
  );
}

const styles = StyleSheet.create({
  listPad: { padding: 12, gap: 8 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    minHeight: 88,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    textAlign: "right",
    fontSize: 16,
    fontWeight: "600",
  },
});
