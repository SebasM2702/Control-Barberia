# Control Negocio

Aplicación versátil para la gestión financiera de pequeños negocios y finanzas personales.

## Características
- Registro de transacciones (Ingresos/Gastos).
- Gestión de catálogos de servicios y categorías de gastos.
- Separación de flujos: Negocio y Personal.
- Reportes financieros y balance general.
- Multiplataforma (iOS/Android) con Expo y Firebase.

## Configuración
1. Clonar el repositorio.
2. Instalar dependencias: `npm install`.
3. Configurar Firebase en `utils/firebase.ts`.
4. Ejecutar con Expo: `npx expo start`.

## Migración desde Control Barbería
- Se ha generalizado la base de datos para usar `businesses` en lugar de `barberShops`.
- Los perfiles de usuario ahora usan `businessId` para vincularse al negocio.
- El scope de transacciones ha sido actualizado a `negocio` y `personal`.
