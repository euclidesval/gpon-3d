import { cenaPorFazer } from './placeholder.js';
import s00 from './s00-rede.js';
import s01 from './s01-problemas.js';
import s02 from './s02-downstream.js';
import s03 from './s03-upstream.js';

// Registo ordenado das 11 cenas (a ordem tem de coincidir com cenas.pt.json).
export const CENAS = [
  s00,
  s01,
  s02,
  s03,
  cenaPorFazer('s04-omci'),
  cenaPorFazer('s05-tcont'),
  cenaPorFazer('s06-gem'),
  cenaPorFazer('s07-perfil'),
  cenaPorFazer('s08-ponta-a-ponta'),
  cenaPorFazer('s09-analogia'),
  cenaPorFazer('s10-resumo'),
];
