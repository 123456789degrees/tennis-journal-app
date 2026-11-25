import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

// Web-only root HTML wrapper. Without this, the page had no <title> (the
// browser tab just showed the raw URL) and no meta description for search
// results/link previews — app.json's web.favicon already points at the new
// logo mark, so that part needed no change here.
//
// The apple-* tags below are for iOS Safari's "Add to Home Screen": without
// them, the home-screen icon is just a screenshot of the page and the name
// under it is whatever the current tab's title happened to be — not
// necessarily "MatchMind". apple-touch-icon.png lives in public/ (served at
// the site root) and is a flat, opaque 180x180 render of the same mark used
// everywhere else — iOS applies its own rounding/shine on top, so it can't
// have transparency or corners baked in.
export default function Root({ children }: { children: React.ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>MatchMind — Tennis match journal &amp; AI practice plans</title>
        <meta
          name="description"
          content="Log your tennis matches by typing or talking, scout your opponents, and get AI-generated practice plans built from your own playstyle and match history."
        />

        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="MatchMind" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0E3B2E" />

        <ScrollViewStyleReset />

        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
