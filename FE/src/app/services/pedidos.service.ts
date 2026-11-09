import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface NuevoPedido {
  plato: string;
  cantidad: number;
  observacion: string;
}

export interface Pedido {
  id: number;
  plato: string;
  cantidad: number;
  observacion: string | null;
  fechaCreacion: string;
  estado: 'Recibido' | 'EnPreparacion' | 'ListoParaRecoger';
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5289/api/pedidos';

  crear(pedido: NuevoPedido, token: string): Observable<Pedido> {
    return this.http.post<Pedido>(this.url, pedido, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  obtenerPedidos(token: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.url, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  cambiarEstado(
    id: number,
    nuevoEstado: 'EnPreparacion' | 'ListoParaRecoger',
    token: string
  ): Observable<Pedido> {
    return this.http.patch<Pedido>(
      `${this.url}/${id}/estado`,
      { newStatus: nuevoEstado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}