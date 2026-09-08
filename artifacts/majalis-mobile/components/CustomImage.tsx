import { Image, type ImageContentFit, type ImageProps } from "expo-image";
import React, { memo, useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export type CustomImageProps = Omit<ImageProps, "style" | "contentFit"> & {
  /** Remote URL or require() source */
  source: ImageProps["source"];
  /** Fixed height — preferred for list cells */
  height?: number;
  /** Fixed width — defaults to 100% of parent when omitted with aspectRatio */
  width?: number | `${number}%`;
  /** Enforce layout slot before load (prevents CLS / jump) */
  aspectRatio?: number;
  borderRadius?: number;
  contentFit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  /** Disk + memory cache (expo-image default for remote is already disk) */
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
  /** Fade-in when decoded */
  transitionMs?: number;
  /** Blurhash / thumbhash placeholder (optional) */
  placeholder?: ImageProps["placeholder"];
  priority?: "low" | "normal" | "high";
};

/**
 * Cached image with reserved layout box + fade-in.
 * Uses expo-image (already in majalis-mobile).
 */
function CustomImageImpl({
  source,
  height,
  width,
  aspectRatio,
  borderRadius = 0,
  contentFit = "cover",
  style,
  cachePolicy = "memory-disk",
  transitionMs = 200,
  placeholder,
  priority = "normal",
  recyclingKey,
  ...rest
}: CustomImageProps) {
  const wrapperStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      styles.wrap,
      {
        width: width ?? "100%",
        height,
        aspectRatio: height == null ? aspectRatio : undefined,
        borderRadius,
        overflow: "hidden",
      },
      style,
    ],
    [width, height, aspectRatio, borderRadius, style],
  );

  return (
    <View style={wrapperStyle}>
      <Image
        source={source}
        style={styles.image}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transitionMs}
        placeholder={placeholder}
        placeholderContentFit={contentFit}
        priority={priority}
        recyclingKey={recyclingKey}
        {...rest}
      />
    </View>
  );
}

export const CustomImage = memo(CustomImageImpl);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(127,127,127,0.12)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
