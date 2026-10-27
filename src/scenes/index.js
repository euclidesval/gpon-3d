import { cenaPorFazer } from './placeholder.js';
import s00 from './s00-rede.js';
import s01 from './s01-problemas.js';
import s02 from './s02-downstream.js';
import s03 from './s03-upstream.js';
import s04 from './s04-omci.js';
import s05 from './s05-tcont.js';
import s06 from './s06-gem.js';
import s07 from './s07-perfil.js';

// Registo ordenado das 11 cenas (a ordem tem de coincidir com cenas.pt.json).
export const CENAS = [
  s00,
  s01,
  s02,
  s03,
  s04,
  s05,
  s06,
  s07,
  cenaPorFazer('s08-ponta-a-ponta'),
  cenaPorFazer('s09-analogia'),
  cenaPorFazer('s10-resumo'),
];
