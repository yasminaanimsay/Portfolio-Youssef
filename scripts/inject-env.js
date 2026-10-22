const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const output = path.join(root, 'dist');
const fallbackCalendlyUrl = 'https://calendly.com/your-username/intro-call';

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const separator = line.indexOf('=');
        if (separator < 0) return null;
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        return [key, value];
      })
      .filter(Boolean)
  );
}

const localEnv = readEnvFile(path.join(root, '.env'));
const gtmId = process.env.GTM_ID ?? localEnv.GTM_ID ?? '';
const calendlyUrl = (process.env.CALENDLY_URL ?? localEnv.CALENDLY_URL ?? '').trim() || fallbackCalendlyUrl;

if (gtmId && !/^GTM-[A-Z0-9]+$/.test(gtmId)) {
  throw new Error('GTM_ID must be a valid GTM container ID (for example, GTM-ABC1234).');
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  const source = path.join(root, entry.name);
  const destination = path.join(output, entry.name);
  fs.cpSync(source, destination, {
    recursive: true,
    filter(candidate) {
      const relativePath = path.relative(root, candidate);
      return !relativePath.split(path.sep).some(segment =>
        segment === 'node_modules' || segment === 'scripts' || segment === '.git' || segment === 'dist' || segment.startsWith('.env')
      );
    }
  });
}

const headSnippet = gtmId
  ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`
  : '';
const bodySnippet = gtmId
  ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`
  : '';

function processHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (!/<html\b/i.test(html)) return;

  html = html.replace(/__CALENDLY_URL__/g, calendlyUrl);
  for (const [name, snippet] of [['HEAD', headSnippet], ['BODY', bodySnippet]]) {
    const marker = new RegExp(`<!-- GTM-${name}-START -->([\\s\\S]*?)<!-- GTM-${name}-END -->`, 'g');
    const matches = [...html.matchAll(marker)];
    if (matches.length !== 1) {
      throw new Error(`${path.relative(output, filePath)} must contain exactly one GTM-${name} marker pair.`);
    }
    html = html.replace(marker, `<!-- GTM-${name}-START -->${snippet}<!-- GTM-${name}-END -->`);
  }

  if (html.includes('__CALENDLY_URL__')) {
    throw new Error(`Unresolved __CALENDLY_URL__ placeholder in ${path.relative(output, filePath)}.`);
  }
  fs.writeFileSync(filePath, html);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) processHtml(filePath);
  }
}

walk(output);
console.log(`GTM_ID: ${gtmId || '(empty; GTM disabled)'}`);
console.log(`CALENDLY_URL: ${calendlyUrl}`);