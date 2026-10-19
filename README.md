# Site de eventos do FDM

Site estático, em português e inglês, do Laboratório de Filosofia do Direito e a Justiça em Movimento (FDM, DEPRO/CCSA/UFRN). Serve de modelo para outros eventos: nenhum dado de evento fica no código. Tudo o que muda de um evento para outro está em dois lugares.

1. `src/content/evento.config.json`: nome, datas, local, programação, convidados, comitês, instituições, inscrições, publicações e histórico.
2. `src/content/textos/pt/` e `src/content/textos/en/`: textos corridos em Markdown (hoje, apenas `sobre.md`).

A pasta `dist` contém o site já pronto. Para colocar no ar, basta enviar o conteúdo de `dist` ao serviço de hospedagem.

## O que você precisa ter no computador

Apenas o Node.js (versão LTS), baixado em nodejs.org. Para conferir, abra o terminal na pasta do projeto e digite `node -v`. Deve aparecer um número de versão.

Na primeira vez, digite:

```bash
npm install
```

## Como atualizar um dado

1. Abra `src/content/evento.config.json` em um editor de texto.
2. Procure o campo. Um dado que ainda não se sabe aparece assim:

   ```json
   "cidade": { "pendente": { "quem": "Prof. Danilo Vaz-Curado Costa", "detalhe": { "pt": "...", "en": "..." } } }
   ```

3. Troque tudo isso pelo valor definitivo. Para texto simples, escreva as duas línguas:

   ```json
   "cidade": { "pt": "Natal/RN", "en": "Natal, Brazil" }
   ```

   Datas ficam no formato `"2027-07-14"` (ano, mês, dia). O site escreve a data por extenso sozinho.
4. Salve e rode `npm run build` (veja abaixo).

### Datas do evento

```json
"datas": { "inicio": "2027-07-14", "fim": "2027-07-16" }
```

### Programação, convidados, comitê e comissão

Troque o bloco `pendente` por uma lista. Exemplo de programação (cada atividade precisa de título, natureza, data, horário, local, formato e palestrante; o formato é “Presencial” ou “Remoto” e é exigido pelo edital em eventos semipresenciais, item 4.9.1):

```json
"programacao": [
  {
    "data": "2027-07-14",
    "inicio": "09:00",
    "fim": "10:30",
    "titulo": { "pt": "Título da atividade", "en": "Activity title" },
    "natureza": { "pt": "Conferência", "en": "Lecture" },
    "local": { "pt": "Auditório X", "en": "Auditorium X" },
    "formato": { "pt": "Presencial", "en": "In person" },
    "palestrantes": ["Nome Completo"]
  }
]
```

Exemplo de pessoa (convidados, `comiteCientifico` e `comissaoOrganizadora`):

```json
"convidados": [
  {
    "titulo": "Prof. Dr.",
    "nome": "Nome Completo",
    "vinculo": { "pt": "Universidade tal", "en": "University of such" },
    "regiao": { "pt": "Sudeste, Brasil", "en": "Southeast, Brazil" }
  }
]
```

### Eixos temáticos

```json
"eixos": [ { "pt": "Eixo 1", "en": "Axis 1" }, { "pt": "Eixo 2", "en": "Axis 2" } ]
```

## Como liberar uma página para publicação

Cada página tem uma chave em `paginasPublicadas`, no fim do arquivo `evento.config.json`. Enquanto estiver `false`, a página mostra uma faixa de aviso e fica fora dos buscadores. Quando todos os dados da página estiverem preenchidos, troque para `true`.

O site recusa publicar uma página que ainda tenha bloco “A CONFIRMAR”. Se isso acontecer, o comando de build termina com a mensagem de erro e o nome da página.

## Como gerar o site

```bash
npm run build
```

Se tudo estiver certo, a última linha informa quantas páginas estão publicadas e quantas ainda são rascunho. O resultado fica na pasta `dist`.

Para ver o site antes de publicar:

```bash
npm run preview
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:4321/pt/).

## Como criar um novo evento

1. Copie a pasta inteira do projeto (sem `node_modules`).
2. Em `evento.config.json`, troque os dados do evento e devolva `paginasPublicadas` para `false`.
3. Troque os textos em `src/content/textos`.
4. Para outro grupo, troque também os dados da seção `grupo` e os arquivos de `public/img` (veja a marca, abaixo).

## Marca

A identidade visual segue o manual do FDM (`Identidade_Visual_FDM.md`): azul `#12233F`, cinza de apoio `#5A6372`, borda `#C5CBD6`, zebra `#EEF1F6`, fonte Jost nos títulos e Spectral no corpo. As imagens em `public/img` são recortes dos PNGs oficiais. Para gerá-las de novo, rode `npm run marca`. Não recolora, não distorça e não adicione sombra ou contorno à coruja.

## Hospedagem gratuita

O conteúdo de `dist` funciona em Cloudflare Pages, Netlify ou GitHub Pages. Se o endereço do site tiver uma subpasta (por exemplo, GitHub Pages de projeto), gere o site informando a pasta:

```bash
SITE_BASE=/nome-do-repositorio npm run build
```

No Windows (PowerShell): `$env:SITE_BASE="/nome-do-repositorio"; npm run build`.

Despesas com domínio ou hospedagem paga antes da vigência do auxílio não são elegíveis (itens 14.2 e 14.3 do edital CAPES nº 25/2026).

## Formulários e dados pessoais

O site não coleta dados pessoais. Inscrição e submissão de trabalhos devem apontar para um formulário externo. Em `inscricoes`, no `evento.config.json`, troque o bloco `pendente` por um link:

```json
"inscricao": { "url": "https://endereco-do-formulario", "texto": { "pt": "Inscreva-se aqui", "en": "Register here" } }
```

## Mapa das páginas e critérios do edital

Cada página serve de evidência para critérios de mérito do edital. A lista está em `src/lib/site.ts`, na constante `paginas`, campo `criterios`. O conteúdo do site e o digitado no SICAPES devem ser idênticos.

## Exportar o site inteiro em um único arquivo HTML

Para enviar o site por e-mail ou WhatsApp, ou abri-lo com duplo clique sem servidor:

```bash
npm run exportar-html
```

O comando roda o build e grava `exportacoes/site-fdm-completo.html`, com todas as páginas, em português e em inglês, estilos, fontes e imagens embutidos. A navegação entre páginas funciona dentro do próprio arquivo. O botão do Instagram só carrega o feed se houver internet. Gere o arquivo de novo sempre que alterar o conteúdo.

## Publicação automática (GitHub Pages)

O repositório publica o site sozinho. A cada alteração enviada à branch `main`, o GitHub roda o build e coloca o resultado no ar em `labfdm.com.br`. Para atualizar:

1. No GitHub, abra `src/content/evento.config.json` e clique no lápis (Edit).
2. Troque o dado, em Commit changes, e confirme.
3. Em 1 a 3 minutos o site está atualizado. Acompanhe na aba **Actions**. Se o build falhar, a versão anterior continua no ar e a aba mostra o motivo (por exemplo, uma página marcada como publicada com bloco “A CONFIRMAR”).

Ajuste único, feito uma vez em **Settings > Pages**: em *Build and deployment > Source*, escolha **GitHub Actions** e, em *Custom domain*, informe `labfdm.com.br`.
