# Darshan AI — free online deployment

This deployment is designed for low-volume testing on free tiers. Free providers may sleep,
change quotas, or remove resources. It is not a guarantee of always-on service.

## 0. Before deploying

- Keep all secret keys in provider-side environment settings only.
- Do not commit `.env` files.
- Apply `supabase/schema.sql` in the Supabase SQL Editor before using persistent RAG.
- Configure Supabase Auth and create a test account.
- REA execution is disabled by default. Hosted REA can only inspect targets that exist inside
  the backend's controlled upload directory; this project does not yet expose a secure ZIP
  target-upload endpoint, so the REA UI should be treated as diagnostic/standby until that is added.

## 1. Deploy backend to Hugging Face Spaces (Docker)

1. Create a new Space at https://huggingface.co/new-space.
2. Choose **Docker** as the Space SDK and select the free CPU hardware.
3. Upload/push the repository contents to the Space repository. Keep `Dockerfile` at repository root.
4. In Space **Settings → Variables and secrets**, set:
   - `OPENROUTER_API_KEY` = your OpenRouter API key
   - `OPENROUTER_DEFAULT_MODEL` = `openrouter/free`
   - `SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = the JWT-style `service_role` key from Supabase's legacy API keys section (backend only; do not use the public anon key)
   - `CORS_ORIGINS` = `https://YOUR-PROJECT.pages.dev`
   - `ENABLE_REA_CLI_EXECUTION` = `false`
   - `REQUIRE_HUMAN_APPROVAL_FOR_TOOLS` = `true`
5. Wait for the Docker build. Open the Space's app URL and test `/health` and `/docs`.
6. Copy the Space app URL, e.g. `https://YOUR-SPACE.hf.space`.

The backend uses the Supabase Auth `/auth/v1/user` endpoint to validate bearer tokens. It does not
trust unverified JWT payloads.

## 2. Configure Supabase

1. Create a Supabase project: https://supabase.com/dashboard.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Enable Email authentication and create a test user.
4. Copy the project URL and public anon/publishable key for the frontend.
5. Keep the service-role/secret key only in Hugging Face Space Secrets.
6. RAG chunks and embeddings are stored in `public.darshan_ai_chunks`. Original uploaded files
   are processed temporarily by the backend and are not retained as files.

## 3. Deploy frontend to Cloudflare Pages

1. Create a Pages project at https://dash.cloudflare.com/ and connect the GitHub repository.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Root directory: `/` (repository root).
6. Add these build environment variables:
   - `VITE_API_URL` = your Hugging Face Space URL, without a trailing slash
   - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the public anon/publishable key
7. Deploy and copy the exact production `pages.dev` origin.
8. Update the backend's `CORS_ORIGINS` secret to that exact origin, then restart/rebuild the Space if needed.

The `VITE_` variables are public by design. Never put `OPENROUTER_API_KEY` or Supabase service-role
credentials in Cloudflare Pages frontend variables.

## 4. Test

- `GET https://YOUR-SPACE.hf.space/health` returns JSON.
- `GET https://YOUR-SPACE.hf.space/docs` opens FastAPI Swagger.
- Sign in on the frontend.
- Send a chat message and verify the response comes from OpenRouter.
- Upload a small text-based PDF from the authenticated account.
- Query a fact from the PDF and check that the returned citations include the source filename.
- Restart/rebuild the backend, then query the same PDF again. If the Supabase schema and secrets
  are correct, indexed chunks should remain available.
- `GET /api/rea/doctor` reports host prerequisites. Do not enable CLI execution publicly until a
  safe target upload/analysis workflow is implemented and tested.

## 5. Free-tier constraints

- Hugging Face Spaces may sleep and have limited CPU/RAM/disk.
- OpenRouter free model availability and rate limits change.
- Supabase free quotas apply.
- Cloudflare Pages hosts the static frontend; it does not run the Python backend.
- REA's static JavaScript analysis needs Node.js/npm and an uploaded local target. Native analysis
  may require Ghidra/Hopper/IDA and is not guaranteed on a free hosted container.
