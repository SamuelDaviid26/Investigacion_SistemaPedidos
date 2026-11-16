import { expect, iniciarSesion, marcaUnica, pedidoConMarca, test } from './fixtures';

// Flujo completo del sistema, todo por la interfaz y con dos usuarios a la vez:
// el cliente hace el pedido y cocina lo atiende en otra sesión del navegador.
test('flujo completo: el cliente pide, cocina atiende y el cliente ve el estado actualizado', async ({
  page: paginaCliente,
  cliente,
  paginaCocina
}) => {
  const marca = marcaUnica('flujo');

  await test.step('1. El cliente inicia sesión', async () => {
    await iniciarSesion(paginaCliente, cliente, /\/nuevo-pedido$/);
    await expect(paginaCliente.getByRole('heading', { name: 'Nuevo pedido' })).toBeVisible();
  });

  await test.step('2. El cliente crea un pedido', async () => {
    await paginaCliente.getByRole('button', { name: 'Hamburguesa', exact: true }).click();
    await paginaCliente.getByLabel('Cantidad').fill('2');
    await paginaCliente.getByLabel('Detalle (opcional)').fill(marca);
    await paginaCliente.getByRole('button', { name: 'Enviar pedido' }).click();

    await expect(paginaCliente.getByText(/Pedido #\d+ recibido: 2 × Hamburguesa\./)).toBeVisible();
  });

  await test.step('3. El cliente consulta el pedido en Mis pedidos', async () => {
    await paginaCliente.getByRole('link', { name: 'Mis pedidos' }).click();

    const pedido = pedidoConMarca(paginaCliente, marca);
    await expect(pedido).toHaveCount(1);
    await expect(pedido).toContainText('2 × Hamburguesa');
    await expect(pedido).toContainText('Recibido');
  });

  const filaCocina = pedidoConMarca(paginaCocina, marca);

  await test.step('4. Cocina ve el pedido y lo pasa a En preparación', async () => {
    await paginaCocina.getByRole('button', { name: 'Actualizar' }).click();
    await expect(filaCocina).toContainText('Recibido');

    await filaCocina.getByRole('button', { name: 'Empezar a preparar' }).click();
    await expect(filaCocina).toContainText('En preparación');
  });

  await test.step('5. Cocina lo marca como Listo para recoger', async () => {
    await filaCocina.getByRole('button', { name: 'Marcar como listo' }).click();

    await expect(filaCocina).toContainText('Listo para recoger');
    await expect(filaCocina.getByRole('button')).toHaveCount(0);
  });

  await test.step('6. El cliente actualiza y ve el estado final', async () => {
    await paginaCliente.getByRole('button', { name: 'Actualizar' }).click();

    await expect(pedidoConMarca(paginaCliente, marca)).toContainText('Listo para recoger');
  });
});
