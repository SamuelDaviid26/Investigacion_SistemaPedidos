import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearJwt } from '../testing/dobles';
import { AuthService } from './auth.service';

const URL_AUTH = 'http://localhost:5289/api/auth';
const CLAIM_ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

describe('AuthService', () => {
  let servicio: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    servicio = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('iniciarSesion', () => {
    it('envía las credenciales y guarda el token recibido', async () => {
      const credenciales = { username: 'ana', password: 'Clave123!' };
      const resultado = firstValueFrom(servicio.iniciarSesion(credenciales));

      const peticion = http.expectOne({ method: 'POST', url: `${URL_AUTH}/login` });
      expect(peticion.request.body).toEqual(credenciales);
      peticion.flush({ token: 'jwt-recibido' });

      expect(await resultado).toEqual({ token: 'jwt-recibido' });
      expect(servicio.obtenerToken()).toBe('jwt-recibido');
    });

    it('no guarda ningún token cuando la API responde 401', async () => {
      const resultado = firstValueFrom(
        servicio.iniciarSesion({ username: 'ana', password: 'mala' })
      );

      http.expectOne(`${URL_AUTH}/login`)
        .flush('Invalid username or password.', { status: 401, statusText: 'Unauthorized' });

      const error = await resultado.catch((e: HttpErrorResponse) => e);
      expect((error as HttpErrorResponse).status).toBe(401);
      expect(servicio.obtenerToken()).toBeNull();
    });
  });

  describe('registrar', () => {
    it('envía las credenciales al endpoint de registro sin iniciar sesión', async () => {
      const credenciales = { username: 'nuevo', password: 'Clave123!' };
      const resultado = firstValueFrom(servicio.registrar(credenciales));

      const peticion = http.expectOne({ method: 'POST', url: `${URL_AUTH}/register` });
      expect(peticion.request.body).toEqual(credenciales);
      peticion.flush({ message: 'User created successfully' });

      expect(await resultado).toEqual({ message: 'User created successfully' });
      expect(servicio.obtenerToken()).toBeNull();
    });
  });

  describe('esCocina', () => {
    it('es falso cuando no hay sesión', () => {
      expect(servicio.esCocina()).toBe(false);
    });

    async function iniciarConToken(contenido: Record<string, unknown>): Promise<void> {
      const resultado = firstValueFrom(
        servicio.iniciarSesion({ username: 'u', password: 'p' })
      );
      http.expectOne(`${URL_AUTH}/login`).flush({ token: crearJwt(contenido) });
      await resultado;
    }

    it('reconoce el rol Cocina en el claim largo de Microsoft', async () => {
      await iniciarConToken({ [CLAIM_ROL]: 'Cocina' });
      expect(servicio.esCocina()).toBe(true);
    });

    it('reconoce el rol Cocina en el claim corto "role"', async () => {
      await iniciarConToken({ role: 'Cocina' });
      expect(servicio.esCocina()).toBe(true);
    });

    it('reconoce Cocina cuando el usuario tiene varios roles', async () => {
      await iniciarConToken({ [CLAIM_ROL]: ['Admin', 'Cocina'] });
      expect(servicio.esCocina()).toBe(true);
    });

    it('es falso para un cliente sin rol o con otro rol', async () => {
      await iniciarConToken({ unique_name: 'ana' });
      expect(servicio.esCocina()).toBe(false);

      await iniciarConToken({ [CLAIM_ROL]: 'Admin' });
      expect(servicio.esCocina()).toBe(false);
    });
  });

  it('cerrarSesion elimina el token guardado', async () => {
    const resultado = firstValueFrom(servicio.iniciarSesion({ username: 'u', password: 'p' }));
    http.expectOne(`${URL_AUTH}/login`).flush({ token: crearJwt({ role: 'Cocina' }) });
    await resultado;
    expect(servicio.obtenerToken()).not.toBeNull();

    servicio.cerrarSesion();

    expect(servicio.obtenerToken()).toBeNull();
    expect(servicio.esCocina()).toBe(false);
  });
});
