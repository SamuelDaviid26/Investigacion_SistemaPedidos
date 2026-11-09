import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidosPagina implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);
  private readonly router = inject(Router);

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly nombresEstado: Record<Pedido['estado'], string> = {
    Recibido: 'Recibido',
    EnPreparacion: 'En preparación',
    ListoParaRecoger: 'Listo para recoger'
  };

  ngOnInit(): void {
    this.actualizar();
  }

  actualizar(): void {
    if (this.cargando()) return;

    const token = this.auth.obtenerToken();

    if (!token) {
      this.salir();
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.pedidosService.obtenerPedidos(token)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: pedidos => {
          this.pedidos.set([...pedidos].sort((a, b) => b.id - a.id));
        },
        error: (respuesta: HttpErrorResponse) => {
          if (respuesta.status === 401) {
            this.salir();
            return;
          }

          this.error.set('No se pudieron actualizar tus pedidos. Intentá de nuevo.');
        }
      });
  }

  salir(): void {
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/acceso');
  }
}