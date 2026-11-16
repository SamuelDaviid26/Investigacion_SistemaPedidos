# SistemaPedidos

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

End-to-end tests use [Playwright](https://playwright.dev/) (`e2e/*.e2e.ts`):

```bash
npx playwright install chromium   # solo la primera vez
npm run e2e
```

Requisitos: SQL Server local con autenticación de Windows, `sqlcmd` y `dotnet-ef` en el PATH.
`npm run e2e` hace todo lo necesario:

- Recrea la base `SistemaPedidosDB_E2E` (el nombre debe terminar en `_E2E`; se puede cambiar con
  `E2E_DB` y `E2E_SQL_SERVER`), aplica las migraciones y levanta la API en `http://localhost:5289`
  con una clave JWT de pruebas. No reutiliza una API ya abierta: cierra la que esté en ese puerto.
- Levanta el frontend en `http://localhost:4200` (o reutiliza el que ya esté abierto).
- Registra la cuenta `cocina_e2e` y le asigna el rol Cocina (`e2e/sql/asignar-rol-cocina.sql`).

Cada prueba crea sus propios usuarios y marca sus pedidos con un texto único, así que corren en
paralelo sin interferirse. Los elementos se localizan por rol y etiqueta accesible; las tarjetas
y filas de pedidos usan `data-testid="pedido"`. El token vive solo en memoria, por eso las
pruebas navegan con el historial en lugar de recargar la página.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
