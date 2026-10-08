# PokéDex Manager

Aplicación web full-stack para explorar Pokémon, administrar colecciones personales y conversar con un asistente centrado en PokéDex.

## Características

- Explora y filtra Pokémon por nombre, número, tipo y forma mediante la PokéAPI.
- Consulta fichas con tipos, habilidades, formas, movimientos y sprites.
- Crea una colección personal persistida en MySQL. Los Pokémon repetidos no generan registros duplicados.
- Inicia sesión con usuario y contraseña; los entrenadores administran su colección y el rol `PROFESSOR` puede administrar usuarios y consultar otras colecciones.
- Usa el asistente Rotom para consultar la PokéAPI y la colección, obtener recomendaciones por tipo y guardar preferencias o datos duraderos como memoria.
- Interfaz en español con CSS Modules y diseños adaptables a pantallas pequeñas.

## Stack tecnológico

- Next.js 16 (App Router) y React 19
- TypeScript
- Prisma ORM 8 (cliente generado en `app/generated/prisma`)
- MySQL/MariaDB mediante `@prisma/adapter-mariadb`
- NextAuth.js 5 con proveedor Credentials y sesiones JWT
- bcrypt para el hash de contraseñas
- PokéAPI
- pnpm 11.5.2

## Requisitos previos

- Node.js 22.12 o superior
- Corepack y pnpm 11.5.2
- MySQL o MariaDB en ejecución, con permisos para crear tablas y ejecutar migraciones
- Una clave de API para el proveedor compatible con la API de chat que utilizará Rotom (opcional para navegar por la Pokédex; necesaria para el chat)

## Instalación y ejecución local

### 1. Clonar el proyecto e instalar pnpm

```bash
git clone https://github.com/KamenDeku/PokedexManager.git
cd PokedexManager
corepack enable
corepack prepare pnpm@11.5.2 --activate
pnpm install
```

### 2. Crear la base de datos

Crea una base de datos vacía. Por ejemplo, desde MySQL:

```sql
CREATE DATABASE pokedex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

El servidor debe aceptar conexiones desde el entorno en el que ejecutarás Next.js.

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y sustituye sus valores de muestra:

```bash
cp .env.example .env
```

Configura `.env` con valores del entorno local. `DATABASE_URL` es la URL que Prisma CLI usa para las migraciones; `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` son los parámetros que usa la aplicación mediante el adaptador MariaDB. Ambos deben apuntar a la misma base de datos.

```env
DATABASE_URL="mysql://USUARIO:CONTRASENA@localhost:3306/pokedex"
DB_HOST=localhost
DB_PORT=3306
DB_USER=USUARIO
DB_PASSWORD=CONTRASENA
DB_NAME=pokedex

BCRYPT_SALT_ROUNDS=14
AUTH_SECRET="reemplaza-por-un-secreto-aleatorio"

POKE_API_URL="https://pokeapi.co/api/v2"
NEXT_PUBLIC_ITEMS_PER_PAGE=20

# Necesarias para usar el chat de IA; conserva estas credenciales solo en el servidor.
AI_API_KEY="tu-api-key"
AI_API_URL="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
AI_MODEL="gemini-3.5-flash"
```

Genera un secreto para NextAuth, en lugar de usar el valor de ejemplo:

```bash
openssl rand -base64 32
```

Si la contraseña de MySQL contiene caracteres especiales, codifícala correctamente dentro de `DATABASE_URL`. La configuración de IA debe apuntar a un endpoint compatible con el formato de chat y herramientas que consume el backend; el modelo debe estar disponible para ese proveedor.

Para consultar los modelos ofrecidos por el endpoint configurado, puedes ejecutar:

```bash
node --env-file=.env scripts/list-models.mjs
```

### 4. Generar Prisma y aplicar migraciones

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

`migrate dev` aplica las migraciones del directorio `prisma/migrations` y puede crear nuevas migraciones cuando el esquema cambia durante el desarrollo.

### 5. Cargar datos de ejemplo

```bash
pnpm run seed
```

El seed es repetible: crea o actualiza los datos de ejemplo usando operaciones `upsert`. Para probar el inicio de sesión local:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `Professor Oak` | `oak123` | `PROFESSOR` |
| `Ash Ketchum` | `ash123` | `TRAINER` |

### 6. Iniciar la aplicación

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). Se puede explorar y buscar Pokémon sin iniciar sesión; las funciones de colección, administración y chat requieren una sesión autenticada según el rol.

## Asistente Rotom e inteligencia artificial

El asistente está disponible para usuarios autenticados. El backend envía el historial reciente y definiciones de herramientas a un endpoint de chat compatible con llamadas a funciones. Las herramientas se ejecutan en el servidor y devuelven al modelo datos limitados a la cuenta del usuario.

### Funcionalidades implementadas

- `get_my_collection`: consulta los Pokémon capturados y calcula cuántos hay por tipo.
- `get_pokemon_info`: obtiene de PokéAPI tipos, habilidades, altura, peso, movimientos de ejemplo y sprite.
- `get_pokemon_by_type`: propone Pokémon de un tipo que aún no estén en la colección, con un máximo de 30 resultados.
- Recomendaciones basadas en tipos ausentes o poco representados; no son recomendaciones derivadas de estadísticas competitivas.
- Historial conversacional persistido por usuario y contexto de hasta 20 mensajes para dar continuidad a las preguntas.
- Memoria de largo plazo por usuario para preferencias y datos no sensibles. Puede guardar, consultar y borrar memorias; cada usuario solo opera sobre sus propios datos.
- Respuestas renderizadas con Markdown. El asistente no puede agregar, liberar ni eliminar Pokémon de la colección.

La configuración por defecto del ejemplo apunta al endpoint OpenAI-compatible de Gemini indicado en `.env.example`. El endpoint, la clave y el nombre del modelo se controlan mediante `AI_API_URL`, `AI_API_KEY` y `AI_MODEL`. 

## Organización del proyecto

```text
app/
  api/                 Rutas HTTP de autenticación, colección, Pokémon, usuarios y chat
  globals.css          Estilos globales y variables de color
components/            Componentes de interfaz y hojas CSS Modules
lib/                   Acceso a Prisma, PokéAPI, autorización, IA y memoria
prisma/
  schema.prisma        Modelos y relaciones
  migrations/          Migraciones de la base de datos
  seed.ts              Datos de ejemplo
types/                 Extensiones de tipos de NextAuth
```

### Roadmap de Desarrollo (3 Días)

**Día 1: Infraestructura, Base de Datos y Backend**
El objetivo de hoy es tener la base de datos funcionando, el ORM configurado y poder leer/escribir datos.
- Inicialización: Crear el proyecto Next.js y configurar el entorno.
- Base de Datos: Crear la base de datos pokedex en MySQL.
- Prisma ORM: Definir el schema.prisma (Modelos: User, Pokemon, Collection), ejecutar la primera migración y crear/probar el script de seeding.
- Servicios y CRUD Base: Implementar las funciones para consumir la PokéAPI de forma eficiente y crear las acciones/endpoints básicos para usuarios y la colección.

**Día 2: Autenticación, Seguridad y Frontend**
El objetivo es proteger la aplicación y construir las vistas principales.
- Seguridad: Configurar la encriptación de contraseñas (bcrypt).
- Autenticación: Implementar NextAuth.js (estrategia JWT y manejo de sesiones).
- Interfaz de Usuario (UI): Diseñar la Landing Page pública, crear la página de Login con validaciones, y desarrollar las páginas protegidas de Colección y Usuarios.
- Integración: Conectar las vistas con los servicios del Día 1, asegurando operaciones idempotentes al agregar Pokémon.

**Día 3: Testing, Optimización y Bonus**
El objetivo es pulir la experiencia, documentar y agregar valor extra.
- Testing: Pruebas unitarias para funciones críticas y pruebas E2E para flujos de login y colección.
- Refactorización: Optimizar el rendimiento y limpiar el código.
- Bonus: Integración de funcionalidades opcionales avanzadas.

## Seguridad y notas de desarrollo

- Las contraseñas de usuarios se almacenan con bcrypt, nunca en texto plano.
- Las rutas de colección, usuarios y chat comprueban la sesión y, cuando corresponde, el rol del usuario.
- `AUTH_SECRET`, las credenciales de base de datos y `AI_API_KEY` son valores privados del servidor; no uses prefijos `NEXT_PUBLIC_` para ellos.
- Los valores de credenciales del seed solo deben usarse en entornos locales de prueba.
