import { mkdir, writeFile } from 'node:fs/promises';
import { callMeta } from '../src/meta.mjs';

try {
  const started = Date.now();
  const model = process.env.META_TEST_MODEL?.trim() || 'muse-spark-1.3-contributor';
  const result = await callMeta('Reply with exactly: SN2_API_OK', { maxOutputTokens: 1024, model });
  const record = { verifiedAt: new Date().toISOString(), latencyMs: Date.now() - started, ...result };
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await writeFile(new URL('../artifacts/api-probe.json', import.meta.url), JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify(record, null, 2));
  if (result.text.trim() !== 'SN2_API_OK') console.warn('Real response received; text differed from the requested marker.');
} catch (error) {
  console.error(JSON.stringify({ ok: false, code: error.code || 'PROBE_ERROR', message: error.message }));
  process.exitCode = 1;
}
