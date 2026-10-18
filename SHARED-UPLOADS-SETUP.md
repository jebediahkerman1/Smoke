# Enable shared SMOKE uploads

The GitHub Pages site is static, so shared uploads use a Supabase database.

1. Create a free project at https://supabase.com/.
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of `supabase-setup.sql`, and run it.
3. Open **Project Settings → API** (or the project's Connect/API section) and copy the Project URL and the public anon/publishable key. Never use a secret or service_role key in the website.
4. Edit `supabase-config.js` in this repository. Replace `https://YOUR_PROJECT.supabase.co` with the Project URL and replace `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` with the public key.
5. Commit the file and wait for GitHub Pages to deploy. Reload `builder.html` and publish a level after winning its playtest.

After setup, the Community Uploads list reads from the shared database and uploads appear to all visitors. Until configured, the page remains in local-browser fallback mode. This demo allows public reading and uploading; it does not provide user accounts, spam protection, moderation, or server-side verification that a level was actually won. The win gate is a client-side rule and can be bypassed by a determined user. Do not place secret keys in the repository.
