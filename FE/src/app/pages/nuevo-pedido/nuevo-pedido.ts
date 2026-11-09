import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FOTOS_MENU } from '../../fotos-menu';
import { Alimento, AlimentosService } from '../../services/alimentos.service';
import { AuthService } from '../../services/auth.service';
import { PedidosService } from '../../services/pedidos.service';

@Component({
  selector: 'app-nuevo-pedido',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './nuevo-pedido.html',
  styleUrl: './nuevo-pedido.css'
})
export class NuevoPedidoPagina implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly alimentosService = inject(AlimentosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly fotos = FOTOS_MENU;
  readonly alimentos = signal<Alimento[]>([]);
  readonly seleccionado = signal<Alimento | null>(null);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly errorMenu = signal('');
  readonly errorPedido = signal('');
  readonly confirmacion = signal('');

  readonly formulario = this.formBuilder.nonNullable.group({
    cantidad: [1, [
      Validators.required,
      Validators.min(1),
      Validators.max(2147483647),
      Validators.pattern(/^\d+$/)
    ]],
    observacion: ['', Validators.maxLength(1000)]
  });

  ngOnInit(): void {
    this.cargarMenu();
  }

  cargarMenu(): void {
    const token = this.auth.obtenerToken();
    if (!token) {
      this.salir();
      return;
    }

    this.cargando.set(true);
    this.errorMenu.set('');

    this.alimentosService.obtenerMenu(token)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: alimentos => this.alimentos.set(alimentos),
        error: (respuesta: HttpErrorResponse) => {
          if (respuesta.status === 401) {
            this.salir();
            return;
          }

          this.errorMenu.set('No se pudo cargar el menú.');
        }
      });
  }

  seleccionar(alimento: Alimento): void {
    this.seleccionado.set(alimento);
    this.confirmacion.set('');
    this.errorPedido.set('');
  }

  enviarPedido(): void {
    const alimento = this.seleccionado();
    const token = this.auth.obtenerToken();

    if (!token) {
      this.salir();
      return;
    }

    if (!alimento || this.enviando() || this.formulario.invalid) return;

    const { cantidad, observacion } = this.formulario.getRawValue();

    this.enviando.set(true);
    this.errorPedido.set('');
    this.confirmacion.set('');

    this.pedidosService.crear({
      plato: alimento.nombre,
      cantidad,
      observacion: observacion.trim()
    }, token)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: pedido => {
          this.confirmacion.set(`Pedido #${pedido.id} recibido: ${pedido.cantidad} × ${pedido.plato}.`);
          this.seleccionado.set(null);
          this.formulario.reset();
        },
        error: (respuesta: HttpErrorResponse) => {
          if (respuesta.status === 401) {
            this.salir();
            return;
          }

          const mensaje = typeof respuesta.error === 'string'
            ? respuesta.error
            : 'No se pudo enviar el pedido.';

          this.errorPedido.set(mensaje);
        }
      });
  }

  salir(): void {
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/acceso');
  }
}