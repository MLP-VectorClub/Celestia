import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document';

import { ThemeChoice, colorSchemeContent, isExplicitTheme, parseTheme } from 'src/utils/theme';

interface CelestiaDocumentProps extends DocumentInitialProps {
  theme: ThemeChoice;
}

/**
 * Puts the visitor's saved theme on `<html>` while rendering on the server, so a reload shows it without any JavaScript. Without a saved
 * choice there is no attribute and the stylesheet follows the device (`prefers-color-scheme`, see `_theme.scss`).
 */
class CelestiaDocument extends Document<CelestiaDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<CelestiaDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, theme: parseTheme(ctx.req?.headers.cookie) };
  }

  render() {
    const { theme } = this.props;
    return (
      <Html data-bs-theme={isExplicitTheme(theme) ? theme : undefined}>
        <Head>
          <meta name="color-scheme" content={colorSchemeContent(theme)} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default CelestiaDocument;
