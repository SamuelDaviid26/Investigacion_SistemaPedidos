import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './acceso.html',
  styleUrl: './acceso.css'
})
export class Acceso {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  readonly esRegistro = signal(false);
  readonly enviando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  readonly formulario = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  cambiarModo(): void {
    this.esRegistro.update(valor => !valor);
    this.formulario.controls.password.reset();
    this.mensaje.set('');
    this.error.set('');
  }

  enviar(): void {
    if (this.enviando()) return;

    this.mensaje.set('');
    this.error.set('');

    const datos = this.formulario.getRawValue();
    const credenciales = {
      username: datos.username.trim(),
      password: datos.password
    };

    if (this.formulario.invalid || !credenciales.username) {
      this.error.set('Ingresá tu usuario y contraseña.');
      return;
    }

    this.enviando.set(true);

    if (this.esRegistro()) {
      this.auth.registrar(credenciales)
        .pipe(finalize(() => this.enviando.set(false)))
        .subscribe({
          next: () => {
            this.esRegistro.set(false);
            this.formulario.controls.password.reset();
            this.mensaje.set('Cuenta creada. Ingresá tu contraseña para iniciar sesión.');
          },
          error: (respuesta: HttpErrorResponse) => this.mostrarError(respuesta)
        });
      return;
    }

    this.auth.iniciarSesion(credenciales)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: ({ token }) => {
          if (!token) {
            this.error.set('La API respondió sin un token de acceso.');
            return;
          }

          this.formulario.controls.password.reset();
          this.mensaje.set(`Sesión iniciada como ${credenciales.username}.`);
        },
        error: (respuesta: HttpErrorResponse) => this.mostrarError(respuesta)
      });
  }

  private mostrarError(respuesta: HttpErrorResponse): void {
    if (respuesta.status === 0) {
      this.error.set('No se pudo conectar con la API. Revisá si está encendida.');
    } else if (respuesta.status === 401) {
      this.error.set('Usuario o contraseña incorrectos.');
    } else if (Array.isArray(respuesta.error)) {
      this.error.set(respuesta.error.join(' '));
    } else {
      this.error.set('No se pudo completar la solicitud. Intentá de nuevo.');
    }
  }
}