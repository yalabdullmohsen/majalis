import { OptimizedSheikhImage, type OptimizedSheikhImageProps } from "@/components/sheikh/OptimizedSheikhImage";

const LEGACY_SIZE = {
  sm: 64,
  md: 80,
  lg: 100,
  xl: 120,
} as const;

type SizeProp = OptimizedSheikhImageProps["size"];

type Props = Omit<OptimizedSheikhImageProps, "variant"> & {
  size?: SizeProp;
};

/** @deprecated Prefer OptimizedSheikhImage — kept for backward compatibility */
export function SheikhAvatar(props: Props) {
  return <OptimizedSheikhImage {...props} variant="avatar" />;
}

export { OptimizedSheikhImage };
export default SheikhAvatar;

export { LEGACY_SIZE };
