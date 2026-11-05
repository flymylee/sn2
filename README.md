# SN2.0 — a working sketch

If AI reads our conversations, it should work for us in return.

This local prototype uses a real Meta Model API call to produce two benefits from shared conversation evidence:

- A career conversation brief, with references to the subject's own messages.
- Intellectual-interest connections across rooms, with evidence from both people and a suggested opening question.

No account system, automatic outreach, model training, or real-world employment decisions. The included conversations are fictional demo data, not real users or validation of matching accuracy.

## Run locally

Requires Node.js 22 or later. No package installation is required.

1. Copy `.env.example` to `.env` if `.env` does not exist.
2. Put your Meta Model API key after `MODEL_API_KEY=` in `.env`.
3. Run `npm run probe` from this folder. A real response is saved to ignored `artifacts/api-probe.json` only on success.
4. Run `npm start` and open `http://127.0.0.1:3210`.
5. Review the fictional conversations, allow this dataset to be sent to Meta, and generate a result.

An API key being configured is not proof of a successful response. Live generation never substitutes saved output when an API call fails. On API errors or invalid evidence references it shows an error instead of results. A separate **Review a recorded real API run** button loads a clearly labeled, saved response with fictional input, response ID, and timestamp; it makes no API call and works without a key. Results disappear when the input changes. Downloads contain the input and output; review them before sharing.

Setup probes (`npm run probe`) use `META_TEST_MODEL=muse-spark-1.3-contributor` by default. This selects Contributor mode by model slug, with discounted pricing and permission for Meta to use submitted content and responses for training. Use it for synthetic test data. The app's analysis model is configured separately through `META_MODEL` (currently `muse-spark-1.3`, Standard mode). See [Meta pricing modes](https://dev.meta.ai/docs/pricing-rate-limits).

Live API verification: a Contributor connectivity probe and a fictional-data analysis succeeded on 2026-11-04 ET.

## API and data

`POST /api/analyze` accepts `subjectId`, `people`, and `messages`. A message contains `id`, `personId`, `room`, and `text`. The server sends the supplied dataset to `https://api.meta.ai/v1/responses`, using `muse-spark-1.3` by default. It checks message ownership, exact quoted substrings, brief claim references, cross-room separation, and interest references from both people.

These checks validate references, not the truth of self-reported actions or the semantic correctness of the model's interpretation. A human should review all claims. A connection is a hypothesis about shared questions, not demonstrated compatibility. No support means no forced match.

Only the explicitly allowed files in `public/` are served. `.env` stays outside that directory and is ignored by Git. The server binds to loopback, rejects unrelated Host and Origin headers, and permits one analysis at a time. This is a local demo, not a public multi-user backend. The app does not persist conversation requests server-side; Meta's own API data policies still apply.

## Validation

Run `npm test` for evidence-validation regression checks. Live API verification is a separate `npm run probe` step; tests do not establish API access.

Official request format: [Meta quickstart](https://dev.meta.ai/docs/quickstart).

## License

MIT. See `LICENSE`. Built with AI coding assistance.
