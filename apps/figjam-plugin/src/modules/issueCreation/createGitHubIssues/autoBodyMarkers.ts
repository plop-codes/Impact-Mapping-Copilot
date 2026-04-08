const AUTO_START_MARKER = '<!-- figjam:auto-start -->';
const AUTO_END_MARKER = '<!-- figjam:auto-end -->';
const AUTO_WARNING_START = '⚠️ Import automatique depuis FigJam — ne pas modifier cette section';
const AUTO_WARNING_END = '⚠️ Fin section import automatique';

export class AutoBodyMarkers {
  static formatBodyForMarkdown(body: string): string {
    return body.replace(/\n/g, '\n\n');
  }

  static wrapAutoBody(body: string): string {
    return [
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

  static extractManualContent(existingBody: string): string {
    const endIndex = existingBody.indexOf(AUTO_END_MARKER);
    if (endIndex === -1) return '';
    return existingBody.substring(endIndex + AUTO_END_MARKER.length);
  }
}
