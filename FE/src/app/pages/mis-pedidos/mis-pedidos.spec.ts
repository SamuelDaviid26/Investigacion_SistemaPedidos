import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidosService } from '../../services/pedidos.service';
import {
  botonPorTexto,
  crearAuthDoble,
  crearPedido,
  errorHttp,
  textoDe,
  TOKEN_PRUEBA
} from '../../testing/dobles';
import { MisPedidosPagina } from './mis-pedidos';

describe('MisPedidosPagina', () => {
  let auth: ReturnType<typeof crearAuthDoble>;
  let servicio: { obtenerPedidos: ReturnType<typeof vi.fn> };
  let navegar: MockInstance<Router['navigateByUrl']>;
  let fixture: ComponentFixture<MisPedidosPagina>;
  let pantalla: HTMLElement;

  function crearComponente(respuesta: unknown, token: string | null = TOKEN_PRUEBA): void {
    auth = crearAuthDoble(token);
    servicio = { obtenerPedidos: vi.fn(() => respuesta) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: auth },
        { provide: PedidosService, useValue: servicio }
      ]
    });

    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(MisPedidosPagina);
    pantalla = fixture.nativeElement;
    fixture.detectChanges();
  }

  const tarjetas = () => Array.from(pantalla.querySelectorAll('article.tarjeta'));

  it('sin sesión cierra la sesión y envía a /acceso', () => {
    crearComponente(of([]), null);

    expect(servicio.obtenerPedidos).not.toHaveBeenCalled();
    expect(auth.cerrarSesion).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/acceso');
  });

  it('muestra los pedidos del cliente del más reciente al más antiguo', () => {
    const pedidos: Pedido[] = [
      crearPedido({ id: 1, plato: 'Papas', cantidad: 2 }),
      crearPedido({ id: 3, plato: 'Pollo', estado: 'EnPreparacion' }),
      crearPedido({ id: 2, plato: 'Helado', estado: 'ListoParaRecoger' })
    ];
    crearComponente(of(pedidos));

    expect(servicio.obtenerPedidos).toHaveBeenCalledWith(TOKEN_PRUEBA);
    expect(tarjetas().map(t => textoDe(t as HTMLElement, 'h2')))
      .toEqual(['Pedido #3', 'Pedido #2', 'Pedido #1']);
    expect(pedidos.map(p => p.id)).toEqual([1, 3, 2]);
  });

  it('traduce el estado a texto legible y lo expone en data-estado', () => {
    crearComponente(of([
      crearPedido({ id: 3, estado: 'ListoParaRecoger' }),
      crearPedido({ id: 2, estado: 'EnPreparacion' }),
      crearPedido({ id: 1, estado: 'Recibido' })
    ]));

    const estados = Array.from(pantalla.querySelectorAll('.estado'));
    expect(estados.map(e => e.textContent?.trim()))
      .toEqual(['Listo para recoger', 'En preparación', 'Recibido']);
    expect(estados.map(e => e.getAttribute('data-estado')))
      .toEqual(['ListoParaRecoger', 'EnPreparacion', 'Recibido']);
  });

  it('muestra cantidad × plato y el detalle solo cuando existe', () => {
    crearComponente(of([
      crearPedido({ id: 2, plato: 'Papas', cantidad: 4, observacion: 'sin sal' }),
      crearPedido({ id: 1, plato: 'Pollo', cantidad: 1, observacion: null })
    ]));

    const [conDetalle, sinDetalle] = tarjetas() as HTMLElement[];
    expect(textoDe(conDetalle, '.plato')).toBe('4 × Papas');
    expect(textoDe(conDetalle, '.detalle')).toBe('Detalle: sin sal');
    expect(textoDe(sinDetalle, '.plato')).toBe('1 × Pollo');
    expect(sinDetalle.querySelector('.detalle')).toBeNull();
  });

  it('invita a hacer el primer pedido cuando no hay ninguno', () => {
    crearComponente(of([]));

    expect(tarjetas()).toHaveLength(0);
    expect(pantalla.textContent).toContain('Todavía no tenés pedidos.');
  });

  it('muestra "Cargando…" y bloquea el botón mientras espera', () => {
    crearComponente(new Subject());

    expect(textoDe(pantalla, '[role="status"]')).toBe('Cargando tus pedidos…');
    expect(botonPorTexto(pantalla, 'Actualizando…')!.disabled).toBe(true);
  });

  it('muestra un error si falla la carga y no el mensaje de lista vacía', () => {
    crearComponente(errorHttp(500));

    expect(textoDe(pantalla, '[role="alert"]'))
      .toBe('No se pudieron actualizar tus pedidos. Intentá de nuevo.');
    expect(pantalla.textContent).not.toContain('Todavía no tenés pedidos.');
  });

  it('muestra el mensaje de error estándar cuando la red falla por completo (status 0)', () => {
    crearComponente(errorHttp(0));

    expect(textoDe(pantalla, '[role="alert"]'))
      .toBe('No se pudieron actualizar tus pedidos. Intentá de nuevo.');
  });

  it('cierra la sesión si la API responde 401', () => {
    crearComponente(errorHttp(401));

    expect(auth.cerrarSesion).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/acceso');
  });

  it('"Actualizar" vuelve a consultar y refleja el nuevo estado', () => {
    crearComponente(of([crearPedido({ id: 1, estado: 'Recibido' })]));
    expect(textoDe(pantalla, '.estado')).toBe('Recibido');

    servicio.obtenerPedidos.mockReturnValue(of([crearPedido({ id: 1, estado: 'ListoParaRecoger' })]));
    botonPorTexto(pantalla, 'Actualizar')!.click();
    fixture.detectChanges();

    expect(servicio.obtenerPedidos).toHaveBeenCalledTimes(2);
    expect(textoDe(pantalla, '.estado')).toBe('Listo para recoger');
  });

  it('un error al actualizar conserva la lista anterior y muestra el aviso', () => {
    crearComponente(of([crearPedido({ id: 1 })]));

    servicio.obtenerPedidos.mockReturnValue(errorHttp(500));
    botonPorTexto(pantalla, 'Actualizar')!.click();
    fixture.detectChanges();

    expect(tarjetas()).toHaveLength(1);
    expect(pantalla.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('"Cerrar sesión" limpia el token y vuelve a /acceso', () => {
    crearComponente(of([]));

    botonPorTexto(pantalla, 'Cerrar sesión')!.click();

    expect(auth.cerrarSesion).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/acceso');
  });
});
