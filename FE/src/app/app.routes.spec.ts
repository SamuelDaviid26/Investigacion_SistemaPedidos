import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { AlimentosService } from './services/alimentos.service';
import { AuthService } from './services/auth.service';
import { PedidosService } from './services/pedidos.service';
import { crearAuthDoble } from './testing/dobles';

async function navegar(
  url: string,
  sesion: { token: string | null; esCocina: boolean }
): Promise<string> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      provideHttpClient(),
      { provide: AuthService, useValue: crearAuthDoble(sesion.token, sesion.esCocina) },
      { provide: AlimentosService, useValue: { obtenerMenu: () => of([]) } },
      { provide: PedidosService, useValue: { obtenerPedidos: () => of([]) } }
    ]
  });

  await RouterTestingHarness.create(url);
  return TestBed.inject(Router).url;
}

describe('guards de rutas', () => {
  const sinSesion = { token: null, esCocina: false };
  const cliente = { token: 'jwt-cliente', esCocina: false };
  const cocina = { token: 'jwt-cocina', esCocina: true };

  it.each(['/nuevo-pedido', '/mis-pedidos', '/cocina'])(
    'sin sesión, %s redirige a /acceso',
    async ruta => {
      expect(await navegar(ruta, sinSesion)).toBe('/acceso');
    }
  );

  it.each(['/nuevo-pedido', '/mis-pedidos'])(
    'un cliente puede abrir %s',
    async ruta => {
      expect(await navegar(ruta, cliente)).toBe(ruta);
    }
  );

  it('un cliente no puede abrir /cocina y vuelve a /nuevo-pedido', async () => {
    expect(await navegar('/cocina', cliente)).toBe('/nuevo-pedido');
  });

  it('cocina puede abrir /cocina', async () => {
    expect(await navegar('/cocina', cocina)).toBe('/cocina');
  });

  it.each(['/nuevo-pedido', '/mis-pedidos'])(
    'cocina no puede abrir %s y vuelve a /cocina',
    async ruta => {
      expect(await navegar(ruta, cocina)).toBe('/cocina');
    }
  );
});
