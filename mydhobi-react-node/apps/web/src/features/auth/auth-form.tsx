import { startNavigationProgress } from "@/components/navigation-loader";
import { apiFetch } from "@/platform/http";
import { queryClient } from "@/platform/query-client";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

export function AuthForm({ register = false }: { register?: boolean }) {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [shown, setShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const otpLogin = !register && mode === "otp";

  async function sendLoginCode() {
    setError("");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/api/auth/login/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Unable to send the code.");
        return;
      }
      setOtpSent(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") ?? "");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    if (otpLogin && !/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (register && password !== fields.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(
        register
          ? "/api/auth/register"
          : otpLogin
            ? "/api/auth/login/verify-otp"
            : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile,
            ...(otpLogin ? { otp } : { password }),
            ...(register ? { name: fields.get("name") } : {}),
          }),
        },
      );
      const data = (await response.json()) as {
        message?: string;
        user?: { role: string };
      };
      if (!response.ok) {
        setError(data.message ?? "Unable to sign in.");
        return;
      }
      queryClient.clear();
      const customer = data.user?.role === "customer";
      const redirect = search.get("redirect");
      const safe =
        redirect &&
        (customer ? /^\/customer(?:\/|$)/ : /^\/admin(?:\/|$)/).test(redirect)
          ? redirect
          : customer
            ? "/customer"
            : "/admin/dashboard";
      startNavigationProgress();
      navigate(register ? "/permissions" : safe, { replace: true });
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container
      maxWidth="xs"
      sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", py: 4 }}
    >
      <Box sx={{ width: "100%" }}>
        <Box role="img" aria-label="MyDhobi" sx={{ mb: 4 }}>
          <Typography
            sx={{
              color: "#18112b",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            My<span style={{ color: "#6d28d9" }}>Dhobi</span>
          </Typography>
          <Typography sx={{ mt: 0.75, color: "#77728a", fontSize: 11 }}>
            Premium Laundry &amp; Dry Clean
          </Typography>
        </Box>
        <Typography variant="h1" sx={{ mb: 3 }}>
          {register ? "Create account" : "Sign in"}
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2.5}>
            {register && (
              <TextField
                label="Full name"
                name="name"
                autoComplete="name"
                required
                slotProps={{ htmlInput: { minLength: 2, maxLength: 100 } }}
              />
            )}
            <TextField
              label="Mobile number"
              name="mobile"
              type="tel"
              autoComplete="tel"
              value={mobile}
              onChange={(event) =>
                setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              required
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  maxLength: 10,
                  pattern: "[0-9]{10}",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">+91</InputAdornment>
                  ),
                },
              }}
            />
            {otpLogin ? (
              <>
                <TextField
                  label="One-time code"
                  name="otp"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      maxLength: 6,
                      pattern: "[0-9]{6}",
                    },
                  }}
                />
                {otpSent ? (
                  <Typography variant="body2" color="text.secondary">
                    Code sent to +91 {mobile}.
                  </Typography>
                ) : null}
              </>
            ) : (
              <TextField
                label="Password"
                name="password"
                type={shown ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                required
                slotProps={{
                  htmlInput: { minLength: register ? 8 : 1 },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip
                          title={shown ? "Hide password" : "Show password"}
                        >
                          <IconButton
                            aria-label={
                              shown ? "Hide password" : "Show password"
                            }
                            onClick={() => setShown((value) => !value)}
                            edge="end"
                          >
                            {shown ? <EyeOff size={19} /> : <Eye size={19} />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
            {register && (
              <TextField
                label="Confirm password"
                name="confirmPassword"
                type={shown ? "text" : "password"}
                autoComplete="new-password"
                required
              />
            )}
            {register && (
              <FormControlLabel
                control={<Checkbox required />}
                label="I agree to the Terms and Privacy Policy."
              />
            )}
            {!register && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Link component={RouterLink} to="/forgot-password">
                  Forgot password?
                </Link>
                <Button
                  type="button"
                  size="small"
                  onClick={() => {
                    setMode((value) =>
                      value === "password" ? "otp" : "password",
                    );
                    setOtp("");
                    setOtpSent(false);
                    setError("");
                  }}
                >
                  {otpLogin ? "Use password" : "Sign in with OTP"}
                </Button>
              </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {otpLogin && !otpSent ? (
              <Button
                type="button"
                variant="contained"
                size="large"
                onClick={() => void sendLoginCode()}
                loading={saving}
              >
                Send code
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={saving}
              >
                {register
                  ? "Create account"
                  : otpLogin
                    ? "Verify and sign in"
                    : "Sign in"}
              </Button>
            )}
            {otpLogin && otpSent ? (
              <Button
                type="button"
                size="small"
                onClick={() => void sendLoginCode()}
                disabled={saving}
              >
                Send code again
              </Button>
            ) : null}
          </Stack>
        </Box>
        <Typography sx={{ mt: 3 }} color="text.secondary">
          {register ? "Already have an account? " : "New to MyDhobi? "}
          <Link component={RouterLink} to={register ? "/" : "/register"}>
            {register ? "Sign in" : "Create account"}
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
