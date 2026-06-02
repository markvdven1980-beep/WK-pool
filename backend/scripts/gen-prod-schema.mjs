// Genereert prisma/schema.production.prisma uit prisma/schema.prisma,
// met PostgreSQL als provider. Zo blijft er één bron van waarheid voor de modellen
// (lokaal SQLite, productie PostgreSQL/Supabase).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', 'prisma', 'schema.prisma');
const out = join(here, '..', 'prisma', 'schema.production.prisma');

let schema = readFileSync(src, 'utf8');
schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

writeFileSync(
  out,
  `// AUTOMATISCH GEGENEREERD uit schema.prisma — niet handmatig bewerken.\n${schema}`,
);
console.log('schema.production.prisma gegenereerd (PostgreSQL).');
