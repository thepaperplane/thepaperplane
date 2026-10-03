import * as React from 'react';
import { getCopy } from '@/lib/copy';
import { cn } from '@/lib/utils';

/**
 * Text the owner can change by clicking on it.
 *
 *   <Editable k="home.hero.lede">The default, as it ships.</Editable>
 *
 * Renders the override from the database if there is one, the default
 * otherwise, and marks the element with `data-edit` so the visual editor —
 * loaded only for the signed-in owner — can find it. For a visitor this is a
 * plain element with one extra attribute and no JavaScript.
 */
export async function Editable({
  k,
  children,
  as: Tag = 'span',
  className,
  multiline = false,
}: {
  k: string;
  children: string;
  as?: React.ElementType;
  className?: string;
  /** Allow line breaks while editing (paragraphs). Headlines stay one line. */
  multiline?: boolean;
}) {
  const copy = await getCopy();
  const text = copy[k]?.text ?? children;
  return (
    <Tag className={className} data-edit={k} data-edit-multiline={multiline || undefined}>
      {text}
    </Tag>
  );
}

/** Resolve a key without rendering an element — for attributes and alt text. */
export async function copyText(k: string, fallback: string): Promise<string> {
  const copy = await getCopy();
  return copy[k]?.text ?? fallback;
}

/**
 * An image the owner can replace by clicking on it. The default is a path in
 * /public or any URL; a replacement is uploaded to the site-media bucket.
 */
export async function EditableImage({
  k,
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
}: {
  k: string;
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
}) {
  const copy = await getCopy();
  const override = copy[k];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the source may be a runtime upload
    <img
      src={override?.url ?? src}
      alt={override?.alt ?? alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={cn(className)}
      data-edit-img={k}
    />
  );
}
