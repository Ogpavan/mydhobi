import { startNavigationProgress } from "@/components/navigation-loader";
import { apiFetch } from "@/platform/http";
import {
  Alert,
  Box,
  Button,
  Container,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";

type ResetStep = "mobile" | "code" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/api/auth/password-reset/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Unable to send the code.");
        return;
      }
      setNotice(data.message ?? "We sent a reset code to your mobile.");
      setStep("code");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Password must be 8 to 72 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp, password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Unable to change the password.");
        return;
      }
      setStep("done");
      setNotice(data.message ?? "Password changed. You can sign in.");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function changeMobile() {
    setStep("mobile");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setNotice("");
  }

  return (
    <Container
      maxWidth="xs"
      sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", py: 4 }}
    >
      <Box sx={{ width: "100%" }}>
        <Box
          component="img"
          src="/mydhobi_logo.png"
          alt="MyDhobi"
          sx={{ width: 180, height: "auto", display: "block", mb: 4 }}
        />
        <Typography variant="h1" sx={{ mb: 3 }}>
          Forgot password
        </Typography>

        {step === "mobile" ? (
          <Box component="form" onSubmit={requestCode}>
            <Stack spacing={2.5}>
              <TextField
                label="Mobile number"
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
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={saving}
              >
                Send reset code
              </Button>
            </Stack>
          </Box>
        ) : step === "code" ? (
          <Box component="form" onSubmit={resetPassword}>
            <Stack spacing={2.5}>
              {notice && <Alert severity="info">{notice}</Alert>}
              <TextField
                label="One-time code"
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
              <TextField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                slotProps={{ htmlInput: { minLength: 8, maxLength: 72 } }}
              />
              <TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={saving}
              >
                Change password
              </Button>
              <Button type="button" size="small" onClick={changeMobile}>
                Use another mobile number
              </Button>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Alert severity="success">{notice}</Alert>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              size="large"
              onClick={startNavigationProgress}
            >
              Back to sign in
            </Button>
          </Stack>
        )}

        {step !== "done" ? (
          <Link
            component={RouterLink}
            to="/"
            sx={{ display: "inline-block", mt: 3 }}
          >
            Back to sign in
          </Link>
        ) : null}
      </Box>
    </Container>
  );
}
