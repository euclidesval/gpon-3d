import { describe, it, expect } from 'vitest';
import { formatar, escapar } from '../src/ui/texto.js';

const siglas = { ONT: 'x', OLT: 'y', 'T-CONT': 'z', VLAN: 'v', LAN: 'l', GEM: 'g', PON: 'p', GPON: 'gp' };

describe('formatar', () => {
  it('marca as siglas com tooltip', () => {
    const h = formatar('A OLT fala com a ONT.', siglas);
    expect(h).toContain('data-sigla="OLT"');
    expect(h).toContain('data-sigla="ONT"');
  });
  it('não confunde siglas dentro de outras palavras', () => {
    const h = formatar('VLAN e GPON', siglas);
    expect(h).not.toContain('data-sigla="LAN"');
    expect(h).not.toContain('data-sigla="PON"');
    expect(h).toContain('data-sigla="VLAN"');
    expect(h).toContain('data-sigla="GPON"');
  });
  it('reconhece siglas com hífen', () => {
    expect(formatar('O T-CONT 1', siglas)).toContain('data-sigla="T-CONT"');
  });
  it('transforma `código` em <code> sem marcar siglas lá dentro', () => {
    const h = formatar('Ver `ont add` na OLT', siglas);
    expect(h).toContain('<code>ont add</code>');
  });
  it('escapa HTML', () => {
    expect(escapar('<b>&')).toBe('&lt;b&gt;&amp;');
    expect(formatar('<script>', siglas)).not.toContain('<script>');
  });
});
