import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidosService } from '../../services/pedidos.service';
import { CocinaPagina } from './cocina';

it('debe cerrar la sesión y redirigir a /acceso si no hay token al avanzar un pedido', () => {
  // ARRANGE (preparar): servicios falsos
  const authFalso = { obtenerToken: () => null, cerrarSesion: vi.fn() };
  const pedidosFalso = { obtenerPedidos: vi.fn(), cambiarEstado: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authFalso },
      { provide: PedidosService, useValue: pedidosFalso }
    ]
  });
  const irA = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const cocina = TestBed.runInInjectionContext(() => new CocinaPagina());
  const pedido = { id: 1, estado: 'Recibido' } as Pedido;

  // ACT (actuar)
  cocina.avanzar(pedido);

  // ASSERT (verificar): comenta estas 3 líneas para la versión "trampa"
  expect(authFalso.cerrarSesion).toHaveBeenCalledOnce();
  expect(irA).toHaveBeenCalledWith('/acceso');
  expect(pedidosFalso.cambiarEstado).not.toHaveBeenCalled();
});