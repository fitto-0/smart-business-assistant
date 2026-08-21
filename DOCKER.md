# Docker Setup

This project can be run using Docker and Docker Compose for easy deployment.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed

## Quick Start

1. Clone the repository and navigate to the project root

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Edit `.env` with your actual credentials:
- Database password
- JWT secret
- API URLs

4. Start all services:
```bash
docker-compose up --build
```

This will:
- Build and start PostgreSQL database
- Build and start the backend API (port 5000)
- Build and start the frontend Next.js app (port 3000)

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432

## Development Mode

For development with hot-reload, you can modify the docker-compose.yml to mount volumes and use nodemon:

```yaml
backend:
  # ... other config
  command: npm run dev
  volumes:
    - ./backend:/app
    - /app/node_modules
```

## Stopping Services

To stop all services:
```bash
docker-compose down
```

To stop and remove volumes (this will delete database data):
```bash
docker-compose down -v
```

## Environment Variables

The following environment variables are used in the Docker setup:

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_EXPIRES_IN`: Token expiration time

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_AI_URL`: AI service URL

## Database Initialization

The backend Dockerfile automatically runs `npm run init-db` on build, which creates the necessary database tables.

## Troubleshooting

### Database Connection Issues
If the backend can't connect to the database, ensure PostgreSQL is healthy:
```bash
docker-compose ps postgres
```

### Port Conflicts
If ports 3000 or 5000 are already in use, modify the ports in docker-compose.yml:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Use port 3001 instead
```

### Rebuilding After Code Changes
After making changes to the code, rebuild the containers:
```bash
docker-compose up --build
```

## Production Deployment

For production deployment:
1. Update environment variables with secure values
2. Use a managed PostgreSQL service or configure proper backups
3. Remove volume mounts for backend/frontend in production
4. Consider using Docker Swarm or Kubernetes for orchestration
