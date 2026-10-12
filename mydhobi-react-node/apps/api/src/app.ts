import compression from "compression";
import express, { type ErrorRequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { resolve } from "node:path";
import { enforceAccess } from "./platform/access";
import { adapt } from "./platform/adapter";
import { HttpResponse } from "./platform/http-response";
import { registerRoutes } from "./routes";
import { getAllowedAdminPageKeys } from "./services/role-permissions";
import { getCurrentUser } from "./services/session";
import { listSidebarSettings } from "./services/sidebar-settings";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" &&
            process.env.COOKIE_SECURE !== "false"
              ? []
              : null,
        },
      },
    }),
  );
  app.use(compression());
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    const start = performance.now();
    res.once("finish", () => {
      if (process.env.LOG_REQUESTS === "true")
        console.info(
          req.method,
          req.path,
          res.statusCode,
          Math.round(performance.now() - start) + "ms",
        );
    });
    // Cookies are same-origin. Reject cross-origin browser writes before handlers.
    const configuredOrigin = process.env.APP_ORIGIN ?? "http://localhost:3000";
    const requestOrigin = req.headers.origin;
    const isAllowedOrigin =
      requestOrigin === configuredOrigin ||
      (process.env.NODE_ENV !== "production" &&
        (requestOrigin === "http://localhost:3000" ||
          requestOrigin === "http://127.0.0.1:3000"));
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      requestOrigin &&
      !isAllowedOrigin
    ) {
      res.status(403).json({ message: "Request is not allowed." });
      return;
    }
    next();
  });
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again later." },
  });
  app.use(
    ["/api/auth/login", "/api/auth/login/verify-otp", "/api/auth/register"],
    loginLimit,
  );
  const otpLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many code requests. Please try again later." },
  });
  app.use(
    ["/api/auth/login/request-otp", "/api/auth/password-reset/request-otp"],
    otpLimit,
  );
  app.use("/api/auth/password-reset", loginLimit);
  app.use(enforceAccess);
  app.use("/api", express.raw({ type: () => true, limit: "12mb" }));
  app.use("/api", (req, res, next) => {
    if (req.is("application/json") && Buffer.isBuffer(req.body)) {
      try {
        const body: unknown = JSON.parse(req.body.toString("utf8"));
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          res.status(400).json({ message: "Check the entered details." });
          return;
        }
      } catch {
        res.status(400).json({ message: "Check the entered details." });
        return;
      }
    }
    next();
  });
  app.get(
    "/api/auth/bootstrap",
    adapt(async () => {
      const user = await getCurrentUser();
      if (!user)
        return HttpResponse.json(
          { message: "Please sign in." },
          { status: 401 },
        );
      const [sidebarItems, allowedPageKeys] =
        user.role === "customer"
          ? [[], []]
          : await Promise.all([
              listSidebarSettings(),
              getAllowedAdminPageKeys(user),
            ]);
      return HttpResponse.json({ user, sidebarItems, allowedPageKeys });
    }),
  );
  registerRoutes(app);
  app.use("/api", (_req, res) =>
    res.status(404).json({ message: "Page not found." }),
  );
  if (process.env.NODE_ENV === "production") {
    const publicDir = resolve(process.cwd(), "apps/web/dist");
    app.use(
      express.static(publicDir, {
        index: false,
        setHeaders: (res, path) => {
          res.setHeader(
            "Cache-Control",
            path.includes("/assets/")
              ? "public, max-age=31536000, immutable"
              : "no-cache",
          );
        },
      }),
    );
    app.get("/{*path}", (_req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(resolve(publicDir, "index.html"));
    });
  }
  const onError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    console.error(
      "Request failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    const status = error instanceof SyntaxError ? 400 : 500;
    res.status(status).json({
      message:
        status === 400
          ? "Check the entered details."
          : "Unable to complete this request.",
    });
  };
  app.use(onError);
  return app;
}
