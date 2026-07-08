# Style Connect Waitlist Landing Page

A clean, editable waitlist landing page for the Style Connect app launch.

## Files

- `index.html` contains the page content and waitlist form.
- `styles.css` contains the layout, responsive styles, and 3D app preview.
- `script.js` validates and saves waitlist entries.
- `design-system/tokens.css` and `design-system/tokens.json` keep the starter brand tokens in one place.

## Editing

Open this folder in Antigravity and edit the plain HTML, CSS, and JavaScript directly. No build step is required.

## Waitlist Data

By default, form submissions are saved in the visitor browser under `style-connect-waitlist`. To connect a real backend later, set `endpoint` in `script.js`:

```js
const waitlistConfig = {
  storageKey: "style-connect-waitlist",
  endpoint: "https://your-form-endpoint.example/waitlist",
};
```

The form sends `name`, `phone`, `email`, `source`, and `createdAt`.

## Public Brand Source

Instagram URL: https://www.instagram.com/_styleconnect_/

Automation could read the public page title as `Style Connect (@_styleconnect_)`, but Instagram did not expose post content during the build pass. Update the hero copy in `index.html` if the attached brand document or Instagram launch posts include more specific product wording.
