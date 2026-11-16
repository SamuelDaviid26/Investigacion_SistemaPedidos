import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { BASE_DE_DATOS, SERVIDOR_SQL, URL_API, USUARIO_COCINA } from './entorno';

// Crea la cuenta de cocina de las pruebas. La API no expone un endpoint para asignar roles,
// así que el rol se asigna directamente en la base de pruebas.
export default async function globalSetup(): Promise<void> {
  const respuesta = await fetch(`${URL_API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USUARIO_COCINA)
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudo registrar la cuenta de cocina (${respuesta.status}): ${await respuesta.text()}`);
  }

  const resultado = spawnSync('sqlcmd', [
    '-S', SERVIDOR_SQL, '-E', '-C', '-I', '-d', BASE_DE_DATOS, '-b',
    '-i', resolve(__dirname, 'sql', 'asignar-rol-cocina.sql'),
    '-v', `Usuario=${USUARIO_COCINA.username}`
  ], { encoding: 'utf8' });

  if (resultado.status !== 0) {
    throw new Error(`No se pudo asignar el rol Cocina:\n${resultado.stdout}${resultado.stderr}`);
  }
}
