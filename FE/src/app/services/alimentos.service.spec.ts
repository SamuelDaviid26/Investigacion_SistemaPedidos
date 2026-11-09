import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { expect, it } from 'vitest';
import { Alimento, AlimentosService } from './alimentos.service';

it('solicita el menú con el token del cliente y devuelve los alimentos', async () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });

  const servicio = TestBed.inject(AlimentosService);
  const httpPruebas = TestBed.inject(HttpTestingController);

  const menuEsperado: Alimento[] = [
    { id: 2, nombre: 'Hamburguesa' },
    { id: 6, nombre: 'Papas' }
  ];

  const resultado = firstValueFrom(servicio.obtenerMenu('token-de-prueba'));

  const peticion = httpPruebas.expectOne({
    method: 'GET',
    url: 'http://localhost:5289/api/alimentos'
  });

  expect(peticion.request.headers.get('Authorization'))
    .toBe('Bearer token-de-prueba');

  peticion.flush(menuEsperado);

  expect(await resultado).toEqual(menuEsperado);
  httpPruebas.verify();
});