import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  iniciarSesion(credenciales: Credenciales): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.url}/login`, credenciales);
  }

  registrar(credenciales: Credenciales): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.url}/register`, credenciales);
  }
}