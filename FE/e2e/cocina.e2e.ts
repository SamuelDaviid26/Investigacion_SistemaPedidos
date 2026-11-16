import {
  crearPedidoApi,
  expect,
  iniciarSesion,
  navegarSinRecargar,
  obtenerToken,
  pedidoConMarca,
  registrarCuenta,
  test
} from './fixtures';

test.describe('cocina', () => {
  test('la cuenta de cocina entra a su pantalla y no puede abrir las del cliente', async ({
    paginaCocina
  }) => {
    await expect(paginaCocina.getByRole('heading', { name: 'Pedidos de cocina' })).toBeVisible();

    await navegarSinRecargar(paginaCocina, '/nuevo-pedido');
    await expect(paginaCocina).toHaveURL(/\/cocina$/);

    await navegarSinRecargar(paginaCocina, '/mis-pedidos');
    await expect(paginaCocina).toHaveURL(/\/cocina$/);
  });

  test('ve los pedidos de todos los clientes', async ({ request, cliente, paginaCocina }) => {
    const otro = await registrarCuenta(request);
    const primero = await crearPedidoApi(request, await obtenerToken(request, cliente), { plato: 'Papas' });
    const segundo = await crearPedidoApi(request, await obtenerToken(request, otro), { plato: 'Pollo' });

    await paginaCocina.getByRole('button', { name: 'Actualizar' }).click();

    await expect(pedidoConMarca(paginaCocina, primero.observacion)).toContainText('Papas');
    await expect(pedidoConMarca(paginaCocina, segundo.observacion)).toContainText('Pollo');
  });

  test('un pedido avanza de Recibido a Listo para recoger y el cliente lo ve', async ({
    page,
    request,
    cliente,
    paginaCocina
  }) => {
    const pedido = await crearPedidoApi(request, await obtenerToken(request, cliente), {
      plato: 'Hot dog',
      cantidad: 2
    });

    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);
    await page.getByRole('link', { name: 'Mis pedidos' }).click();
    await expect(pedidoConMarca(page, pedido.observacion)).toContainText('Recibido');

    await paginaCocina.getByRole('button', { name: 'Actualizar' }).click();
    const fila = pedidoConMarca(paginaCocina, pedido.observacion);
    await expect(fila).toContainText('Recibido');

    await fila.getByRole('button', { name: 'Empezar a preparar' }).click();
    await expect(fila).toContainText('En preparación');

    await fila.getByRole('button', { name: 'Marcar como listo' }).click();
    await expect(fila).toContainText('Listo para recoger');
    await expect(fila.getByRole('button')).toHaveCount(0);

    await page.getByRole('button', { name: 'Actualizar' }).click();
    await expect(pedidoConMarca(page, pedido.observacion)).toContainText('Listo para recoger');
  });

  test('el cliente ve En preparación mientras cocina todavía no termina', async ({
    page,
    request,
    cliente,
    paginaCocina
  }) => {
    const pedido = await crearPedidoApi(request, await obtenerToken(request, cliente));

    await paginaCocina.getByRole('button', { name: 'Actualizar' }).click();
    await pedidoConMarca(paginaCocina, pedido.observacion)
      .getByRole('button', { name: 'Empezar a preparar' }).click();
    await expect(pedidoConMarca(paginaCocina, pedido.observacion)).toContainText('En preparación');

    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);
    await page.getByRole('link', { name: 'Mis pedidos' }).click();

    await expect(pedidoConMarca(page, pedido.observacion)).toContainText('En preparación');
  });
});
