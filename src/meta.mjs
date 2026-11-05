const endpoint = 'https://api.meta.ai/v1/responses';

export class MetaError extends Error {
  constructor(message, code, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function configuration() {
  return {
    configured: Boolean(process.env.MODEL_API_KEY?.trim()),
    model: process.env.META_MODEL?.trim() || 'muse-spark-1.3',
  };
}

export function outputText(body) {
  return (body.output || [])
    .filter(item => item.type === 'message')
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('\n');
}

export async function callMeta(input, { maxOutputTokens = 6000, model = configuration().model } = {}) {
  const key = process.env.MODEL_API_KEY?.trim();
  if (!key) throw new MetaError('Set MODEL_API_KEY in the local .env file first.', 'KEY_MISSING', 503);
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input, max_output_tokens: maxOutputTokens }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    throw new MetaError(error.name === 'TimeoutError' ? 'Meta API request timed out.' : 'Cannot reach Meta API. Check network access.', 'NETWORK_ERROR');
  }
  let body;
  try { body = await response.json(); }
  catch { throw new MetaError(`Meta API returned HTTP ${response.status} without JSON.`, 'UPSTREAM_FORMAT'); }
  if (!response.ok) {
    // Do not echo upstream bodies: they can contain request data or credentials.
    const hints = {
      400: 'Meta rejected the request format. Check the current API schema.',
      401: 'Meta rejected the API key. Check the key in .env.',
      403: 'Meta denied access. Check account and model permissions.',
      404: 'Meta endpoint or model was not found. Check META_MODEL.',
      429: 'Meta rate or credit limit reached. Check the dashboard and retry later.',
    };
    throw new MetaError(hints[response.status] || `Meta API returned HTTP ${response.status}.`, `META_HTTP_${response.status}`);
  }
  if (body.status && body.status !== 'completed') {
    throw new MetaError(`Meta response is ${String(body.status).slice(0,30)}; no complete result received.`, 'INCOMPLETE_RESPONSE');
  }
  const text = outputText(body);
  if (!text.trim()) throw new MetaError('Meta returned no output text.', 'EMPTY_RESPONSE');
  return { text, responseId: body.id || null, model: body.model || model, usage: body.usage || null };
}
