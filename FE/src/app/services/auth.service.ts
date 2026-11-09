import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

interface Credenciales {
  username: string;
  password: string;
}

interface RespuestaLogin {
  token: string;
}

interface RespuestaRegistro {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5289/api/auth';
  private token: string | null = null;

  iniciarSesion(credenciales: Credenciales): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.url}/login`, credenciales).pipe(
      tap(respuesta => {
        this.token = respuesta.token;
      })
    );
  }

  registrar(credenciales: Credenciales): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.url}/register`, credenciales);
  }

  obtenerToken(): string | null {
    return this.token;
  }

  esCocina(): boolean {
    if (!this.token) return false;

    const contenido = this.token.split('.')[1];
    const base64 = contenido.replace(/-/g, '+').replace(/_/g, '/');
    const datos = JSON.parse(atob(base64));

    const roles = datos.role ??
      datos['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    return Array.isArray(roles) ? roles.includes('Cocina') : roles === 'Cocina';
  }

  cerrarSesion(): void {
    this.token = null;
  }
}