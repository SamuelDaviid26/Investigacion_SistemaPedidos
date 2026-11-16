import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { Pedido } from '../services/pedidos.service';

export const TOKEN_PRUEBA = 'token-de-prueba';

export function crearAuthDoble(token: string | null = TOKEN_PRUEBA, esCocina = false) {
  return {
    iniciarSesion: vi.fn(),
    registrar: vi.fn(),
    obtenerToken: vi.fn(() => token),
    esCocina: vi.fn(() => esCocina),
    cerrarSesion: vi.fn()
  };
}

export function crearPedido(cambios: Partial<Pedido> = {}): Pedido {
  return {
    id: 1,
    plato: 'Hamburguesa',
    cantidad: 1,
    observacion: null,
    fechaCreacion: '2026-11-10T12:00:00Z',
    estado: 'Recibido',
    ...cambios
  };
}

export function errorHttp(status: number, error: unknown = null) {
  return throwError(() => new HttpErrorResponse({ status, error }));
}

export function crearJwt(contenido: Record<string, unknown>): string {
  const base64Url = (valor: object) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(contenido)}.firma`;
}

export function escribir(elemento: HTMLInputElement | HTMLTextAreaElement, valor: string): void {
  elemento.value = valor;
  elemento.dispatchEvent(new Event('input'));
}

export function textoDe(raiz: HTMLElement, selector: string): string {
  return raiz.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export function botonPorTexto(raiz: HTMLElement, texto: string): HTMLButtonElement | undefined {
  return Array.from(raiz.querySelectorAll('button')).find(boton =>
    boton.textContent?.replace(/\s+/g, ' ').trim().includes(texto)
  );
}
