import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { Alimento, AlimentosService } from '../../services/alimentos.service';
import { AuthService } from '../../services/auth.service';
import { PedidosService } from '../../services/pedidos.service';
import {
  botonPorTexto,
  crearAuthDoble,
  crearPedido,
  errorHttp,
  escribir,
  textoDe,
  TOKEN_PRUEBA
} from '../../testing/dobles';
import { NuevoPedidoPagina } from './nuevo-pedido';

const MENU: Alimento[] = [
  { id: 2, nombre: 'Hamburguesa' },
  { id: 6, nombre: 'Papas' }
];

describe('NuevoPedidoPagina', () => {
  let auth: ReturnType<typeof crearAuthDoble>;
  let alimentos: { obtenerMenu: ReturnType<typeof vi.fn> };
  let pedidos: { crear: ReturnType<typeof vi.fn> };
  let navegar: MockInstance<Router['navigateByUrl']>;
  let fixture: ComponentFixture<NuevoPedidoPagina>;
  let pantalla: HTMLElement;

  function crearComponente(token: string | null = TOKEN_PRUEBA): void {
    auth = crearAuthDoble(token);
    alimentos = { obtenerMenu: vi.fn(() => of(MENU)) };
    pedidos = { crear: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: auth },
        { provide: AlimentosService, useValue: alimentos },
        { provide: PedidosService, useValue: pedidos }
      ]
    });

    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(NuevoPedidoPagina);
    pantalla = fixture.nativeElement;
  }

  const iniciar = () => fixture.detectChanges();
  const botonesMenu = () => Array.from(pantalla.querySelectorAll<HTMLButtonElement>('button.alimento'));
  const elegir = (nombre: string) => {
    botonesMenu().find(b => b.textContent?.includes(nombre))!.click();
    fixture.detectChanges();
  };
  const enviar = () => {
    pantalla.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const cantidad = () => pantalla.querySelector<HTMLInputElement>('#cantidad')!;

  describe('sin sesión', () => {
    it('cierra la sesión y envía a /acceso sin pedir el menú', () => {
      crearComponente(null);
      iniciar();

      expect(alimentos.obtenerMenu).not.toHaveBeenCalled();
      expect(auth.cerrarSesion).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith('/acceso');
    });
  });

  describe('carga del menú', () => {
    it('pide el menú con el token y muestra un botón por alimento', () => {
      crearComponente();
      iniciar();

      expect(alimentos.obtenerMenu).toHaveBeenCalledWith(TOKEN_PRUEBA);
      expect(botonesMenu().map(b => b.textContent?.trim())).toEqual(['Hamburguesa', 'Papas']);
      expect(pantalla.textContent).toContain('Elegí un alimento del menú.');
    });

    it('muestra "Cargando menú…" mientras espera la respuesta', () => {
      crearComponente();
      alimentos.obtenerMenu.mockReturnValue(new Subject());
      iniciar();

      expect(textoDe(pantalla, '[role="status"]')).toBe('Cargando menú…');
      expect(botonesMenu()).toHaveLength(0);
    });

    it('avisa cuando el menú está vacío', () => {
      crearComponente();
      alimentos.obtenerMenu.mockReturnValue(of([]));
      iniciar();

      expect(pantalla.textContent).toContain('El menú todavía no tiene alimentos.');
    });

    it('muestra el error y permite reintentar', () => {
      crearComponente();
      alimentos.obtenerMenu.mockReturnValueOnce(errorHttp(500));
      iniciar();

      expect(textoDe(pantalla, '[role="alert"]')).toBe('No se pudo cargar el menú.');

      botonPorTexto(pantalla, 'Reintentar')!.click();
      fixture.detectChanges();

      expect(alimentos.obtenerMenu).toHaveBeenCalledTimes(2);
      expect(botonesMenu()).toHaveLength(2);
      expect(pantalla.querySelector('[role="alert"]')).toBeNull();
    });

    it('cierra la sesión si el menú responde 401', () => {
      crearComponente();
      alimentos.obtenerMenu.mockReturnValue(errorHttp(401));
      iniciar();

      expect(auth.cerrarSesion).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith('/acceso');
    });
  });

  describe('crear el pedido', () => {
    beforeEach(() => {
      crearComponente();
      iniciar();
    });

    it('al elegir un alimento marca el botón y muestra el formulario', () => {
      elegir('Papas');

      expect(textoDe(pantalla, '.plato')).toBe('Papas');
      expect(botonesMenu().map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
      expect(cantidad().value).toBe('1');
    });

    it('envía plato, cantidad y observación sin espacios sobrantes', () => {
      pedidos.crear.mockReturnValue(of(crearPedido({ id: 7, plato: 'Papas', cantidad: 3 })));

      elegir('Papas');
      escribir(cantidad(), '3');
      escribir(pantalla.querySelector<HTMLTextAreaElement>('#observacion')!, '  sin sal  ');
      enviar();

      expect(pedidos.crear).toHaveBeenCalledWith(
        { plato: 'Papas', cantidad: 3, observacion: 'sin sal' },
        TOKEN_PRUEBA
      );
    });

    it('confirma el pedido y deja el formulario listo para otro', () => {
      pedidos.crear.mockReturnValue(of(crearPedido({ id: 7, plato: 'Papas', cantidad: 3 })));

      elegir('Papas');
      escribir(cantidad(), '3');
      enviar();

      expect(textoDe(pantalla, '.confirmacion')).toBe('Pedido #7 recibido: 3 × Papas.');
      expect(pantalla.querySelector('form')).toBeNull();
      expect(pantalla.textContent).toContain('Elegí un alimento del menú.');
    });

    it.each(['0', '-2', '1.5', ''])(
      'rechaza la cantidad "%s": avisa y deshabilita el envío',
      valor => {
        elegir('Papas');
        escribir(cantidad(), valor);
        fixture.detectChanges();

        expect(textoDe(pantalla, 'small')).toBe('Ingresá una cantidad entera mayor que cero.');
        expect(pantalla.querySelector<HTMLButtonElement>('button.principal')!.disabled).toBe(true);

        enviar();
        expect(pedidos.crear).not.toHaveBeenCalled();
      }
    );

    it('deshabilita el envío si la observación supera los 1000 caracteres', () => {
        elegir('Papas');
        escribir(
          pantalla.querySelector<HTMLTextAreaElement>('#observacion')!,
          'a'.repeat(1001)
        );
        fixture.detectChanges();

        expect(pantalla.querySelector<HTMLButtonElement>('button.principal')!.disabled).toBe(true);
        enviar();
        expect(pedidos.crear).not.toHaveBeenCalled();
      });

      it('muestra un mensaje de error cuando la API falla con estado 0', () => {
        pedidos.crear.mockReturnValue(errorHttp(0));

        elegir('Papas');
        enviar();

        expect(textoDe(pantalla, '[role="alert"]')).toBe('No se pudo enviar el pedido.');
      });

    it('no envía nada si no se eligió un alimento', () => {
      pantalla.dispatchEvent(new Event('submit'));
      fixture.componentInstance.enviarPedido();

      expect(pedidos.crear).not.toHaveBeenCalled();
    });

    it('muestra el mensaje de la API cuando responde con texto (400)', () => {
      pedidos.crear.mockReturnValue(errorHttp(400, 'El plato seleccionado no existe en el menú.'));

      elegir('Papas');
      enviar();

      expect(textoDe(pantalla, '[role="alert"]')).toBe('El plato seleccionado no existe en el menú.');
      expect(pantalla.querySelector('.confirmacion')).toBeNull();
      expect(pantalla.querySelector('form')).not.toBeNull();
    });

    it('usa un mensaje genérico si el error no trae texto', () => {
      pedidos.crear.mockReturnValue(errorHttp(500, { title: 'boom' }));

      elegir('Papas');
      enviar();

      expect(textoDe(pantalla, '[role="alert"]')).toBe('No se pudo enviar el pedido.');
    });

    it('cierra la sesión si crear responde 401', () => {
      pedidos.crear.mockReturnValue(errorHttp(401));

      elegir('Papas');
      enviar();

      expect(auth.cerrarSesion).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith('/acceso');
    });

    it('evita envíos dobles mientras la solicitud está en curso', () => {
      pedidos.crear.mockReturnValue(new Subject());

      elegir('Papas');
      enviar();
      enviar();

      expect(pedidos.crear).toHaveBeenCalledTimes(1);
      expect(textoDe(pantalla, 'button.principal')).toBe('Enviando…');
    });
  });

  it('"Cerrar sesión" limpia el token y vuelve a /acceso', () => {
    crearComponente();
    iniciar();

    botonPorTexto(pantalla, 'Cerrar sesión')!.click();

    expect(auth.cerrarSesion).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/acceso');
  });
});
