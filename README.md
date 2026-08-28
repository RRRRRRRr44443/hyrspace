# HYRSPACE v4

Static HTML/CSS/JS social network using Supabase Auth + Postgres + Realtime.

## Setup
1. Open `supabase.sql` in Supabase SQL Editor and run it.
2. In `config.js`, set `supabaseUrl` and `supabaseKey` (Publishable key).
3. Upload the folder to GitHub/Vercel or open `index.html` via a local web server.
4. Create the first administrator manually in Supabase after registering:
   `update public.profiles set role='Администратор' where username='YOUR_NICK';`

Do not put a service_role key in `config.js`.
