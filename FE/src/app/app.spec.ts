import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expect, it } from 'vitest';
import { routes } from './app.routes';

it('muestra el formulario de acceso al abrir la aplicación', async () => {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes), provideHttpClient()]
  });

  const navegador = await RouterTestingHarness.create('/');
  const pantalla = navegador.routeNativeElement;

  expect(pantalla?.querySelector('h1')?.textContent?.trim()).toBe('Iniciar sesión');
  expect(pantalla?.querySelector('input[type="password"]')).toBeTruthy();
});
