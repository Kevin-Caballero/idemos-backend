# Backend Service

Servicio principal de la API de iDemos. Gestiona las iniciativas parlamentarias, los votos de los usuarios y los follows. Se expone como microservicio RabbitMQ (cola `backend_queue`).

## Módulos

- **Initiatives** — consulta y filtrado de iniciativas parlamentarias.
- **Votes** — registro y consulta de votos de los usuarios sobre iniciativas.
- **Follows** — seguimiento de iniciativas por parte de los usuarios.

## Comunicación

Escucha en la cola `backend_queue` (RabbitMQ). Se comunica con los servicios de Auth, AI y ETL a través de sus respectivas colas.

## Variables de entorno

| Variable       | Por defecto             | Descripción                                   |
| -------------- | ----------------------- | --------------------------------------------- |
| `DB_HOST`      | `localhost`             | Host de PostgreSQL                            |
| `DB_PORT`      | `5432`                  | Puerto de PostgreSQL                          |
| `DB_NAME`      | `idemos`                | Nombre de la base de datos                    |
| `DB_USER`      | `postgres`              | Usuario de PostgreSQL                         |
| `DB_PASSWORD`  | `postgres`              | Contraseña de PostgreSQL                      |
| `RABBITMQ_URL` | `amqp://localhost:5672` | URL de conexión a RabbitMQ                    |
| `NODE_ENV`     | —                       | `development` activa `synchronize` en TypeORM |

## Required versions

| Tool / Package          | Version |
| ----------------------- | ------- |
| Node.js                 | >= 20.0 |
| npm                     | >= 10.0 |
| TypeScript              | ^5.7.3  |
| NestJS (`@nestjs/core`) | ^11.0.1 |
| TypeORM                 | ^0.3.20 |
| `@nestjs/typeorm`       | ^11.0.0 |
| `@nestjs/microservices` | ^11.0.1 |
| PostgreSQL (`pg`)       | ^8.13.3 |
| RxJS                    | ^7.8.1  |

> Node.js 20+ is required for native `.env` file loading via `--env-file`.

## Scripts

```bash
npm run start:dev   # development (watch mode)
npm run start:prod  # production
npm run test        # unit tests
npm run test:e2e    # e2e tests
```
