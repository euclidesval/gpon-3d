import { cenaPorFazer } from './placeholder.js';

// Registo ordenado das 11 cenas (a ordem tem de coincidir com cenas.pt.json).
export const CENAS = [
  's00-rede',
  's01-problemas',
  's02-downstream',
  's03-upstream',
  's04-omci',
  's05-tcont',
  's06-gem',
  's07-perfil',
  's08-ponta-a-ponta',
  's09-analogia',
  's10-resumo',
].map(cenaPorFazer);
