# Jina Reader Tampermonkey Script

Convert the current page into LLM-friendly Markdown via `r.jina.ai` with a hotkey and menu commands.

## Features

- One-key convert (default: `Alt+J`)
- Optional API key for higher rate limits
- Optional dynamic-page waits (`x-wait-for-selector`)
- Optional content targeting (`x-target-selector`)
- Optional cache controls (`x-no-cache`, `x-cache-tolerance`)
- Auto-copy to clipboard
- Open result in a new tab

## Install

1. Install Tampermonkey.
2. Open Tampermonkey → Dashboard → Add new script.
3. Paste the content of `jina-reader.user.js` into the editor.
4. Save.

## Usage

- Press `Alt+J` on any page to fetch Markdown via Jina Reader.
- Or open Tampermonkey menu → **Jina Reader: Convert page now**.

## Configuration

Open the Tampermonkey menu on any page to configure:

- API key
- `respondWith`: `markdown` / `html` / `text` / `screenshot`
- `waitForSelector`
- `targetSelector`
- `cacheToleranceSeconds`
- `noCache`
- `openInNewTab`
- `autoCopy`
- hotkey

Settings persist via Tampermonkey storage.

## Notes

- Logged-in/paid content may not work.
- Very dynamic SPAs may need `waitForSelector`.

## Thanks

- Jina Reader: `https://github.com/jina-ai/reader`

## License

MIT
