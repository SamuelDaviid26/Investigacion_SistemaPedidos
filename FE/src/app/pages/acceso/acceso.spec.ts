import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { crearAuthDoble, errorHttp, escribir, textoDe } from '../../testing/dobles';
import { Acceso } from './acceso';

describe('Acceso', () => {
  let fixture: ComponentFixture<Acceso>;
  let pantalla: HTMLElement;
  let auth: ReturnType<typeof crearAuthDoble>;
  let navegar: MockInstance<Router['navigateByUrl']>;

  beforeEach(() => {
    auth = crearAuthDoble(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: auth }
      ]
    });

    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Acceso);
    pantalla = fixture.nativeElement;
    fixture.detectChanges();
  });

  const campo = (id: string) => pantalla.querySelector<HTMLInputElement>(`#${id}`)!;
  const enviar = () => {
    pantalla.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const llenar = (usuario: string, contrasena: string) => {
    escribir(campo('usuario'), usuario);
    escribir(campo('contrasena'), contrasena);
  };
  const alternarModo = () => {
    pantalla.querySelector<HTMLButtonElement>('button.alternar')!.click();
    fixture.detectChanges();
  };

  it('empieza en modo inicio de sesión', () => {
    expect(textoDe(pantalla, 'h1')).toBe('Iniciar sesión');
    expect(textoDe(pantalla, 'button.alternar')).toBe('Crear una cuenta');
  });

  it('no llama a la API y avisa cuando faltan datos', () => {
    llenar('   ', '');
    enviar();

    expect(textoDe(pantalla, '[role="alert"]')).toBe('Ingresá tu usuario y contraseña.');
    expect(auth.iniciarSesion).not.toHaveBeenCalled();
  });

  it('inicia sesión con el usuario sin espacios y lleva al cliente a /nuevo-pedido', () => {
    auth.iniciarSesion.mockReturnValue(of({ token: 'jwt' }));

    llenar('  ana  ', 'Clave123!');
    enviar();

    expect(auth.iniciarSesion).toHaveBeenCalledWith({ username: 'ana', password: 'Clave123!' });
    expect(navegar).toHaveBeenCalledWith('/nuevo-pedido');
    expect(campo('contrasena').value).toBe('');
  });

  it('lleva a la cuenta de cocina a /cocina', () => {
    auth.iniciarSesion.mockReturnValue(of({ token: 'jwt' }));
    auth.esCocina.mockReturnValue(true);

    llenar('cocina', 'Clave123!');
    enviar();

    expect(navegar).toHaveBeenCalledWith('/cocina');
  });

  it('muestra un mensaje si la API responde sin token', () => {
    auth.iniciarSesion.mockReturnValue(of({ token: '' }));

    llenar('ana', 'Clave123!');
    enviar();

    expect(textoDe(pantalla, '[role="alert"]')).toBe('La API respondió sin un token de acceso.');
    expect(navegar).not.toHaveBeenCalled();
  });

  it.each([
    [401, null, 'Usuario o contraseña incorrectos.'],
    [0, null, 'No se pudo conectar con la API. Revisá si está encendida.'],
    [500, null, 'No se pudo completar la solicitud. Intentá de nuevo.']
  ])('muestra el error correcto cuando el login responde %i', (status, cuerpo, mensaje) => {
    auth.iniciarSesion.mockReturnValue(errorHttp(status, cuerpo));

    llenar('ana', 'mala');
    enviar();

    expect(textoDe(pantalla, '[role="alert"]')).toBe(mensaje);
    expect(navegar).not.toHaveBeenCalled();
    expect(campo('contrasena').value).toBe('mala');
  });

  it('deshabilita los botones mientras se envía la solicitud', () => {
    const respuesta = new Subject<{ token: string }>();
    auth.iniciarSesion.mockReturnValue(respuesta);

    llenar('ana', 'Clave123!');
    enviar();

    expect(pantalla.querySelector<HTMLButtonElement>('button.principal')!.disabled).toBe(true);
    expect(pantalla.querySelector<HTMLButtonElement>('button.alternar')!.disabled).toBe(true);

    enviar();
    expect(auth.iniciarSesion).toHaveBeenCalledTimes(1);

    respuesta.next({ token: 'jwt' });
    respuesta.complete();
    fixture.detectChanges();

    expect(pantalla.querySelector<HTMLButtonElement>('button.principal')!.disabled).toBe(false);
  });

  describe('modo registro', () => {
    beforeEach(alternarModo);

    it('cambia los textos y limpia la contraseña', () => {
      expect(textoDe(pantalla, 'h1')).toBe('Crear cuenta');
      expect(textoDe(pantalla, 'button.alternar')).toBe('Ya tengo cuenta · Iniciar sesión');
      expect(campo('contrasena').getAttribute('autocomplete')).toBe('new-password');
    });

    it('registra la cuenta y regresa al inicio de sesión con un mensaje', () => {
      auth.registrar.mockReturnValue(of({ message: 'User created successfully' }));

      llenar('nuevo', 'Clave123!');
      enviar();

      expect(auth.registrar).toHaveBeenCalledWith({ username: 'nuevo', password: 'Clave123!' });
      expect(textoDe(pantalla, 'h1')).toBe('Iniciar sesión');
      expect(textoDe(pantalla, '[role="status"]'))
        .toBe('Cuenta creada. Ingresá tu contraseña para iniciar sesión.');
      expect(auth.iniciarSesion).not.toHaveBeenCalled();
    });

    it('muestra los errores de validación de Identity unidos', () => {
      auth.registrar.mockReturnValue(
        errorHttp(400, ['Passwords must have at least one digit.', 'Passwords must be at least 6 characters.'])
      );

      llenar('nuevo', 'abc');
      enviar();

      expect(textoDe(pantalla, '[role="alert"]'))
        .toBe('Passwords must have at least one digit. Passwords must be at least 6 characters.');
      expect(textoDe(pantalla, 'h1')).toBe('Crear cuenta');
    });
  });
});
