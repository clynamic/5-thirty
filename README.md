# 5-thirty

e6 staff aggregator

## Setup

1. Install [Node.js](https://nodejs.org/en/download/)  
   The project uses Node 20 and above
2. Install [Yarn](https://yarnpkg.com/en/docs/install)  
   We use yarn instead of npm
3. Clone the [repository](https://github.com/clynamic/5-thirty)

```bash
git clone https://github.com/clynamic/5-thirty.git
```

4. Set up the [Frontend](https://github.com/clynamic/6oclock)  
   Follow the instructions in the README

5. Install dependencies

```bash
yarn
```

6. Start the development server  
   It will be available at [http://localhost:3000](http://localhost:3000)

```bash
yarn dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required: E621 API credentials for server operations
E621_GLOBAL_USERNAME=your_username
E621_GLOBAL_API_KEY=your_api_key

# Optional: CORS configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Data directory
DATA_DIR=./data

# Optional: Users which have admin privileges for managing the server
SERVER_ADMINS=admin1,admin2,admin3
```

## Stack

- [NestJS](https://nestjs.com/) - js backend framework
- [Typescript](https://www.typescriptlang.org/) - javascript with types
- [Yarn](https://yarnpkg.com/) - package manager
- [ESLint](https://eslint.org/) - linting
- [Prettier](https://prettier.io/) - code formatting
- [TypeORM](https://typeorm.io/) - database ORM
- [SQLite](https://www.sqlite.org/index.html) - database
- [Orval](https://orval.dev/) - API client generator
- [Axios](https://axios-http.com/) - HTTP client
- [Luxon](https://moment.github.io/luxon/) - date time library
