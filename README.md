# AI Accounting Recommendation System (Backend API)

A robust backend API for an intelligent accounting recommendation system built with **Express.js** and **Prisma ORM**. This system leverages AI to provide automated financial insights and recommendations through a well-structured REST API.

## Tech Stack

- **Framework**: Express.js - Fast, unopinionated web framework for Node.js
- **ORM**: Prisma - Modern database toolkit with type-safe queries
- **Database**: MySQL - Reliable relational database
- **AI Integration**: OpenRouter API with DeepSeek model
- **Runtime**: Node.js
- **Language**: JavaScript/TypeScript

## Features

- 🤖 AI-powered accounting recommendations via OpenRouter
- 🗄️ MySQL database with Prisma ORM integration
- 🚀 RESTful API architecture with Express.js
- 🔒 Type-safe database queries with Prisma
- 🌍 Environment-based configuration
- 📊 Structured accounting data management
- 🔄 Database migrations and seeding support

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher recommended)
- **MySQL Server** (v8.0 or higher)
- **npm** or **yarn** package manager
- **Prisma CLI** (will be installed with dependencies)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-accounting-recommendation-system
```

2. Install dependencies:

```bash
npm install
```

3. Set up Prisma:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

4. Set up your environment variables by copying the example file:

```bash
cp env.example .env
```

5. Configure your environment variables (see Configuration section below)

6. Set up your MySQL database:

```bash
# Create the database
mysql -u root -p
CREATE DATABASE db_akuntansi;
EXIT;
```

7. Initialize Prisma schema:

```bash
# Push the schema to database
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="mysql://root:@localhost:3306/db_akuntansi"

# Server Configuration
PORT=3000
NODE_ENV=development

# AI Integration
OPENROUTER_API_KEY=your-open-router-api-key
OPENROUTER_MODEL=deepseek/deepseek-r1:free

# Application Settings
SITE_URL=http://localhost:3000
SITE_NAME=AI Accounting Recommendation System
```

### Environment Variables Explanation

| Variable             | Description                      | Default/Example                               |
| -------------------- | -------------------------------- | --------------------------------------------- |
| `DATABASE_URL`       | MySQL connection string          | `mysql://root:@localhost:3306/db_akuntansi`   |
| `PORT`               | Port number for the server       | `3000`                                        |
| `NODE_ENV`           | Environment mode                 | `development`                                 |
| `OPENROUTER_API_KEY` | API key for OpenRouter service   | Get from [OpenRouter](https://openrouter.ai/) |
| `OPENROUTER_MODEL`   | AI model to use                  | `deepseek/deepseek-r1:free`                   |
| `SITE_URL`           | Base URL of your application     | `http://localhost:3000`                       |
| `SITE_NAME`          | Display name of your application | `AI Accounting Recommendation System`         |

## Getting Started

1. Make sure MySQL is running and the database exists
2. Configure your `.env` file with proper values
3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Integration

This system uses OpenRouter to access AI models for generating accounting recommendations. To get started:

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Replace `your-open-router-api-key` in your `.env` file

## Database & Prisma ORM

This project uses **Prisma ORM** for database management, providing:

- **Type-safe database queries** - Auto-generated TypeScript types
- **Database migrations** - Version control for your database schema
- **Prisma Studio** - Visual database browser
- **Query optimization** - Efficient SQL query generation

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name migration_name

# Reset database and apply all migrations
npx prisma migrate reset

# View your data with Prisma Studio
npx prisma studio

# Push schema changes to database (for prototyping)
npx prisma db push

# Seed the database
npx prisma db seed
```

### Database Schema

The application uses a MySQL database named `db_akuntansi` with Prisma managing the schema. The schema is defined in `prisma/schema.prisma` and includes models for accounting entities like:

- Users and authentication
- Financial transactions
- Account categories
- AI recommendation logs
- Audit trails

## Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Prisma commands
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database with sample data

# Database operations
npm run db:reset          # Reset database
npm run db:push           # Push schema to database
```

### Project Structure

```
├── config/                # Application configuration files
├── controllers/           # Express route controllers
├── middlewares/           # Express middleware functions
├── models/                # Data models and business entities
├── node_modules/          # NPM dependencies (auto-generated)
├── prisma/               # Prisma ORM files
│   ├── schema.prisma     # Database schema definition
│   ├── migrations/       # Database migration files
│   └── seed.js           # Database seeding script
├── routes/               # API route definitions
├── services/             # Business logic and external integrations
├── tests/                # Test files and test utilities
├── utils/                # Helper functions and utilities
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── package.json          # Node.js dependencies and scripts
├── server.js             # Main application entry point
└── README.md             # This file
```

### API Architecture

The backend follows a layered architecture:

1. **Routes Layer** (`/routes`) - Defines API endpoints and HTTP methods
2. **Controller Layer** (`/controllers`) - Handles HTTP requests/responses
3. **Middleware Layer** (`/middlewares`) - Authentication, validation, logging
4. **Service Layer** (`/services`) - Contains business logic and AI integration
5. **Model Layer** (`/models`) - Data models and business entities
6. **Data Layer** (`/prisma`) - Database schema and Prisma ORM queries
7. **Configuration Layer** (`/config`) - App settings and environment configs
8. **Utilities Layer** (`/utils`) - Helper functions and common utilities

### Example API Endpoints

```
GET    /api/health              # Health check
POST   /api/auth/login          # User authentication
GET    /api/transactions        # Get transactions
POST   /api/transactions        # Create transaction
GET    /api/recommendations     # Get AI recommendations
POST   /api/recommendations     # Generate new recommendation
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a production-ready MySQL instance
3. Update `SITE_URL` to your production domain
4. Ensure your OpenRouter API key has sufficient credits
5. Configure proper security measures

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or need help:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Contact the development team

## Changelog

### v1.0.0

- Initial release
- Basic AI recommendation functionality
- MySQL database integration
- OpenRouter AI integration
