import config from '../content/evento.config.json';
import ui from '../i18n/ui.json';
import { marked } from 'marked';

export type Lang = 'pt' | 'en';
export const langs: Lang[] = ['pt', 'en'];
export const cfg: any = config;

/** Páginas do site. Os critérios são os nove de mérito do edital PAEP 2027 (seção 4 do planejamento). */
export const paginas = [
  { chave: 'inicio', slug: { pt: '', en: '' }, criterios: [1, 2] },
  { chave: 'sobre', slug: { pt: 'sobre', en: 'about' }, criterios: [1, 3] },
  { chave: 'evento', slug: { pt: 'evento', en: 'event' }, criterios: [1, 2] },
  { chave: 'programacao', slug: { pt: 'programacao', en: 'programme' }, criterios: [4] },
  { chave: 'convidados', slug: { pt: 'convidados', en: 'speakers' }, criterios: [2, 5] },
  { chave: 'comite', slug: { pt: 'comite-cientifico', en: 'scientific-committee' }, criterios: [6] },
  { chave: 'comissao', slug: { pt: 'comissao-organizadora', en: 'organising-committee' }, criterios: [7] },
  { chave: 'instituicoes', slug: { pt: 'instituicoes', en: 'institutions' }, criterios: [2, 3, 9] },
  { chave: 'inscricoes', slug: { pt: 'inscricoes', en: 'registration' }, criterios: [8] },
  { chave: 'publicacao', slug: { pt: 'publicacao', en: 'publications' }, criterios: [1, 8] },
  { chave: 'historico', slug: { pt: 'historico', en: 'past-editions' }, criterios: [3] },
  { chave: 'contato', slug: { pt: 'contato', en: 'contact' }, criterios: [] },
] as const;

export type ChavePagina = (typeof paginas)[number]['chave'];

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');

export function href(lang: Lang, chave: ChavePagina): string {
  const slug = paginas.find((p) => p.chave === chave)!.slug[lang];
  return `${base}${lang}/${slug ? slug + '/' : ''}`;
}

export const ativo = (chave: ChavePagina): boolean => cfg.paginasPublicadas[chave] === true;

export const ehPendente = (v: any): boolean =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && 'pendente' in v;

/** Devolve o texto no idioma pedido, aceitando string simples ou objeto {pt, en}. */
export function txt(v: any, lang: Lang): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] ?? '';
}

export function t(chave: string, lang: Lang): string {
  const valor = chave.split('.').reduce((o: any, k) => o?.[k], (ui as any)[lang]);
  return valor ?? chave;
}

const locale: Record<Lang, string> = { pt: 'pt-BR', en: 'en-GB' };

export function fmtData(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale[lang], {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function fmtPeriodo(inicio: string, fim: string | undefined, lang: Lang): string {
  if (!fim || fim === inicio) return fmtData(inicio, lang);
  const faixa = new Intl.DateTimeFormat(locale[lang], {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).formatRange(new Date(`${inicio}T00:00:00Z`), new Date(`${fim}T00:00:00Z`));
  // O Intl separa o intervalo com travessão; o texto do site usa "a" ou "to".
  return faixa.replace(/\s*[–—]\s*/, lang === 'pt' ? ' a ' : ' to ');
}

export function fmtHora(hhmm: string, lang: Lang): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Intl.DateTimeFormat(locale[lang], {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

export function fmtNumero(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locale[lang]).format(n);
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Fonte única do bloco provisório. Qualquer página com este marcador não pode ser publicada. */
export function htmlPendente(
  p: { quem: string; detalhe?: any; rascunho?: any },
  lang: Lang,
  emLinha = false,
): string {
  const tag = emLinha ? 'span' : 'div';
  const rascunho = p.rascunho
    ? `<${emLinha ? 'span' : 'p'} class="pendente__rascunho"><strong>${esc(t('rascunho', lang))}:</strong> ${esc(txt(p.rascunho, lang))}</${emLinha ? 'span' : 'p'}>`
    : '';
  const detalhe = p.detalhe
    ? `<${emLinha ? 'span' : 'p'} class="pendente__detalhe">${esc(txt(p.detalhe, lang))}</${emLinha ? 'span' : 'p'}>`
    : '';
  return (
    `<${tag} class="pendente${emLinha ? ' pendente--linha' : ''}" data-pendente>` +
    `<span class="pendente__tag">${esc(t('aConfirmar', lang))}</span> ` +
    detalhe + rascunho +
    `<${emLinha ? 'span' : 'p'} class="pendente__quem">${esc(t('responsavel', lang))}: ${esc(p.quem)}</${emLinha ? 'span' : 'p'}>` +
    `</${tag}>`
  );
}

const arquivos = import.meta.glob('../content/textos/*/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

/** Lê um texto em Markdown. Marcador provisório: [[PENDENTE: responsável | o que falta]] em linha própria. */
export function texto(nome: string, lang: Lang): { html: string; meta: Record<string, string> } | null {
  const bruto = arquivos[`../content/textos/${lang}/${nome}.md`];
  if (!bruto) return null;
  const m = bruto.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  const corpo = m ? m[2] : bruto;
  if (m) for (const linha of m[1].split('\n')) {
    const i = linha.indexOf(':');
    if (i > 0) meta[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  }
  let html = marked.parse(corpo, { async: false }) as string;
  html = html.replace(/<p>\[\[PENDENTE:\s*(.*?)\s*\|\s*(.*?)\s*\]\]<\/p>/g, (_, quem, detalhe) =>
    htmlPendente({ quem, detalhe }, lang),
  );
  return { html, meta };
}
