import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const root = new URL('../', import.meta.url)
const folder = new URL('publications/', root)
const dist = new URL('dist/', root)
const stories = JSON.parse(await readFile(new URL('histoires.json', root), 'utf8'))
const byId = new Map(stories.map(story => [story.id, story]))
const words = new Intl.Segmenter('fr', { granularity: 'word' })
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const dateLabel = date => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'))
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

if (!stories.length || byId.size !== stories.length) throw new Error('Catalogue vide ou identifiants dupliqués.')
for (const story of stories) {
  const count = [...words.segment(story.paragraphs.join(' '))].filter(word => word.isWordLike).length
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.id) || !story.title || !story.tradition || !story.source.label
    || URL.parse(story.source.url)?.protocol !== 'https:' || story.paragraphs.length < 3 || count < 80 || count > 230) {
    throw new Error(`Histoire invalide : ${story.id} (${count} mots).`)
  }
}

async function readPublications() {
  const names = (await readdir(folder)).filter(name => name.endsWith('.md')).sort()
  return Promise.all(names.map(async name => {
    const date = name.slice(0, -3)
    const text = await readFile(new URL(name, folder), 'utf8')
    const id = /^<!-- histoire:([a-z0-9-]+) -->\n/.exec(text)?.[1]
    if (!datePattern.test(date) || !byId.has(id)) throw new Error(`Publication invalide : ${name}.`)
    return { date, id }
  }))
}

async function publish(publications, date) {
  if (!datePattern.test(date)) throw new Error('Date invalide.')
  if (publications.some(publication => publication.date === date)) return
  const last = new Map(publications.map(publication => [publication.id, publication.date]))
  const story = stories.find(item => !last.has(item.id))
    ?? stories.reduce((oldest, item) => last.get(item.id) < last.get(oldest.id) ? item : oldest)
  const text = `<!-- histoire:${story.id} -->\n# ${story.title}\n\n${story.paragraphs.join('\n\n')}\n\n---\n\nTradition ${story.tradition}. Adaptation libre d’après [${story.source.label}](${story.source.url}).\n`
  try {
    await writeFile(new URL(date + '.md', folder), text, { flag: 'wx' })
    console.log(`${date} · ${story.title}`)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

const { values } = parseArgs({ options: { publish: { type: 'boolean' } } })
await mkdir(folder, { recursive: true })
let publications = await readPublications()
if (values.publish) {
  const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())
  await publish(publications, today)
  publications = await readPublications()
}
const first = new Map()
for (const { date, id } of publications) if (!first.has(id)) first.set(id, date)
const latest = publications.at(-1)

function layout(title, body, base) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Des mythes du monde à lire à voix haute en français, dès 4 ans.">
  <title>${escape(title)}</title>
  <link rel="stylesheet" href="${base}style.css">
</head>
<body>
  <a class="skip" href="#contenu">Aller au contenu</a>
  <header class="top"><a class="brand" href="${base}">Les Petits Mythes</a><a href="${base}#bibliotheque">Les histoires</a></header>
  ${body}
</body>
</html>
`
}

function home() {
  const story = latest && byId.get(latest.id)
  const archive = [...first.keys()].reverse().filter(id => id !== latest?.id)
  return layout('Les Petits Mythes', `<main class="home" id="contenu" tabindex="-1">
  <h1>Les Petits Mythes</h1>
  <p class="intro">Une courte histoire du monde à lire ensemble, dès 4 ans.</p>
  ${story ? `<section class="featured" aria-labelledby="aujourdhui">
    <p class="meta">${first.get(story.id) === latest.date ? 'Histoire du jour' : 'À relire aujourd’hui'} · <time datetime="${latest.date}">${dateLabel(latest.date)}</time></p>
    <h2 id="aujourdhui">${escape(story.title)}</h2>
    <p>${escape(story.paragraphs[0])}</p>
    <a class="read" href="histoires/${story.id}/">Lire l’histoire <span aria-hidden="true">→</span></a>
  </section>` : ''}
  <section class="library" id="bibliotheque" aria-labelledby="library-title">
    <h2 id="library-title">Les histoires à retrouver</h2>
    ${archive.length ? `<ul>${archive.map(id => `<li><a href="histoires/${id}/">${escape(byId.get(id).title)}</a></li>`).join('')}</ul>` : '<p>Les prochaines histoires apparaîtront ici.</p>'}
  </section>
</main>`, './')
}

function storyPage(story) {
  return layout(`${story.title} | Les Petits Mythes`, `<main class="reading" id="contenu" tabindex="-1">
  <article>
    <p class="meta">Tradition ${escape(story.tradition)}</p>
    <h1>${escape(story.title)}</h1>
    <div class="story-text">${story.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('\n      ')}</div>
  </article>
  <details><summary>Origine de l’histoire</summary><p>Adaptation libre d’après <a href="${escape(story.source.url)}">${escape(story.source.label)}</a>.</p></details>
  <p><a class="return" href="../../#bibliotheque">← Toutes les histoires</a></p>
</main>`, '../../')
}

await mkdir(dist, { recursive: true })
await Promise.all([
  copyFile(new URL('style.css', root), new URL('style.css', dist)),
  writeFile(new URL('index.html', dist), home()),
  ...[...first.keys()].map(async id => {
    const output = new URL(`histoires/${id}/`, dist)
    await mkdir(output, { recursive: true })
    await writeFile(new URL('index.html', output), storyPage(byId.get(id)))
  }),
])
