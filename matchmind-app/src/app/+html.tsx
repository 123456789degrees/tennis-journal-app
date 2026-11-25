import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

// Web-only root HTML wrapper. Without this, the page had no <title> (the
// browser tab just showed the raw URL) and no meta description for search
// results/link previews — app.json's web.favicon already points at the new
// logo mark, so that part needed no change here.
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
