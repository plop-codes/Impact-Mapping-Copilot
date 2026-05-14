import { describe, expect, it } from 'vitest';
import {
  extractFigjamId,
  extractManualContent,
  figjamIdMarker,
  wrapAutoBody,
} from '../src/bodyMarkers';

describe('bodyMarkers', () => {
  it('emet un marqueur figjam-id parseable', () => {
    const body = wrapAutoBody('node-42', 'contenu');
    expect(extractFigjamId(body)).toBe('node-42');
  });

  it('preserve le contenu manuel apres la section auto', () => {
    const wrapped = wrapAutoBody('node-1', 'auto');
    const withManual = wrapped + '\n\n## Notes manuelles\nbla bla';
    const manual = extractManualContent(withManual);
    expect(manual).toContain('## Notes manuelles');
    expect(manual).toContain('bla bla');
  });

  it('renvoie chaine vide si aucun marqueur de fin', () => {
    expect(extractManualContent('aucun marqueur ici')).toBe('');
  });

  it('marqueur figjamIdMarker est stable', () => {
    expect(figjamIdMarker('abc')).toBe('<!-- figjam-id:abc -->');
  });
});
