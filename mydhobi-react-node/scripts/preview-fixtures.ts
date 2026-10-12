// Test preview only. Uses a disposable database with synthetic records.
import { createFixtureDatabase } from "../tests/support/database";
const fixture = await createFixtureDatabase();
process.env.NODE_ENV = "production";
const port = Number(process.env.PREVIEW_PORT ?? 3000);
process.env.APP_ORIGIN = `http://localhost:${port}`;
const { createApp } = await import("../apps/api/src/app");
const server = createApp().listen(port, "127.0.0.1", () =>
  console.info(`Test preview: http://localhost:${port} (synthetic data only)`),
);
process.on("SIGTERM", () => {
  server.close(() => {
    void fixture.database.close().then(() => process.exit(0));
  });
});
process.on("SIGINT", () => {
  server.close(() => {
    void fixture.database.close().then(() => process.exit(0));
  });
});
