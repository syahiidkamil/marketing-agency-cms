# rakit. — landing page + CMS

Landing page for "rakit.", a fictional growth agency for Indonesian D2C brands and UMKM, with a demo admin CMS. It's built with **Ruby on Rails 8** and deployed to **Vercel** as a static site.

- `/` is the landing page (design direction 1a "Malam").
- `/admin/login` is the CMS login. **Login as admin** fills in the demo credentials (`admin` / `rakit2026`).
- `/admin` is the CMS: live-preview editing of every section, a leads inbox, and JSON export/import/reset.

## How it works

Vercel can't run a Rails server, so Rails is used to render the site and the result is exported as static HTML at build time:

```
db/content.json ──► Rails views (ERB) ──► rake static:export ──► dist/*.html ──► Vercel
```

There's no database. `db/content.json` holds the default copy. The CMS saves edits to the visitor's **localStorage**, and a Stimulus controller merges them over the server-rendered defaults (text only, via `textContent`). So every visitor can play with the CMS, but only their own browser sees the changes. Leads from the contact form are stored the same way.

The "login" is also browser-only (a `sessionStorage` flag). It's a portfolio demo, not real authentication.

## Local development

Requires Ruby 3.3 (`brew install ruby@3.3`).

```sh
bundle install
bin/rails server          # http://localhost:3000
bin/rails test
```

To change the default content, edit `db/content.json`. You can also use CMS → Backup & Reset → Unduh JSON and commit the downloaded file as `db/content.json`.

## Static export

```sh
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails static:export
cd dist && python3 -m http.server 8000
```

## Deploy to Vercel

`vercel.json` sets the install command, the build command (the export above) and `outputDirectory: dist`. Import the repo in the Vercel dashboard, or run `vercel` from the CLI. No environment variables are needed.

If the Vercel build ever can't install gems, build locally and upload the output instead:

```sh
vercel build && vercel deploy --prebuilt
```

## Where things live

| Path | What |
| --- | --- |
| `db/content.json` | Default copy for every section |
| `app/models/site_content.rb` | Loads the JSON |
| `app/helpers/application_helper.rb` | `cms_text` / `cms_list` / `cms_field`: bind markup to content paths |
| `app/views/pages/sections/` | Landing page sections |
| `app/javascript/lib/content_store.js` | localStorage "database" (content, leads, admin flag) |
| `app/javascript/lib/cms_schema.js` | Which fields the CMS edits, and how |
| `app/javascript/controllers/` | Stimulus controllers (`content`, `cms`, `login`, `tabs`, `contact`, …) |
| `lib/tasks/static.rake` | `static:export` |
