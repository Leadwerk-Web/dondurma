# Static source contract (Global Theme Distribution)

Copy this file to the root of every **new** customer HTML repository. Cursor and
humans authoring pages must follow it. The full GTD registry, build commands and
release rules live in `Global Theme Distribution/AGENTS.md`.

This repository contains **only** canonical HTML and local assets. WordPress theme
PHP, importer code, plugins, generated ZIPs and credentials do not belong here.
WordPress never reads this GitHub repository. GTD compiles a signed theme ZIP;
after import, HTML lives in WordPress and CSS/JS stay in the theme.

## Schemas (do not copy into this HTML repo)

Canonical JSON schemas live in the GTD registry
`Global Theme Distribution/schemas/`. This HTML repository must not duplicate
them. The technical profile in `projects/<slug>/` references them via `$schema`.

| Schema | Role |
| --- | --- |
| `schemas/project.schema.json` | Project identity, page discovery, routes, WordPress, build gates |
| `schemas/project-variables.schema.json` | Company, brand, contact, features (no secrets) |
| `schemas/content.schema.json` | Compiled content package inside the theme ZIP |
| `schemas/release.schema.json` | Signed release manifest |
| `schemas/translation-seed.schema.json` | Optional translation seeds |

Starter copies (GTD registry, not this repo):

1. `templates/project/leadwerk.project.json` → `projects/<slug>/project.json`
2. `templates/project/project.variables.json` → `projects/<slug>/project.variables.json`
3. Keep `templates/project/leadwerk.modules.json` next to the profile as the
   Leadwerk Optionen module contract (do not copy it into the HTML repo).
4. Point `source.root` at this HTML checkout.
5. Keep `$schema` as `../../schemas/project.schema.json` (and the variables schema)
   when the files live under `projects/<slug>/`.
6. New sites: `"pagePatterns": ["**/*.html"]`. Set a stable `sourceKey`, `route`
   and `template` in `pageOverrides` **before first release**.
7. `build.editableContentPolicy` is `require`. `build.releaseEnabled` stays false
   until validate, dry-run and a staging import have passed.
8. New sites ship the full Leadwerk Optionen menu: Fields, Importer, Theme Center
   (companion plugin `wordpress/leadwerk-theme-center`), Übersetzungen /
   Sprachen / Diagnose, and the Migration screens. Set
   `wordpress.modules` to `["fields", "importer", "translations", "migration"]`
   and keep `build.moduleSources` for translations and migration. Do not put
   those PHP sources in the HTML repository.
   `brand.logo` and `brand.favicon` must be real source paths (for example
   `svg/logo.svg`). After import they preselect Logo and Favicon in
   Leadwerk Optionen.
9. Contact forms are WPForms Lite, not a theme module. Install the companion
   plugin `wpforms-lite` (1.10.2+) **before** the first import with
   `features.forms: true`. Set a typed `forms` object in
   `project.variables.json` (provider `wpforms`, unique `sourceFormId`,
   `thankYouSourceKey`, `privacySourceKey`, fields including `email`). Exactly
   one HTML `<form id="{sourceFormId}">` must exist in the project. Import
   replaces that shell with `[leadwerk_gtd_form]`, creates the WPForms form
   and writes **WPForms Formular-ID** in Leadwerk Optionen. Keep
   `features.forms` false in this starter JSON until that HTML slot exists.

## WPForms

WPForms Lite is a companion plugin from wordpress.org (`wpforms-lite`). It is
not bundled in the theme ZIP. Theme Center does not install it.

When `features.forms` is true:

1. Install and activate WPForms Lite ≥ `forms.minimumVersion` (default 1.10.2)
   before import. WordPress must be 6.9+ so `wpforms/create-form` is available.
2. `contact.formRecipient` is required. Do not put API keys or passwords in
   `project.variables.json`.
3. `forms.sourceFormId` must identify **exactly one** `<form>` in the HTML
   source. Static preview keeps that markup; after import the importer swaps it
   for the live WPForms shortcode.
4. `thankYouSourceKey` and `privacySourceKey` must be discovered `sourceKey`
   values (typically `danke.html` and `datenschutz.html`).
5. Field keys are stable. One field must be `email` with type `email` (Reply-To).
   Checkbox and radio fields need `choices`.
6. Import creates or reconciles the form and fills Leadwerk Optionen
   `wpforms_form_id`. Do not hard-code the numeric ID in HTML.
7. Form CSS must cover **both** the static shell and the WordPress WPForms
   markup. `.form input` does not win against WPForms plugin CSS. The class
   names after import are stable; extend the same rules (or pair them) so the
   live form looks like the local preview.

### Form CSS after import

The importer replaces `<form id="{sourceFormId}" class="form">` with:

```html
<div class="form leadwerk-wpforms" data-leadwerk-form-slot="{forms.key}">
  <div class="leadwerk-wpforms">
    <div class="wpforms-container wpforms-container-full wpforms-render-modern" id="wpforms-{n}">
      <form id="wpforms-form-{n}" class="wpforms-validate wpforms-form wpforms-ajax-form">
        <div class="wpforms-field-container">
          <div id="wpforms-{n}-field_{id}-container" class="wpforms-field wpforms-field-text|email|textarea|checkbox|radio">
            <label class="wpforms-field-label">…</label>
            <input class="wpforms-field-medium"> or <textarea> or checkbox list
          </div>
        </div>
        <div class="wpforms-submit-container">
          <button type="submit" class="wpforms-submit" id="wpforms-submit-{n}">…</button>
        </div>
      </form>
    </div>
  </div>
</div>
```

Use these selectors, never a numeric form ID (`#wpforms-60`):

| Local shell | WPForms after import |
| --- | --- |
| `form.form` | `.leadwerk-wpforms`, `.leadwerk-wpforms .wpforms-container`, `.leadwerk-wpforms .wpforms-form` |
| `.form` layout / gap | `.leadwerk-wpforms .wpforms-field-container` |
| `.form label` | `.leadwerk-wpforms .wpforms-field-label` |
| `.form input`, `.form textarea` | `.leadwerk-wpforms .wpforms-field input:not([type="checkbox"]):not([type="radio"])`, `.leadwerk-wpforms .wpforms-field textarea` |
| checkbox / radio label | `.leadwerk-wpforms .wpforms-field-label-inline` |
| `.form .btn`, `button[type="submit"]` | `.leadwerk-wpforms .wpforms-submit` |
| privacy `<a>` | `.leadwerk-wpforms .leadwerk-privacy-link` |

WPForms modern markup also reads CSS variables. Override them on `.leadwerk-wpforms` with the same tokens as the local fields and button:

`--wpforms-field-border-radius`, `--wpforms-field-background-color`, `--wpforms-field-border-color`, `--wpforms-field-text-color`, `--wpforms-label-color`, `--wpforms-button-background-color`, `--wpforms-button-border-color`, `--wpforms-button-text-color`, `--wpforms-button-border-radius`. Also set the **size** variables or WPForms keeps its 41px/17px defaults and the live button is smaller than `.form .btn`: `--wpforms-button-size-height`, `--wpforms-button-size-padding-h`, `--wpforms-button-size-font-size`, `--wpforms-field-size-input-height`, `--wpforms-field-size-padding-h`.

Write one rule for both surfaces:

```css
.form,
.leadwerk-wpforms .wpforms-field-container {
  display: grid;
  gap: 14px;
  max-width: 520px;
}
.form input,
.form textarea,
.leadwerk-wpforms .wpforms-field input:not([type="checkbox"]):not([type="radio"]),
.leadwerk-wpforms .wpforms-field textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid #d7c9ae;
  background: #fff;
  font: inherit;
}
.form .btn,
.leadwerk-wpforms .wpforms-submit {
  /* same padding, radius, background, color as the site button */
}
.leadwerk-wpforms {
  --wpforms-field-border-radius: 16px;
  --wpforms-field-background-color: #fff;
  --wpforms-field-border-color: #d7c9ae;
  --wpforms-button-background-color: var(--tomato);
  --wpforms-button-text-color: #fff;
  --wpforms-button-border-radius: 999px;
}
```

The theme ZIP ships a generic `assets/forms.css` reset only (width, honeypot, modal). Brand look stays in the project stylesheet. Register and login shells that must stay HTML keep a **different** `id` from `forms.sourceFormId`.

Example `project.variables.json` fragment:

```json
"features": { "translations": true, "forms": true, "migration": true },
"forms": {
  "provider": "wpforms",
  "key": "contact",
  "minimumVersion": "1.10.2",
  "title": "Kontakt",
  "submitLabel": "Nachricht senden",
  "sourceFormId": "kontakt-form",
  "thankYouSourceKey": "example-danke-v1",
  "privacySourceKey": "example-datenschutz-v1",
  "privacyLinkText": "Datenschutzerklärung",
  "confirmationMessage": "Vielen Dank für deine Nachricht.",
  "fields": [
    { "key": "name", "type": "text", "label": "Name", "required": true },
    { "key": "email", "type": "email", "label": "E-Mail", "required": true },
    { "key": "message", "type": "textarea", "label": "Nachricht", "required": true },
    {
      "key": "consent",
      "type": "checkbox",
      "label": "Datenschutz",
      "required": true,
      "choices": ["Ich habe die Datenschutzerklärung gelesen."]
    }
  ]
}
```

```html
<form id="kontakt-form" class="form" action="kontakt.html" method="post">
```

## New page

1. Add a real HTML document (`about.html` or `services/index.html`).
2. One `<main>`, one `<h1>`, `<html lang>` matching the project locale.
3. Non-empty `<title>` and meta description. No production host in canonical URLs.
4. Annotate editable nodes (`data-lw-section`, `data-lw-field`, `data-lw-type`).
5. Internal links are project paths or `data-lw-page-ref`. No `href="#"`.
6. Images and fonts are local. Filenames lowercase. No Google Fonts / CDN in
   production markup.
7. If the GTD profile uses an explicit `pagePatterns` list, add the file there
   and set `pageOverrides.sourceKey` **before first release**. New sites should
   use `**/*.html` so discovery is automatic; `sourceKey` still belongs in
   `pageOverrides`.
8. Validate with GTD (`gtd validate` / `gtd build --dry-run`). Do not weaken
   validators. Push a clean commit. Theme Center installs the next published ZIP;
   a wp-admin popup then applies only HTML/field/section/media changes and offers
   the next server version. Unchanged pages are not rewritten. CSS/JS stay in the
   theme ZIP.

## Annotations

```html
<section data-lw-section="hero">
  <p data-lw-field="hero.eyebrow" data-lw-type="text">...</p>
  <h1 data-lw-field="hero.title" data-lw-type="richtext">...</h1>
  <img data-lw-field="hero.image" data-lw-type="image"
       src="assets/hero.webp" alt="...">
</section>
```

- `data-lw-field` is a stable unique dot path. Never derive it from visible text.
- Types: `text`, `textarea`, `richtext`, `url`, `email`, `number`, `boolean`,
  `image`, `video`, `page_reference`, `choice`, `html`.
- Repeaters use `data-lw-repeater` plus a permanent `data-lw-item-key`.
- Header/footer shared values use `data-lw-global`. Same key, same type everywhere.
- JS-only content is not importable unless the seed exists in the HTML.

## Static vs WordPress parity

WordPress does not serve the HTML files. Import writes the `<body>` fragment into
`post_content`, enqueues CSS/JS from the theme ZIP, and rewrites local `src` /
`href` to Media Library URLs and permalinks. The static preview and the live
frontend look the same only if the source already follows these rules. Do not
patch WordPress after import to hide a source mistake.

1. **Image filenames must not equal page slugs.** WordPress attachments steal
   permalinks. `firenze.jpg` plus page `/firenze/` becomes `/firenze-2/`. Use a
   prefix that cannot collide (`assets/cover-firenze.jpg`, never
   `assets/firenze.jpg`).
2. **SVG is ASCII-only.** The importer sanitizer / Latin-1 path rejects umlauts
   in SVG markup. Keep logos and favicons in ASCII (`Gelato`, not `Geläto`).
3. **Cart and similar JS must store live image URLs.** After import,
   `assets/cover-….jpg` 404s. On add-to-cart read `img.currentSrc || img.src`
   from the card in the DOM, not the authored relative path in `data-*`.
4. **JS navigation must use rewritten permalinks.** `location.href = "konto.html"`
   404s on WordPress. Resolve via `document.querySelector('a[data-lw-page-ref="…"]').href`
   (the importer already rewrote those anchors). Keep the `.html` path only as
   static fallback.
5. **Form CSS must cover both shells.** `.form input` does not win against
   WPForms. Pair every field/button rule with `.leadwerk-wpforms` /
   `.wpforms-*` and set `--wpforms-*` on `.leadwerk-wpforms`. Never target
   `#wpforms-60`. See the class map above. Register/login keep **different**
   `id`s from `forms.sourceFormId`. Exactly one HTML form matches that id.
   WPForms field **labels** come from `project.variables.json`, not from the
   HTML `<label>` text. Keep umlauts and wording identical in both places.
6. **`[hidden]` loses to `display: grid`.** Account cards, empty-cart notices
   and similar siblings that use grid/flex stay visible if you only set the
   `hidden` attribute. Every site stylesheet needs:

   ```css
   [hidden] { display: none !important; }
   ```

7. **Do not hard-code production hosts** in canonical tags, CSS `url()`, or JS.
   Internal links stay project paths plus `data-lw-page-ref`.
8. **Body class from source is preserved** (`_leadwerk_gtd_body_classes`). You
   may scope CSS to `body.dd`. Theme.json / block-library CSS are already
   dequeued by the suite. Brand look stays in the project stylesheet, not in
   the generic `assets/forms.css` (that file is a reset; two-column form grids
   belong only under `.modal`).

Copy-paste helpers live in `templates/project/js/progressive-enhancement.js`.

## Forbidden

- Inline event handlers, `javascript:` URLs, localhost endpoints, embedded secrets
- Changing a released `sourceKey` because the filename or title changed
- Skipping published theme versions on a live WordPress site
- `/en/` HTML shells unless the project is authored multilingual
- Guessing missing schema; fail the build instead
