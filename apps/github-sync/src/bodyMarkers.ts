const AUTO_START_MARKER = '<!-- figjam:auto-start -->';
const AUTO_END_MARKER = '<!-- figjam:auto-end -->';
const AUTO_WARNING_START = 'Import automatique depuis FigJam — ne pas modifier cette section';
const AUTO_WARNING_END = 'Fin section import automatique';

const FIGJAM_ID_PREFIX = 'figjam-id:';

export function figjamIdMarker(figjamId: string): string {
  return `<!-- ${FIGJAM_ID_PREFIX}${figjamId} -->`;
}

export function extractFigjamId(body: string): string | undefined {
  const match = body.match(/<!--\s*figjam-id:([^\s-][^\s]*)\s*-->/);
  return match?.[1];
}

export function formatBodyForMarkdown(body: string): string {
  return body.replace(/\n/g, '\n\n');
}

export function wrapAutoBody(figjamId: string, body: string): string {
  return [
    figjamIdMarker(figjamId),
    AUTO_START_MARKER,
    AUTO_WARNING_START,
    '',
    body,
    '',
    AUTO_WARNING_END,
    AUTO_END_MARKER,
    '---',
  ].join('\n');
}

export function extractManualContent(existingBody: string): string {
  const endIndex = existingBody.indexOf(AUTO_END_MARKER);
  if (endIndex === -1) return '';
  return existingBody.substring(endIndex + AUTO_END_MARKER.length);
}
