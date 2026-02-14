# Template – NestJS, Auth JWT, Users y Prisma

Proyecto base con **autenticación JWT**, módulos **Auth** y **Users**, y **Prisma** (PostgreSQL) como ORM. Pensado para clonar y usar como plantilla en nuevos proyectos.

## Servicios principales incluidos

- **Auth**: registro, login con OTP por email, verificación de email, cambio de contraseña, recuperación de contraseña (forgot/reset).
- **Users**: perfil (CRUD básico), actualización de perfil, eliminación de cuenta (soft delete).
- **Prisma**: modelo `User` y `Otp`; fácil de extender con más modelos.
- **JWT**: acceso protegido con Bearer token y roles (CUSTOMER, OWNER, SUPERADMIN).
- **Mailer**: servicio mínimo (log en consola); sustituible por un envío real (nodemailer, MailerModule, etc.).

## Requisitos

- Node.js 18+
- PostgreSQL
- npm o yarn

## Instalación

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Editar .env con DATABASE_URL, JWT_SECRET y EMAIL_ENCRYPT_SECRET
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

## Estructura relevante

```
src/
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

## Subir a GitHub

```bash
git init
git add .
git commit -m "chore: initial template - NestJS Auth Users Prisma"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/template.git
git push -u origin main
```

Asegúrate de no subir `.env` (ya está en `.gitignore`). Usa `.env.example` como referencia.

## Licencia

MIT (o la que elijas para tu fork).
