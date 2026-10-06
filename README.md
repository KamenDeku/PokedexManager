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
- Node.js (version 18 o superior recomendada)
- pnpm
- Un servidor de MySQL en ejecucion

## Instrucciones de Instalacion y Ejecucion Local

Sigue los siguientes pasos para levantar el entorno de desarrollo:
1. Clona el repositorio e ingresa a la carpeta del proyecto.
2. Instala las dependencias necesarias:
```bash
pnpm install