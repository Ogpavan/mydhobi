let migrating = false;
export function isSchemaMigration() {
  return migrating;
}
export async function withSchemaMigration<T>(
  run: () => Promise<T>,
): Promise<T> {
  if (migrating) throw new Error("A schema migration is already running.");
  migrating = true;
  try {
    return await run();
  } finally {
    migrating = false;
  }
}
