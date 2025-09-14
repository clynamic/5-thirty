# 5-thirty

e6 staff stats aggregator

## Development Setup

The following instructions are for setting up a local development environment.

### Prerequisites

1. Install [Node.js](https://nodejs.org/en/download/)  
   The project uses Node 20 and above
2. Install [Yarn](https://yarnpkg.com/en/docs/install)  
   We use yarn instead of npm
3. Install [PostgreSQL](https://www.postgresql.org/download/)  
   This is the database we use
4. Install [pgAdmin 4](https://www.pgadmin.org/download/) (optional)  
   For easy database management

### Getting Started

1. Clone the [repository](https://github.com/clynamic/5-thirty)

```bash
git clone https://github.com/clynamic/5-thirty.git
```

2. Set up the [Frontend](https://github.com/clynamic/6oclock)  
   Follow the instructions in the README

3. Install dependencies

```bash
yarn
```

4. Set up your database  
   Create a PostgreSQL database for the project

5. Set up your environment  
   Copy `.env.example` to `.env` and fill in the required values

6. Start the development server  
   It will be available at [http://localhost:3000](http://localhost:3000)

```bash
yarn dev
```

## Deployment

For production, we recommend using our Docker setup.

1. Ensure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

2. Set up your environment
   Copy `.env.example` to `.env` and fill in the required values.
   Database configuration can be removed, as the Docker setup includes a PostgreSQL container.

3. Start the services

```bash
docker compose up -d
```

## Stack

- [NestJS](https://nestjs.com/) - js backend framework
- [Typescript](https://www.typescriptlang.org/) - javascript with types
- [Yarn](https://yarnpkg.com/) - package manager
- [ESLint](https://eslint.org/) - linting
- [Prettier](https://prettier.io/) - code formatting
- [Jest](https://jestjs.io/) - testing framework
- [TypeORM](https://typeorm.io/) - database ORM
- [PostgreSQL](https://www.postgresql.org/) - database
- [Orval](https://orval.dev/) - API client generator
- [Axios](https://axios-http.com/) - HTTP client
- [date-fns](https://date-fns.org/) - date time library
