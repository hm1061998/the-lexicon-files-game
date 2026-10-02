/**
 * Waits for canvas fonts so Phaser text is not measured with a fallback face.
 * Never rejects: a slow or failing load resolves `'timeout'` and the caller boots anyway.
 */
export async function waitForFonts(
  fontSet: Pick<FontFaceSet, 'load'>,
  specs: readonly string[],
  timeoutMs: number,
): Promise<'loaded' | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs);
  });
  const loaded = Promise.all(specs.map((spec) => fontSet.load(spec))).then(
    () => 'loaded' as const,
    () => 'timeout' as const,
  );
  try {
    return await Promise.race([loaded, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
