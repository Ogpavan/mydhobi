import MuiLink from "@mui/material/Link";
import type { ComponentProps } from "react";
import { forwardRef, useMemo } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";
import { queryClient } from "./query-client";

type LinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _prefetch, scroll: _scroll, ...props },
  ref,
) {
  return (
    <MuiLink
      component={RouterLink}
      to={href}
      ref={ref}
      underline="none"
      color="inherit"
      {...props}
    />
  );
});
export default Link;
export function useParams<T extends Record<string, string>>() {
  return useRouteParams() as T;
}
export function usePathname() {
  return useLocation().pathname;
}
export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (url: string) => {
        if (url === "/") queryClient.clear();
        return navigate(url);
      },
      replace: (url: string) => {
        if (url === "/") queryClient.clear();
        return navigate(url, { replace: true });
      },
      back: () => navigate(-1),
      refresh: () => {
        void queryClient.invalidateQueries();
      },
      prefetch: (_url: string) => {
        /* Route modules are loaded on demand. */
      },
    }),
    [navigate],
  );
}
export function notFound(): never {
  throw new Error("Page not found.");
}
