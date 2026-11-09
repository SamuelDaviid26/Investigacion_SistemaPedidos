import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav aria-label="Navegación del cliente">
      <a
        routerLink="/nuevo-pedido"
        routerLinkActive="activo"
        ariaCurrentWhenActive="page"
      >
        Nuevo pedido
      </a>

      <a
        routerLink="/mis-pedidos"
        routerLinkActive="activo"
        ariaCurrentWhenActive="page"
      >
        Mis pedidos
      </a>
    </nav>

    <router-outlet></router-outlet>
  `,
  styles: `
    nav {
      display: flex;
      gap: 20px;
      padding: 12px 24px;
      border-bottom: 1px solid #ded7cb;
      background: white;
      font-family: Arial, sans-serif;
    }

    a {
      padding: 6px 0;
      color: #594a3d;
      text-decoration: none;
    }

    a.activo {
      border-bottom: 2px solid #784117;
      color: #784117;
      font-weight: 700;
    }
  `
})
export class ClienteLayout {}