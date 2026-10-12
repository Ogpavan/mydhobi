import { Avatar as MaterialAvatar } from "@mui/material";
import {
  Children,
  isValidElement,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactElement,
} from "react";
export function Avatar({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const items = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<{
    src?: string;
    alt?: string;
    children?: React.ReactNode;
  }>[];
  const image = items.find((item) => item.type === AvatarImage);
  const fallback = items.find((item) => item.type === AvatarFallback);
  return (
    <MaterialAvatar src={image?.props.src} alt={image?.props.alt} {...props}>
      {fallback?.props.children}
    </MaterialAvatar>
  );
}
export function AvatarImage(_props: ImgHTMLAttributes<HTMLImageElement>) {
  return null;
}
export function AvatarFallback(_props: HTMLAttributes<HTMLSpanElement>) {
  return null;
}
