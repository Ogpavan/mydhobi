import Box from "@mui/material/Box";
import type { ImgHTMLAttributes } from "react";
type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
};
export default function Image({
  fill,
  priority,
  unoptimized: _unoptimized,
  quality: _quality,
  style,
  ...props
}: Props) {
  return (
    <Box
      component="img"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...props}
      style={{
        ...(fill
          ? { position: "absolute", width: "100%", height: "100%", inset: 0 }
          : {}),
        ...style,
      }}
    />
  );
}
