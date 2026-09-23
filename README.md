# rakit. — landing page agensi

Landing page for "rakit.", a fictional growth agency for Indonesian D2C brands and UMKM. It implements direction 1a "Malam" (dark, giant headline) from the Claude Design file `Landing Page Agensi.dc.html`. Plain HTML, CSS, and JS with no build step.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works, because every asset path is relative.

## Structure

```
index.html        the page
css/base.css      tokens, reset, shared bits (check icon, stripes, marquee)
css/malam.css     page styles, including the responsive rules
js/marquee.js     duplicates the logo track so the loop is seamless
js/malam.js       growth-framework tabs (click or arrow keys)
```

## Placeholders

- Every striped box stands in for a real image or video.
- The WhatsApp number (+62 812 3456 7890), email, social links, and client names come from the design and are placeholders.
