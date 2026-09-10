import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  rows?: number;
  minHeight?: number;
};

/** هيكل ثابت الارتفاع يقلل قفزات التخطيط أثناء التحميل الأولي */
export function ListLoadingSkeleton({ rows = 5, minHeight = 72 }: Props) {
  const colors = useColors();

  return (
    <View style={styles.wrap} accessibilityLabel="جاري التحميل">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={`skel-${i}`}
          style={[
            styles.card,
            {
              minHeight,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.line, { backgroundColor: colors.border, width: "74%" }]} />
          <View style={[styles.line, { backgroundColor: colors.border, width: "46%", marginTop: 10 }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 8 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    justifyContent: "center",
  },
  line: { height: 12, borderRadius: 6, alignSelf: "flex-end" },
});
