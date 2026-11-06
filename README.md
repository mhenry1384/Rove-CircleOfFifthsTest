# Circle of Fifths Quiz

A simple web-based quiz for practicing major and minor key signatures using the circle of fifths.

## Features

- Practice major and minor key signatures
- Choose quiz difficulty level
- Switch between major, minor, or both modes
- Interactive staff display with sharps and flats
- Score tracking and reset button

## How to Run

Open [index.html](index.html) in your browser to start the quiz.

## Project Files

- [index.html](index.html) — App structure
- [style.css](style.css) — Styling for the quiz UI
- [app.js](app.js) — Quiz logic and interactions

## Notes

This project is a lightweight front-end app built with plain HTML, CSS, and JavaScript.

## Install on Android

The app is a Progressive Web App (PWA): it has a web manifest ([manifest.webmanifest](manifest.webmanifest)) and a service worker ([sw.js](sw.js)) so it can be installed to the home screen and works offline.

1. Host the folder over HTTPS (e.g. GitHub Pages: repo **Settings → Pages → Deploy from branch → main / root**).
2. Open the site in Chrome on Android.
3. Tap **Install app** (or ⋮ menu → **Add to Home screen → Install**).

The service worker is network-first: when online the app always loads the latest files; offline it uses the cached copy. Bumping `CACHE` in [sw.js](sw.js) (e.g. `fifths-quiz-v2`) is optional and just clears out old cached files.

Icons live in [icons/](icons/); `icon-maskable.svg` is the source for the maskable Android icon.
