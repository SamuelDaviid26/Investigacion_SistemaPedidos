import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearPedido, TOKEN_PRUEBA } from '../testing/dobles';
import { PedidosService } from './pedidos.service';

const URL_PEDIDOS = 'http://localhost:5289/api/pedidos';

describe('PedidosService', () => {
  let servicio: PedidosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    servicio = TestBed.inject(PedidosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear envía el pedido con el token y devuelve el pedido creado', async () => {
    const nuevo = { plato: 'Papas', cantidad: 2, observacion: 'sin sal' };
    const creado = crearPedido({ id: 5, plato: 'Papas', cantidad: 2, observacion: 'sin sal' });

    const resultado = firstValueFrom(servicio.crear(nuevo, TOKEN_PRUEBA));

    const peticion = http.expectOne({ method: 'POST', url: URL_PEDIDOS });
    expect(peticion.request.body).toEqual(nuevo);
    expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${TOKEN_PRUEBA}`);
    peticion.flush(creado, { status: 201, statusText: 'Created' });

    expect(await resultado).toEqual(creado);
  });

  it('obtenerPedidos pide la lista con el token', async () => {
    const pedidos = [crearPedido({ id: 1 }), crearPedido({ id: 2, estado: 'EnPreparacion' })];

    const resultado = firstValueFrom(servicio.obtenerPedidos(TOKEN_PRUEBA));

    const peticion = http.expectOne({ method: 'GET', url: URL_PEDIDOS });
    expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${TOKEN_PRUEBA}`);
    peticion.flush(pedidos);

    expect(await resultado).toEqual(pedidos);
  });

  it('cambiarEstado hace PATCH a /{id}/estado con { newStatus } y el token', async () => {
    const actualizado = crearPedido({ id: 9, estado: 'EnPreparacion' });

    const resultado = firstValueFrom(
      servicio.cambiarEstado(9, 'EnPreparacion', TOKEN_PRUEBA)
    );

    const peticion = http.expectOne({ method: 'PATCH', url: `${URL_PEDIDOS}/9/estado` });
    expect(peticion.request.body).toEqual({ newStatus: 'EnPreparacion' });
    expect(peticion.request.headers.get('Authorization')).toBe(`Bearer ${TOKEN_PRUEBA}`);
    peticion.flush(actualizado);

    expect(await resultado).toEqual(actualizado);
  });

  it.each([
    [400, 'No se puede cambiar el pedido de Recibido a ListoParaRecoger.'],
    [403, null],
    [404, 'No se encontró el pedido.']
  ])('propaga el error HTTP %i de cambiarEstado', async (status, cuerpo) => {
    const resultado = firstValueFrom(
      servicio.cambiarEstado(1, 'ListoParaRecoger', TOKEN_PRUEBA)
    );

    http.expectOne(`${URL_PEDIDOS}/1/estado`).flush(cuerpo, { status, statusText: 'Error' });

    const error = (await resultado.catch((e: unknown) => e)) as HttpErrorResponse;
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error.status).toBe(status);
    expect(error.error).toBe(cuerpo);
  });

  it('propaga el 401 cuando el token expiró al listar pedidos', async () => {
    const resultado = firstValueFrom(servicio.obtenerPedidos(TOKEN_PRUEBA));

    http.expectOne(URL_PEDIDOS).flush(null, { status: 401, statusText: 'Unauthorized' });

    const error = (await resultado.catch((e: unknown) => e)) as HttpErrorResponse;
    expect(error.status).toBe(401);
  });
});
