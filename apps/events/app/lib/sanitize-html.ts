import sanitizeHtml from 'sanitize-html';

const TIPTAP_ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'strong',
  'em',
  'u',
  'code',
  'blockquote',
  'ul',
  'ol',
  'li',
  'br',
  'hr',
  'a',
];

/**
 * Sanitize HTML content from event descriptions before rendering.
 * Allows only the tags produced by the Tiptap StarterKit + Link extensions.
 */
export function sanitizeEventHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: TIPTAP_ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href'],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          href: attribs.href ?? '',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  });
}
