// Paleta fixa (secção 2 do prompt). Cores fixas = significado fixo.
// Nenhum módulo deve definir outras cores para estes significados.
export const CORES = {
  down: '#22d3ee', // Downstream, luz 1490 nm — azul-ciano
  up: '#f59e0b', // Upstream, luz 1310 nm — âmbar
  omci: '#a855f7', // OMCI — roxo
  gemInternet: '#3b82f6', // GEM Internet — azul
  gemVoz: '#22c55e', // GEM Voz — verde
  gemIptv: '#ef4444', // GEM IPTV — vermelho
  tcont: '#f97316', // T-CONT — contentor laranja
  vlan: '#ffffff', // VLAN — etiqueta branca
  // Cores de apoio (não têm significado técnico)
  alerta: '#ff3b3b',
  aceite: '#4ade80',
  fibra: '#f2c94c',
  destaque: '#ffe9a8',
};

export const LEGENDA = [
  { cor: CORES.down, texto: 'Downstream (1490 nm)', forma: 'linha' },
  { cor: CORES.up, texto: 'Upstream (1310 nm)', forma: 'linha' },
  { cor: CORES.omci, texto: 'OMCI (gestão)', forma: 'linha' },
  { cor: CORES.gemInternet, texto: 'GEM Internet', forma: 'bloco' },
  { cor: CORES.gemVoz, texto: 'GEM Voz', forma: 'bloco' },
  { cor: CORES.gemIptv, texto: 'GEM IPTV', forma: 'bloco' },
  { cor: CORES.tcont, texto: 'T-CONT (Alloc-ID)', forma: 'contentor' },
  { cor: CORES.vlan, texto: 'VLAN (etiqueta)', forma: 'etiqueta' },
];
