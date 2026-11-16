import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { describe, expect, it, MockInstance, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { PedidosService } from '../../services/pedidos.service';
import {
  botonPorTexto,
  crearAuthDoble,
  crearPedido,
  errorHttp,
  textoDe,
  TOKEN_PRUEBA
} from '../../testing/dobles';
import { CocinaPagina } from './cocina';

describe('CocinaPagina', () => {
  let auth: ReturnType<typeof crearAuthDoble>;
  let servicio: {
    obtenerPedidos: ReturnType<typeof vi.fn>;
    cambiarEstado: ReturnType<typeof vi.fn>;
  };
  let navegar: MockInstance<Router['navigateByUrl']>;
  let fixture: ComponentFixture<CocinaPagina>;
  let pantalla: HTMLElement;

  function crearComponente(listado: unknown, token: string | null = TOKEN_PRUEBA): void {
    auth = crearAuthDoble(token, true);
    servicio = {
      obtenerPedidos: vi.fn(() => listado),
      cambiarEstado: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: auth },
        { provide: PedidosService, useValue: servicio }
      ]
    });

    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(CocinaPagina);
    pantalla = fixture.nativeElement;
    fixture.detectChanges();
  }

  const filas = () => Array.from(pantalla.querySelectorAll<HTMLElement>('tbody tr'));
  const pulsar = (texto: string, indice = 0) => {
    const botones = Array.from(pantalla.querySelectorAll('button'))
      .filter(b => b.textContent?.includes(texto));
    botones[indice].click();
    fixture.detectChanges();
  };

  it('sin sesión cierra la sesión y envía a /acceso', () => {
    crearComponente(of([]), null);

    expect(servicio.obtenerPedidos).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/acceso');
  });

  it('lista todos los pedidos con plato, cantidad, detalle y estado', () => {
    crearComponente(of([
      crearPedido({ id: 1, plato: 'Papas', cantidad: 2, observacion: 'sin sal' }),
      crearPedido({ id: 2, plato: 'Pollo', cantidad: 1, observacion: null, estado: 'EnPreparacion' })
    ]));

    expect(servicio.obtenerPedidos).toHaveBeenCalledWith(TOKEN_PRUEBA);
    expect(filas()).toHaveLength(2);
    expect(filas()[0].textContent).toContain('#1');
    expect(textoDe(filas()[0], 'td:nth-of-type(1)')).toBe('Papas');
    expect(textoDe(filas()[0], 'td:nth-of-type(2)')).toBe('2');
    expect(textoDe(filas()[0], 'td.detalle')).toBe('sin sal');
    expect(textoDe(filas()[1], 'td.detalle')).toBe('—');
    expect(textoDe(filas()[1], '.estado')).toBe('En preparación');
  });

  it('ofrece la acción correcta según el estado y ninguna para los pedidos listos', () => {
    crearComponente(of([
      crearPedido({ id: 1, estado: 'Recibido' }),
      crearPedido({ id: 2, estado: 'EnPreparacion' }),
      crearPedido({ id: 3, estado: 'ListoParaRecoger' })
    ]));

    expect(textoDe(filas()[0], 'button')).toBe('Empezar a preparar');
    expect(textoDe(filas()[1], 'button')).toBe('Marcar como listo');
    expect(filas()[2].querySelector('button')).toBeNull();
  });

  it('muestra el mensaje de lista vacía', () => {
    crearComponente(of([]));

    expect(filas()).toHaveLength(0);
    expect(pantalla.textContent).toContain('Todavía no hay pedidos.');
  });

  describe('avanzar el estado', () => {
    it('Recibido → EnPreparacion actualiza solo esa fila', () => {
      crearComponente(of([
        crearPedido({ id: 1, estado: 'Recibido' }),
        crearPedido({ id: 2, estado: 'Recibido' })
      ]));
      servicio.cambiarEstado.mockReturnValue(of(crearPedido({ id: 2, estado: 'EnPreparacion' })));

      pulsar('Empezar a preparar', 1);

      expect(servicio.cambiarEstado).toHaveBeenCalledWith(2, 'EnPreparacion', TOKEN_PRUEBA);
      expect(textoDe(filas()[0], '.estado')).toBe('Recibido');
      expect(textoDe(filas()[1], '.estado')).toBe('En preparación');
      expect(textoDe(filas()[1], 'button')).toBe('Marcar como listo');
    });

    it('EnPreparacion → ListoParaRecoger quita el botón de la fila', () => {
      crearComponente(of([crearPedido({ id: 1, estado: 'EnPreparacion' })]));
      servicio.cambiarEstado.mockReturnValue(of(crearPedido({ id: 1, estado: 'ListoParaRecoger' })));

      pulsar('Marcar como listo');

      expect(servicio.cambiarEstado).toHaveBeenCalledWith(1, 'ListoParaRecoger', TOKEN_PRUEBA);
      expect(textoDe(filas()[0], '.estado')).toBe('Listo para recoger');
      expect(filas()[0].querySelector('button')).toBeNull();
    });

    it('bloquea todos los botones y evita dobles clics mientras guarda', () => {
      crearComponente(of([
        crearPedido({ id: 1, estado: 'Recibido' }),
        crearPedido({ id: 2, estado: 'Recibido' })
      ]));
      servicio.cambiarEstado.mockReturnValue(new Subject());

      pulsar('Empezar a preparar', 0);

      expect(textoDe(filas()[0], 'button')).toBe('Guardando…');
      expect(Array.from(pantalla.querySelectorAll('button')).every(b =>
        b.textContent?.includes('Cerrar sesión') || b.disabled)).toBe(true);

      fixture.componentInstance.avanzar(crearPedido({ id: 2, estado: 'Recibido' }));
      expect(servicio.cambiarEstado).toHaveBeenCalledTimes(1);
    });

    it('un pedido listo no vuelve a avanzar', () => {
      crearComponente(of([crearPedido({ id: 1, estado: 'ListoParaRecoger' })]));

      fixture.componentInstance.avanzar(crearPedido({ id: 1, estado: 'ListoParaRecoger' }));

      expect(servicio.cambiarEstado).not.toHaveBeenCalled();
    });

    it('si falla muestra un aviso con el número de pedido y conserva el estado', () => {
      crearComponente(of([crearPedido({ id: 4, estado: 'Recibido' })]));
      servicio.cambiarEstado.mockReturnValue(errorHttp(400, 'transición inválida'));

      pulsar('Empezar a preparar');

      expect(textoDe(pantalla, '[role="alert"]'))
        .toBe('No se pudo actualizar el pedido #4. Pulsá Actualizar para consultar su estado.');
      expect(textoDe(filas()[0], '.estado')).toBe('Recibido');
      expect(botonPorTexto(pantalla, 'Empezar a preparar')!.disabled).toBe(false);
    });

    it('una cuenta sin rol de cocina (403) ve un mensaje de permisos', () => {
      crearComponente(of([crearPedido({ id: 1, estado: 'Recibido' })]));
      servicio.cambiarEstado.mockReturnValue(errorHttp(403));

      pulsar('Empezar a preparar');

      expect(textoDe(pantalla, '[role="alert"]')).toBe('Esta cuenta no tiene permiso de cocina.');
    });

    it('un token vencido (401) cierra la sesión', () => {
      crearComponente(of([crearPedido({ id: 1, estado: 'Recibido' })]));
      servicio.cambiarEstado.mockReturnValue(errorHttp(401));

      pulsar('Empezar a preparar');

      expect(auth.cerrarSesion).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith('/acceso');
    });
  });

  describe('carga de pedidos', () => {
    it('muestra "Cargando pedidos…" mientras espera', () => {
      crearComponente(new Subject());

      expect(textoDe(pantalla, '[role="status"]')).toBe('Cargando pedidos…');
    });

    it('un 403 al cargar muestra el mensaje de permisos', () => {
      crearComponente(errorHttp(403));

      expect(textoDe(pantalla, '[role="alert"]')).toBe('Esta cuenta no tiene permiso de cocina.');
    });

    it('un error genérico muestra el aviso de carga', () => {
      crearComponente(errorHttp(500));

      expect(textoDe(pantalla, '[role="alert"]')).toBe('No se pudieron cargar los pedidos.');
      expect(pantalla.textContent).not.toContain('Todavía no hay pedidos.');
    });

    it('un 401 cierra la sesión', () => {
      crearComponente(errorHttp(401));

      expect(auth.cerrarSesion).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith('/acceso');
    });

    it('"Actualizar" incorpora los pedidos nuevos', () => {
      crearComponente(of([crearPedido({ id: 1 })]));
      servicio.obtenerPedidos.mockReturnValue(of([crearPedido({ id: 1 }), crearPedido({ id: 2 })]));

      pulsar('Actualizar');

      expect(filas()).toHaveLength(2);
    });
  });

  it('"Cerrar sesión" limpia el token y vuelve a /acceso', () => {
    crearComponente(of([]));

    pulsar('Cerrar sesión');

    expect(auth.cerrarSesion).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/acceso');
  });
});
