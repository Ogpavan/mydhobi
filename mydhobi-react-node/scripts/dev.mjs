import net from "node:net";
import { spawn } from "node:child_process";
for (const port of [3000, 4000]) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", () =>
      reject(
        new Error(
          `Port ${port} is busy. Stop the existing app before starting this project.`,
        ),
      ),
    );
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}
const children = [
  spawn(
    "npx",
    [
      "tsx",
      "watch",
      "--env-file-if-exists=.env",
      "--tsconfig",
      "apps/api/tsconfig.json",
      "apps/api/src/server.ts",
    ],
    { stdio: "inherit" },
  ),
  spawn("npm", ["run", "dev", "-w", "@mydhobi/web"], { stdio: "inherit" }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
for (const child of children) child.on("exit", (code) => stop(code ?? 0));
