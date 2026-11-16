import { expect, crearPedidoApi, obtenerToken, test } from './fixtures';
import { URL_API, USUARIO_COCINA } from './entorno';

test.describe('API: autorización y reglas de negocio', () => {
  test('las rutas protegidas responden 401 sin token', async ({ request }) => {
    for (const ruta of ['/api/alimentos', '/api/pedidos']) {
      expect((await request.get(`${URL_API}${ruta}`)).status()).toBe(401);
    }
  });

  test('el catálogo devuelve los 8 alimentos', async ({ request, cliente }) => {
    const token = await obtenerToken(request, cliente);

    const respuesta = await request.get(`${URL_API}/api/alimentos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(respuesta.status()).toBe(200);
    const alimentos: { nombre: string }[] = await respuesta.json();
    expect(alimentos.map(a => a.nombre)).toEqual([
      'Fresco', 'Hamburguesa', 'Helado', 'Hot dog', 'Milkshake', 'Papas', 'Pollo', 'Sándwich'
    ]);
  });

  test('un pedido nuevo nace en estado Recibido y a nombre del cliente', async ({ request, cliente }) => {
    const token = await obtenerToken(request, cliente);

    const pedido = await crearPedidoApi(request, token, { plato: 'Pollo', cantidad: 2 });

    const lista = await request.get(`${URL_API}/api/pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pedidos: { id: number; estado: string; plato: string }[] = await lista.json();
    expect(pedidos.find(p => p.id === pedido.id)).toMatchObject({ plato: 'Pollo', estado: 'Recibido' });
  });

  test('rechaza un plato que no está en el menú', async ({ request, cliente }) => {
    const token = await obtenerToken(request, cliente);

    const respuesta = await request.post(`${URL_API}/api/pedidos`, {
      data: { plato: 'Plato inexistente', cantidad: 1, observacion: '' },
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(respuesta.status()).toBe(400);
    expect(await respuesta.text()).toContain('no existe en el menú');
  });

  test('rechaza una cantidad menor que 1', async ({ request, cliente }) => {
    const token = await obtenerToken(request, cliente);

    const respuesta = await request.post(`${URL_API}/api/pedidos`, {
      data: { plato: 'Papas', cantidad: 0, observacion: '' },
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(respuesta.status()).toBe(400);
  });

  test('un cliente no puede cambiar el estado de un pedido (403)', async ({ request, cliente }) => {
    const token = await obtenerToken(request, cliente);
    const pedido = await crearPedidoApi(request, token);

    const respuesta = await request.patch(`${URL_API}/api/pedidos/${pedido.id}/estado`, {
      data: { newStatus: 'EnPreparacion' },
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(respuesta.status()).toBe(403);
  });

  test.describe('con la cuenta de cocina', () => {
    test('rechaza saltarse un estado (Recibido → ListoParaRecoger)', async ({ request, cliente }) => {
      const pedido = await crearPedidoApi(request, await obtenerToken(request, cliente));
      const tokenCocina = await obtenerToken(request, USUARIO_COCINA);

      const respuesta = await request.patch(`${URL_API}/api/pedidos/${pedido.id}/estado`, {
        data: { newStatus: 'ListoParaRecoger' },
        headers: { Authorization: `Bearer ${tokenCocina}` }
      });

      expect(respuesta.status()).toBe(400);
      expect(await respuesta.text()).toContain('No se puede cambiar el pedido de Recibido a ListoParaRecoger.');
    });

    test('rechaza retroceder un estado', async ({ request, cliente }) => {
      const pedido = await crearPedidoApi(request, await obtenerToken(request, cliente));
      const cabeceras = { Authorization: `Bearer ${await obtenerToken(request, USUARIO_COCINA)}` };
      const url = `${URL_API}/api/pedidos/${pedido.id}/estado`;

      expect((await request.patch(url, { data: { newStatus: 'EnPreparacion' }, headers: cabeceras })).status())
        .toBe(200);

      const respuesta = await request.patch(url, { data: { newStatus: 'Recibido' }, headers: cabeceras });
      expect(respuesta.status()).toBe(400);
    });

    test('responde 404 si el pedido no existe', async ({ request }) => {
      const tokenCocina = await obtenerToken(request, USUARIO_COCINA);

      const respuesta = await request.patch(`${URL_API}/api/pedidos/2147483647/estado`, {
        data: { newStatus: 'EnPreparacion' },
        headers: { Authorization: `Bearer ${tokenCocina}` }
      });

      expect(respuesta.status()).toBe(404);
    });
  });
});
