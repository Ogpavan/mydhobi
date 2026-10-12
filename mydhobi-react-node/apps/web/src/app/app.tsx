import { Alert, Box, Button, LinearProgress, Typography } from "@mui/material";
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedLayout, SessionEvents, useSession } from "./auth";
import { pageRoutes } from "./page-routes";
const SidebarSettingsView = lazy(() =>
  import("@/components/developer/sidebar-settings-view").then((module) => ({
    default: module.SidebarSettingsView,
  })),
);
class ErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page failed", error.message, info.componentStack);
  }
  componentDidUpdate(previous: Readonly<{ resetKey: string }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: false });
    }
  }
  render() {
    return this.state.error ? (
      <Box p={3}>
        <Alert severity="error">Unable to open this page.</Alert>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </Box>
    ) : (
      this.props.children
    );
  }
}
function DeveloperPage() {
  const session = useSession();
  return session.data ? (
    <SidebarSettingsView initialItems={session.data.sidebarItems} />
  ) : null;
}
export function App() {
  const location = useLocation();
  useEffect(() => {
    const isCustomer = location.pathname.startsWith("/customer");
    document.title = location.pathname.startsWith("/customer")
      ? "MyDhobi"
      : "MyDhobi Admin";
    document.body.classList.toggle("customer-experience", isCustomer);
    window.scrollTo(0, 0);
    return () => document.body.classList.remove("customer-experience");
  }, [location.pathname]);
  return (
    <>
      <SessionEvents />
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<LinearProgress aria-label="Loading page" />}>
          <Routes>
            {pageRoutes.map(({ path, Component: Page }) => {
              const area = path.startsWith("/admin")
                ? "admin"
                : path.startsWith("/customer")
                  ? "customer"
                  : null;
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    area ? (
                      <ProtectedLayout area={area}>
                        <Page />
                      </ProtectedLayout>
                    ) : (
                      <Page />
                    )
                  }
                />
              );
            })}
            <Route
              path="/developer"
              element={
                <ProtectedLayout area="developer">
                  <DeveloperPage />
                </ProtectedLayout>
              }
            />
            <Route path="/verify-otp" element={<Navigate to="/" replace />} />
            <Route
              path="*"
              element={
                <Box p={3}>
                  <Typography variant="h2">Page not found</Typography>
                  <Button href="/">Go home</Button>
                </Box>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
