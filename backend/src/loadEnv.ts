// Laadt .env in process.env. Wordt als allereerste geïmporteerd in index.ts,
// zodat DATABASE_URL beschikbaar is voordat de Prisma-clients worden aangemaakt.
try {
  (process as any).loadEnvFile?.();
} catch {
  /* geen .env aanwezig — in productie komen de variabelen uit de host-omgeving */
}
