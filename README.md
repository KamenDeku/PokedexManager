# PokeDex Manager

Aplicacion web full-stack para explorar, gestionar y administrar una coleccion personal de Pokemon.

Este proyecto esta construido para demostrar la integracion de una API externa con un sistema de base de datos relacional, manteniendo una arquitectura limpia y una interfaz de usuario moderna.

## Caracteristicas Principales

- Autenticacion basica para proteger la coleccion de cada usuario.
- Integracion directa con PokeAPI para obtener informacion detallada.
- Gestion y persistencia de datos relacionales en MySQL.
- Interfaz de usuario totalmente responsive y adaptable a cualquier dispositivo.

## Stack Tecnologico

- Framework: Next.js
- Lenguaje: TypeScript
- Base de Datos: MySQL (Gestion con MySQL Workbench)
- ORM: Prisma
- API de consumo: PokeAPI
- Gestor de paquetes: pnpm

## Requisitos Previos

Antes de comenzar, asegurate de tener instalado en tu sistema local:
- Node.js 22.12 o superior
- pnpm 11.5.2
- Un servidor de MySQL en ejecucion
- MySQL Workbench (opcional, para administrar la base de datos)

## Instrucciones de Instalacion y Ejecucion Local

Sigue los siguientes pasos para levantar el entorno de desarrollo:

1. Clona el repositorio e ingresa a la carpeta del proyecto:
```bash
git clone git@github.com:KamenDeku/PokedexManager.git
cd PokedexManager
```

2. Instala pnpm si aun no lo tienes instalado:
```bash
npm install pnpm@11.5.2
```

3. Crea la base de datos `pokedex` desde MySQL Workbench o desde la consola de MySQL:
```sql
CREATE DATABASE pokedex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Copia el archivo de variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` y completa los datos de conexion a MySQL. `DATABASE_URL` se usa para las migraciones de Prisma; `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` se usan para la conexion de la aplicacion. Ambos deben apuntar a la misma base de datos.

```env
DATABASE_URL="mysql://USUARIO:CONTRASENA@localhost:3306/pokedex"
DB_HOST=localhost
DB_PORT=3306
DB_USER=USUARIO
DB_PASSWORD=CONTRASENA
DB_NAME=pokedex

BCRYPT_SALT_ROUNDS=14
AUTH_SECRET="valor-generado-para-este-entorno"
POKE_API_URL="https://pokeapi.co/api/v2"
NEXT_PUBLIC_ITEMS_PER_PAGE=20

# Configuracion del Asistente de Inteligencia Artificial
AI_API_KEY="tu-api-key-de-gemini"
AI_API_URL="[https://generativelanguage.googleapis.com/v1beta/openai/chat/completions](https://generativelanguage.googleapis.com/v1beta/openai/chat/completions)"
AI_MODEL="gemini-3.5-flash"
```

Nota: Puedes listar los modelos de IA compatibles con tu configuración actual ejecutando el siguiente comando:
```bash
node --env-file=.env scripts/list-models.mjs
```

Genera un valor para `AUTH_SECRET` con:
```bash
openssl rand -base64 32
```

Si la contrasena de MySQL contiene caracteres especiales, codificalos para usarlos en `DATABASE_URL`.

5. Instala las dependencias:
```bash
pnpm install
```

6. Genera el cliente de Prisma y aplica las migraciones:
```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

7. Carga los datos de ejemplo para probar la aplicacion:
```bash
pnpm run seed
```

El seed crea usuarios y colecciones de prueba. Para iniciar sesion puedes usar `Professor Oak` con contrasena `oak123` y rol `PROFESSOR` o `Ash Ketchum` con contrasena `ash123` y rol `TRAINER`. Estas credenciales son solo para desarrollo local.

8. Inicia el servidor de desarrollo:
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

Para iniciar sesión, haz clic en el logo de la Pokébola ubicado en la esquina superior derecha de la pantalla. Ten en cuenta que también puedes navegar y utilizar todas las funciones de busqueda de la aplicación de forma libre sin necesidad de iniciar sesión.

## Chat de IA: Implementacion y Arquitectura
El proyecto incluye un Chat de Inteligencia Artificial (compatible con modelos como Claude o Gemini) para ayudarte a gestionar tu PokeDex. En lugar de inyectar toda la colección del usuario en el prompt, la IA utiliza function calling (tool use). El modelo decide de forma autónoma qué información necesita y el backend ejecuta las consultas interactuando con Prisma y la PokeAPI.

### Capacidades del Asistente (Lo que puede hacer)

#### Con tu coleccion (get_my_collection):
- Informarte de cuántos y cuáles Pokémon posees.
- Contabilizar la distribución de tipos para detectar debilidades en tu equipo.
- Analizar tus capturas ("¿qué tipos me faltan?", "¿tengo algo bueno contra el tipo Roca?").

#### Con la informacion de un Pokemon (get_pokemon_info):
- Proporcionar tipos, habilidades (marcando claramente cuáles son ocultas), altura y peso.
- Indicar la cantidad total de movimientos que puede aprender y mostrar 10 ejemplos.
- Permite búsquedas flexibles utilizando el nombre en inglés o el número de la Pokédex.

#### Con recomendaciones (get_pokemon_by_type):
- Listar hasta 30 Pokémon de un tipo en específico que aún no formen parte de tu colección.
- Cruzar estos datos con tu equipo actual para sugerir qué capturas priorizar y explicar el motivo estratégico.

#### Interaccion conversacional:
- Mantiene el contexto de los últimos 20 mensajes (puedes preguntar "¿y ese cuánto pesa?" y entenderá a qué Pokémon te refieres).
- Formatea sus respuestas usando Markdown para mejor legibilidad.
- Maneja el límite de peticiones de la API (rate limit) de forma controlada y con mensajes amigables.

### Limitaciones y Consideraciones Tecnicas (Lo que NO puede hacer)

#### Restricciones de acciones y privacidad:
- Solo lectura: No tiene capacidad para agregar, eliminar ni liberar Pokémon.
- Filtrado de estado: Ignora los Pokémon con estado RELEASED, contabilizando únicamente los CAUGHT.
