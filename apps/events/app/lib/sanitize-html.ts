import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML content from event descriptions before rendering.
 * Allows only safe tags produced by the Tiptap editor.
 */
export function sanitizeEventHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'target', 'rel'],
    },
  });
}
