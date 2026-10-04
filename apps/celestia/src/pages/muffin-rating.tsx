import { GetServerSideProps } from 'next';

import { MUFFIN_SHAPES } from 'src/components/shared/muffin-shapes';

const attributes = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .map(([name, value]) => `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${value}"`)
    .join(' ');

/** The five muffins with the first `percent` per cent of the width filled, as the old site's rating image (`/muffin-rating?w=80`) */
export const muffinRatingSvg = (percent: number): string => {
  const shapes = MUFFIN_SHAPES.map(
    (shape) => `<path ${attributes(shape.attrs)} d="${shape.d}" fill-rule="evenodd" clip-rule="evenodd"/>`
  ).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 17" width="150" height="25.5">` +
    `<defs><g id="muffins">${shapes}</g><clipPath id="fill"><rect x="0" y="0" width="${percent}" height="17"/></clipPath></defs>` +
    `<use xlink:href="#muffins" opacity="0.2"/><use xlink:href="#muffins" clip-path="url(#fill)"/></svg>`
  );
};

/** Kept for the links and embeds of the old site: the rating image as an SVG. The site itself draws it with the `MuffinRating` component */
export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const width = Number(typeof query.w === 'string' ? query.w : 0);
  const percent = Number.isFinite(width) ? Math.min(100, Math.max(0, width)) : 0;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(muffinRatingSvg(percent));
  return { props: {} };
};

// The response is the image, the page itself is never rendered
export default function MuffinRatingImage() {
  return null;
}
