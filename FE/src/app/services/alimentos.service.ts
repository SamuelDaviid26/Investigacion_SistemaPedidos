import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Alimento {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AlimentosService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5289/api/alimentos';

  obtenerMenu(token: string): Observable<Alimento[]> {
    return this.http.get<Alimento[]>(this.url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}