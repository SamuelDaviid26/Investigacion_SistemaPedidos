# Demostración de los puntos 2 y 3

Todos los comandos se ejecutan desde la carpeta `FE/`.

## Antes de empezar

- Los puertos 4200 y 5289 deben estar libres (cierra cualquier API o `ng serve` abierto).
- Se necesita SQL Server local con autenticación de Windows, `sqlcmd` y `dotnet-ef`.
- El E2E usa **solo** la base `SistemaPedidosDB_E2E`: la recrea en cada ejecución y el script se niega a
  trabajar con un nombre que no termine en `_E2E` (`e2e/preparar-api.mjs`). Las variables `E2E_DB` y
  `E2E_SQL_SERVER` no deben estar definidas.
- Dependencias instaladas: `npm ci` y, una sola vez, `npx playwright install chromium`.
- Las pruebas unitarias sueltas se ejecutan con `--no-coverage`. El proyecto exige umbrales de cobertura
  que solo tienen sentido con la suite completa; sin esa opción una ejecución parcial falla por cobertura
  y no por el error que se quiere mostrar.

---

# Punto 2. Prueba de extremo a extremo

**Archivo a abrir:** `e2e/flujo-completo.e2e.ts` (usa `e2e/fixtures.ts`).

**Comando:**

```bash
npx playwright test e2e/flujo-completo.e2e.ts
```

Tarda unos 25 a 30 segundos porque primero recrea la base de pruebas, compila y levanta la API, y
arranca el frontend.

**Qué hace.** Es una sola prueba con dos sesiones del navegador al mismo tiempo: el cliente y cocina.
Todo se hace por la interfaz.

| Paso | Acción | Qué comprueba |
|---|---|---|
| 1 | El cliente inicia sesión | Llega a `/nuevo-pedido` y ve el título "Nuevo pedido" |
| 2 | Crea un pedido de 2 Hamburguesa con un detalle único | Aparece "Pedido #N recibido: 2 × Hamburguesa." |
| 3 | Abre Mis pedidos | El pedido está registrado: "2 × Hamburguesa" en estado "Recibido" |
| 4 | Cocina actualiza la lista y pulsa "Empezar a preparar" | Cocina recibe el pedido como "Recibido" y pasa a "En preparación" |
| 5 | Cocina pulsa "Marcar como listo" | Pasa a "Listo para recoger" y la fila ya no tiene botón |
| 6 | El cliente pulsa "Actualizar" | Ve su pedido en "Listo para recoger" |

**Resultado esperado:** `1 passed` (la prueba dura unos 3 a 4 segundos).

**Por qué es estable:** los elementos se localizan por rol y etiqueta (`getByRole`, `getByLabel`) y las
filas de pedidos por `data-testid="pedido"`. No hay esperas fijas: solo las aserciones con espera
automática de Playwright. Cada ejecución crea un usuario nuevo y marca su pedido con un texto único.

---

# Punto 3. Tres errores intencionales

Después de cada demostración se restaura el archivo y se vuelve a ejecutar la prueba. Haz una
demostración a la vez.

## Tabla resumen (resultados reales de esta versión)

| | Error 1. Lógica | Error 2. Comunicación con la API | Error 3. Interfaz |
|---|---|---|---|
| **Archivo** | `src/app/services/auth.service.ts` (método `esCocina()`) | `src/app/services/pedidos.service.ts` (método `crear()`) | `src/app/pages/cocina/cocina.css` (regla `.principal`) |
| **Modificación** | Cambiar `===` por `!==` en la última comparación de `esCocina()` | Quitar el bloque `headers: { Authorization: ... }` de `http.post` | Agregar `display: none;` dentro de `.principal` |
| **Tipo de prueba que lo detecta** | Unitaria de servicio | Unitaria HTTP (`HttpTestingController`) | E2E (Playwright) |
| **Prueba que falla** | En `auth.service.spec.ts`, bloque `esCocina`: **"reconoce el rol Cocina en el claim largo de Microsoft"**, **"reconoce el rol Cocina en el claim corto "role""** y **"es falso para un cliente sin rol o con otro rol"** | En `pedidos.service.spec.ts`: **"crear envía el pedido con el token y devuelve el pedido creado"** | En `e2e/flujo-completo.e2e.ts`: el paso **"4. Cocina ve el pedido y lo pasa a En preparación"** |
| **Resultado real** | `3 failed \| 6 passed (9)` en el archivo; en toda la suite `3 failed \| 87 passed (90)` | `1 failed \| 6 passed (7)` en el archivo, con `expected null to be 'Bearer token-de-prueba'`; en toda la suite `1 failed \| 89 passed (90)` | E2E: `TimeoutError: locator.click: Timeout 10000ms exceeded`. Suite E2E completa: `3 failed \| 28 passed` (ver nota). Unitarias: `90 passed` |
| **También lo detecta** | El E2E del flujo completo: la cuenta de cocina termina en `/nuevo-pedido` en vez de `/cocina` | El E2E del flujo completo: la API responde 401 y nunca aparece "Pedido #N recibido" | Nada más: ninguna unitaria lo detecta |
| **Qué puede dejarlo pasar** | Las pruebas de componentes (las otras 87 pasan): usan un doble de `AuthService` y no ejecutan el `esCocina()` real | Las pruebas de componentes (las otras 89 pasan): usan un doble de `PedidosService` y no ven la petición HTTP real | **Todas las unitarias (90 de 90 pasan)**: revisan el HTML generado, que sigue teniendo el botón, y no calculan si es visible |
| **Cómo restaurar** | Volver a `===` o `git checkout -- src/app/services/auth.service.ts` | Volver al bloque con `headers` o `git checkout -- src/app/services/pedidos.service.ts` | Quitar `display: none;` o `git checkout -- src/app/pages/cocina/cocina.css` |
| **Resultado tras restaurar** | `9 passed (9)` | `7 passed (7)` | E2E del flujo: `1 passed` |

Nota del error 3: además del flujo completo, fallaron dos pruebas de `e2e/cocina.e2e.ts` ("un pedido
avanza de Recibido a Listo para recoger y el cliente lo ve" y "el cliente ve En preparación mientras
cocina todavía no termina") porque también necesitan pulsar ese botón.

Conclusión para el profesor: los defectos de lógica y de comunicación se encuentran rápido (unos 10
segundos) con pruebas unitarias; el defecto de interfaz solo lo encuentra una prueba que usa un
navegador real. El E2E es más lento (25 a 35 segundos) y su fallo es un tiempo agotado, pero cubre
los tres.

---

## Demostración del error 1: lógica

**Archivo:** `src/app/services/auth.service.ts`, método `esCocina()`, última línea (aprox. línea 50).

Código original:

```ts
return Array.isArray(roles) ? roles.includes('Cocina') : roles === 'Cocina';
```

Código incorrecto:

```ts
return Array.isArray(roles) ? roles.includes('Cocina') : roles !== 'Cocina';
```

**Comando:**

```bash
npx ng test --watch=false --no-coverage --include src/app/services/auth.service.spec.ts
```

**Debe fallar:** 3 pruebas del bloque `esCocina` (resultado `3 failed | 6 passed`), las tres listadas en
la tabla.

**Por qué falla:** con `!==` la función responde al revés. Un usuario con el rol Cocina deja de serlo y
un cliente sin rol pasa a ser cocina. La prueba construye un token y comprueba la respuesta correcta.

**Restaurar:** volver a `===` (o `git checkout -- src/app/services/auth.service.ts`) y repetir el
comando. Debe dar `9 passed`.

## Demostración del error 2: comunicación con la API

**Archivo:** `src/app/services/pedidos.service.ts`, método `crear()` (aprox. líneas 25 a 29).

Código original:

```ts
return this.http.post<Pedido>(this.url, pedido, {
  headers: { Authorization: `Bearer ${token}` }
});
```

Código incorrecto:

```ts
return this.http.post<Pedido>(this.url, pedido);
```

**Comando:**

```bash
npx ng test --watch=false --no-coverage --include src/app/services/pedidos.service.spec.ts
```

**Debe fallar:** "crear envía el pedido con el token y devuelve el pedido creado", con el mensaje
`AssertionError: expected null to be 'Bearer token-de-prueba'` (resultado `1 failed | 6 passed`).

**Por qué falla:** la prueba intercepta la petición con `HttpTestingController` y comprueba que lleve
la cabecera `Authorization: Bearer ...`. Sin ella la API real respondería 401.

**Restaurar:** volver al bloque con `headers` (o `git checkout -- src/app/services/pedidos.service.ts`)
y repetir el comando. Debe dar `7 passed`.

## Demostración del error 3: interfaz

**Archivo:** `src/app/pages/cocina/cocina.css`, regla `.principal` (aprox. línea 47).

Código original:

```css
.principal {
    border-color: #784117;
    background: #784117;
    color: white;
}
```

Código incorrecto (agregar la primera línea):

```css
.principal {
    display: none;
    border-color: #784117;
    background: #784117;
    color: white;
}
```

**Paso previo para contrastar (opcional, unos 10 segundos):**

```bash
npx ng test --watch=false --no-coverage
```

Debe dar `90 passed`: las pruebas unitarias no notan que el botón desapareció.

**Comando de la demostración:**

```bash
npx playwright test e2e/flujo-completo.e2e.ts
```

**Debe fallar:** el flujo completo, en el paso "4. Cocina ve el pedido y lo pasa a En preparación", con
`TimeoutError: locator.click: Timeout 10000ms exceeded` esperando el botón "Empezar a preparar".

**Por qué falla:** el botón sigue existiendo en el HTML, pero con `display: none` el usuario no puede
verlo ni pulsarlo. Playwright usa un navegador real y espera un botón visible. Las unitarias corren en
jsdom, que no calcula la visibilidad real.

**Restaurar:** quitar `display: none;` (o `git checkout -- src/app/pages/cocina/cocina.css`) y repetir
el comando. Debe dar `1 passed`. Para ver la captura del fallo: `npx playwright show-report`.

---

## Comprobar que no quedó ningún error activo

```bash
git status
git diff -- src/app/services/auth.service.ts src/app/services/pedidos.service.ts src/app/pages/cocina/cocina.css
```

Los tres archivos deben aparecer sin cambios (el `git diff` no imprime nada).
