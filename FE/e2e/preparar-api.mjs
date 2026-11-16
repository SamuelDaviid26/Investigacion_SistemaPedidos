// Prepara la base de datos de pruebas y deja corriendo la API contra ella.
// Lo invoca el webServer de playwright.config.ts, que le pasa las variables de entorno.
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const servidor = process.env.E2E_SQL_SERVER ?? 'localhost';
const baseDeDatos = process.env.E2E_DB ?? 'SistemaPedidosDB_E2E';
const proyectoApi = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'BE', 'TodoApi');

if (!/^[A-Za-z0-9_]+_E2E$/.test(baseDeDatos)) {
  console.error(`Por seguridad la base de pruebas debe terminar en "_E2E" (recibido: "${baseDeDatos}").`);
  process.exit(1);
}

function ejecutar(comando, argumentos) {
  const resultado = spawnSync(comando, argumentos, { stdio: 'inherit' });
  if (resultado.error || resultado.status !== 0) {
    console.error(`Falló: ${comando} ${argumentos.join(' ')}`);
    process.exit(resultado.status ?? 1);
  }
}

console.log(`[e2e] Recreando la base ${baseDeDatos} en ${servidor}`);
ejecutar('sqlcmd', [
  '-S', servidor, '-E', '-C', '-b', '-Q',
  `IF DB_ID(N'${baseDeDatos}') IS NOT NULL BEGIN ` +
    `ALTER DATABASE [${baseDeDatos}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; ` +
    `DROP DATABASE [${baseDeDatos}]; END`
]);

ejecutar('dotnet', ['build', proyectoApi, '--nologo', '-v', 'q']);
ejecutar('dotnet', ['ef', 'database', 'update', '--project', proyectoApi, '--no-build']);

const api = spawn('dotnet', ['run', '--project', proyectoApi, '--no-build', '--no-launch-profile'], {
  stdio: 'inherit'
});
api.on('exit', codigo => process.exit(codigo ?? 0));
process.on('SIGTERM', () => api.kill());
process.on('SIGINT', () => api.kill());
