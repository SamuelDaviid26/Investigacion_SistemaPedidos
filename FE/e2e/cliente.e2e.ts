import {
  crearPedidoApi,
  expect,
  iniciarSesion,
  marcaUnica,
  navegarSinRecargar,
  obtenerToken,
  pedidoConMarca,
  registrarCuenta,
  test
} from './fixtures';

const ALIMENTOS = [
  'Fresco', 'Hamburguesa', 'Helado', 'Hot dog', 'Milkshake', 'Papas', 'Pollo', 'Sándwich'
];

test.describe('cliente', () => {
  test('el menú muestra los alimentos del catálogo', async ({ page, cliente }) => {
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);

    for (const alimento of ALIMENTOS) {
      await expect(page.getByRole('button', { name: alimento, exact: true })).toBeVisible();
    }
    await expect(page.getByText('Elegí un alimento del menú.')).toBeVisible();
  });

  test('crea un pedido y lo ve en Mis pedidos como Recibido', async ({ page, cliente }) => {
    const marca = marcaUnica('detalle');
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);

    await page.getByRole('button', { name: 'Hamburguesa', exact: true }).click();
    await page.getByLabel('Cantidad').fill('2');
    await page.getByLabel('Detalle (opcional)').fill(marca);
    await page.getByRole('button', { name: 'Enviar pedido' }).click();

    await expect(page.getByText(/Pedido #\d+ recibido: 2 × Hamburguesa\./)).toBeVisible();
    await expect(page.getByText('Elegí un alimento del menú.')).toBeVisible();

    await page.getByRole('link', { name: 'Mis pedidos' }).click();

    await expect(page).toHaveURL(/\/mis-pedidos$/);
    const pedido = pedidoConMarca(page, marca);
    await expect(pedido).toHaveCount(1);
    await expect(pedido).toContainText('2 × Hamburguesa');
    await expect(pedido).toContainText('Recibido');
  });

  test('no permite enviar una cantidad inválida', async ({ page, cliente }) => {
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);

    await page.getByRole('button', { name: 'Papas', exact: true }).click();
    await page.getByLabel('Cantidad').fill('0');

    await expect(page.getByText('Ingresá una cantidad entera mayor que cero.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar pedido' })).toBeDisabled();

    await page.getByLabel('Cantidad').fill('3');
    await expect(page.getByRole('button', { name: 'Enviar pedido' })).toBeEnabled();
  });

  test('Mis pedidos sin pedidos invita a hacer el primero', async ({ page, cliente }) => {
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);
    await page.getByRole('link', { name: 'Mis pedidos' }).click();

    await expect(page.getByText('Todavía no tenés pedidos.')).toBeVisible();
    await expect(page.getByTestId('pedido')).toHaveCount(0);
  });

  test('solo ve sus propios pedidos y no los de otro cliente', async ({ page, request, cliente }) => {
    const otro = await registrarCuenta(request);
    const propio = await crearPedidoApi(request, await obtenerToken(request, cliente));
    const ajeno = await crearPedidoApi(request, await obtenerToken(request, otro));

    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);
    await page.getByRole('link', { name: 'Mis pedidos' }).click();

    await expect(pedidoConMarca(page, propio.observacion)).toHaveCount(1);
    await expect(pedidoConMarca(page, ajeno.observacion)).toHaveCount(0);
  });

  test('un cliente no puede abrir la pantalla de cocina', async ({ page, cliente }) => {
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);

    await navegarSinRecargar(page, '/cocina');

    await expect(page).toHaveURL(/\/nuevo-pedido$/);
    await expect(page.getByRole('heading', { name: 'Pedidos de cocina' })).toHaveCount(0);
  });

  test('al cerrar sesión vuelve al acceso y las rutas quedan protegidas', async ({ page, cliente }) => {
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/acceso$/);

    await navegarSinRecargar(page, '/mis-pedidos');
    await expect(page).toHaveURL(/\/acceso$/);
  });
});
