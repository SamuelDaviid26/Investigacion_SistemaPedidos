import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-cocina',
  standalone: true,
  templateUrl: './cocina.html',
  styleUrl: './cocina.css'
})
export class CocinaPagina implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);
  private readonly router = inject(Router);

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(false);
  readonly pedidoEnProceso = signal<number | null>(null);
  readonly error = signal('');

  readonly nombresEstado: Record<Pedido['estado'], string> = {
    Recibido: 'Recibido',
    EnPreparacion: 'En preparación',
    ListoParaRecoger: 'Listo para recoger'
  };

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    if (this.cargando() || this.pedidoEnProceso() !== null) return;

    const token = this.auth.obtenerToken();
    if (!token) {
      this.salir();
      return;
    }

    this.error.set('');
    this.cargando.set(true);

    this.pedidosService.obtenerPedidos(token)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: pedidos => this.pedidos.set(pedidos),
        error: (respuesta: HttpErrorResponse) =>
          this.mostrarError(respuesta, 'No se pudieron cargar los pedidos.')
      });
  }

  avanzar(pedido: Pedido): void {
    if (this.cargando() || this.pedidoEnProceso() !== null) return;
    if (pedido.estado === 'ListoParaRecoger') return;

    const token = this.auth.obtenerToken();
    if (!token) {
      this.salir();
      return;
    }

    const nuevoEstado = pedido.estado === 'Recibido'
      ? 'EnPreparacion'
      : 'ListoParaRecoger';

    this.error.set('');
    this.pedidoEnProceso.set(pedido.id);

    this.pedidosService.cambiarEstado(pedido.id, nuevoEstado, token)
      .pipe(finalize(() => this.pedidoEnProceso.set(null)))
      .subscribe({
        next: actualizado => {
          this.pedidos.update(pedidos =>
            pedidos.map(actual => actual.id === actualizado.id ? actualizado : actual)
          );
        },
        error: (respuesta: HttpErrorResponse) =>
          this.mostrarError(
            respuesta,
            `No se pudo actualizar el pedido #${pedido.id}. Pulsá Actualizar para consultar su estado.`
          )
      });
  }

  salir(): void {
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/acceso');
  }

  private mostrarError(respuesta: HttpErrorResponse, mensaje: string): void {
    if (respuesta.status === 401) {
      this.salir();
      return;
    }

    this.error.set(
      respuesta.status === 403
        ? 'Esta cuenta no tiene permiso de cocina.'
        : mensaje
    );
  }
}