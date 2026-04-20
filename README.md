# Template-Nestjs

Proyecto orientado a **agencias de viaje en EE.UU.** que necesitan agilizar el trabajo con imágenes de pasaportes. El objetivo principal es **automatizar la aprobación de fotos de pasaporte**: recibir una imagen desde el frontend, validarla con **Gemini** (requisitos oficiales USA) y, cuando esté integrado, con el **checker del gobierno** (p. ej. State Department Photo Tool), para devolver si la imagen sirve o no. Se irán añadiendo más servicios.

## Servicio principal: validación de imagen de pasaporte

- **POST /passport/validate-image**: recibe una imagen (multipart `image`), la analiza con **Gemini** (tamaño 2x2 in, cabeza 1–1⅜ in, fondo blanco, iluminación, expresión, etc.) y devuelve `approved`, `gemini`, `govCheck` y `recommendation`. El checker del gobierno está preparado como stub para integrar después (p. ej. con Playwright en [Photo Tool](https://tsg.phototool.state.gov/photo)).
- Requiere **GEMINI_API_KEY** en `.env` para la validación con IA.

## Resto de servicios (base del template)

- **Auth**: registro, login con OTP por email, verificación de email, cambio/recuperación de contraseña.
- **Users**: perfil (CRUD), actualización, eliminación de cuenta (soft delete).
- **Prisma**: modelos `User` y `Otp`; fácil de extender.
- **JWT**: rutas protegidas con Bearer y roles (CUSTOMER, OWNER, SUPERADMIN).
- **Mailer**: servicio mínimo (log); sustituible por envío real.

## Requisitos

- Node.js 18+
- PostgreSQL
- npm o yarn

## Instalación

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Editar .env: DATABASE_URL, JWT_SECRET, EMAIL_ENCRYPT_SECRET, GEMINI_API_KEY (para validación de fotos)
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

- **API**: http://localhost:3000  
- **Swagger**: http://localhost:3000/api  

## Variables de entorno (.env)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar JWTs |
| `EMAIL_ENCRYPT_SECRET` | Clave para encriptar tokens de verificación de email (≥ 32 caracteres recomendado) |
| `HOST_URL` | URL base de la API (para links de verificación) |
| `EMAIL_VERIFICATION_URL` | Ruta de verificación de email (ej. `/auth/verify-email`) |
| `VERIFY_EMAIL_SUCCESS_URL` / `VERIFY_EMAIL_ERROR_URL` | URLs de redirección tras verificar email |
| `GEMINI_API_KEY` | API key de Google AI (Gemini) para validación de imágenes de pasaporte |

## Estructura relevante

```
src/
├── passport-image/ # Validación de fotos pasaporte USA (Gemini + gov checker)
├── auth/           # Login, registro, OTP, verificación email, cambio/recuperación contraseña
├── users/          # CRUD usuario, perfil, soft delete
├── prisma/         # PrismaService y módulo global
├── common/         # Decoradores, interfaces, utils, mailer mínimo
prisma/
└── schema.prisma   # Modelos User y Otp (ampliables)
```

## Comandos útiles

- `npm run start:dev` – Desarrollo con hot-reload  
- `npm run prisma:generate` – Generar cliente Prisma  
- `npm run prisma:migrate` – Crear/aplicar migraciones  
- `npm run prisma:studio` – Abrir Prisma Studio  

## Cómo extender el template

1. **Más modelos**: Añadir modelos en `prisma/schema.prisma` y ejecutar `prisma migrate dev`.
2. **Correo real**: Sustituir `src/common/mailer/mailer.service.ts` por una implementación con nodemailer o `@nestjs-modules/mailer`.
3. **Subida de archivos**: Añadir módulo de upload (ej. Multer) y usarlo en registro/actualización de perfil.
4. **Pagos / negocio**: Añadir módulos (Stripe, negocio, etc.) e importarlos en `AuthModule`/`UsersModule` según necesites.

## Repositorio

https://github.com/ysanchezcr7/Template-Nestjs

Asegúrate de no subir `.env` (ya está en `.gitignore`). Usa `.env.example` como referencia.

## Licencia

MIT (o la que elijas para tu fork).
