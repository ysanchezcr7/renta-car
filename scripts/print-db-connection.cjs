/**
 * Muestra usuario/host/puerto/base de DATABASE_URL sin imprimir la contraseña.
 * Útil si P1000: verifica que la URL se parsea bien (p. ej. contraseña con @ mal codificada).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error('DATABASE_URL no está definida en .env');
  process.exit(1);
}

let u;
try {
  u = new URL(raw.replace(/^postgresql:/i, 'http:'));
} catch {
  console.error(
    'DATABASE_URL no es una URL válida. Si la contraseña tiene @, :, #, /, etc.,',
  );
  console.error('codifícala (ej. @ → %40, # → %23). Ver: https://www.prisma.io/docs/orm/reference/connection-urls');
  process.exit(1);
}

const db = (u.pathname || '').replace(/^\//, '').split('?')[0] || '(vacía)';
console.log('DATABASE_URL parseada:');
console.log('  Usuario :', decodeURIComponent(u.username || '(vacío)'));
console.log('  Password:', u.password ? `(${u.password.length} caracteres)` : '(vacía)');
console.log('  Host    :', u.hostname);
console.log('  Puerto  :', u.port || '5432');
console.log('  Base    :', db);
console.log('');
console.log('Si P1000 persiste: el usuario/contraseña no coinciden con lo que acepta tu servidor PostgreSQL.');
