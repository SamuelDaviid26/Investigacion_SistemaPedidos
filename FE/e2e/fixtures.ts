import { APIRequestContext, expect, Page, test as base } from '@playwright/test';
import { CLAVE, URL_API, URL_FE, USUARIO_COCINA } from './entorno';

export interface Cuenta {
  username: string;
  password: string;
}

export interface DatosPedido {
  plato: string;
  cantidad: number;
  observacion: string;
}

// Los datos de cada prueba llevan una marca irrepetible, así las pruebas pueden correr en
// paralelo sobre la misma base sin ver los pedidos de las demás.
export function marcaUnica(prefijo: string): string {
  const azar = Math.random().toString(36).slice(2, 8);
  return `${prefijo}-${Date.now().toString(36)}-${azar}`;
}

export async function registrarCuenta(request: APIRequestContext): Promise<Cuenta> {
  const cuenta = { username: marcaUnica('cliente'), password: CLAVE };
  const respuesta = await request.post(`${URL_API}/api/auth/register`, { data: cuenta });
  expect(respuesta.status()).toBe(201);
  return cuenta;
}

export async function obtenerToken(request: APIRequestContext, cuenta: Cuenta): Promise<string> {
  const respuesta = await request.post(`${URL_API}/api/auth/login`, { data: cuenta });
  expect(respuesta.ok()).toBe(true);
  return (await respuesta.json()).token;
}

export async function crearPedidoApi(
  request: APIRequestContext,
  token: string,
  datos: Partial<DatosPedido> = {}
): Promise<{ id: number; observacion: string }> {
  const pedido = { plato: 'Hamburguesa', cantidad: 1, observacion: marcaUnica('pedido'), ...datos };
  const respuesta = await request.post(`${URL_API}/api/pedidos`, {
    data: pedido,
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(respuesta.status()).toBe(201);
  return respuesta.json();
}

export async function iniciarSesion(page: Page, cuenta: Cuenta, destino: RegExp): Promise<void> {
  await page.goto('/acceso');
  await page.getByLabel('Usuario').fill(cuenta.username);
  await page.getByLabel('Contraseña').fill(cuenta.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(destino);
}

// El token vive solo en memoria, así que recargar la página cierra la sesión. Para probar
// las rutas protegidas con sesión abierta se navega con el historial, sin recargar.
export async function navegarSinRecargar(page: Page, ruta: string): Promise<void> {
  await page.evaluate(destino => {
    window.history.pushState({}, '', destino);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, ruta);
}

export function pedidoConMarca(page: Page, marca: string) {
  return page.getByTestId('pedido').filter({ hasText: marca });
}

interface Fixtures {
  cliente: Cuenta;
  paginaCocina: Page;
}

export const test = base.extend<Fixtures>({
  cliente: async ({ request }, use) => {
    await use(await registrarCuenta(request));
  },

  paginaCocina: async ({ browser }, use) => {
    const contexto = await browser.newContext({ baseURL: URL_FE });
    const pagina = await contexto.newPage();
    await iniciarSesion(pagina, USUARIO_COCINA, /\/cocina$/);
    await use(pagina);
    await contexto.close();
  }
});

export { expect };
