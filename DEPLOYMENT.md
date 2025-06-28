# Profitra Deployment Guide

This document outlines the steps required to deploy the Profitra application to a production environment.

## Project Structure

The project is organized into two main directories:
- `frontend`: React application built with Vite
- `backend`: Express.js API server with SQLite database

## Prerequisites

- Node.js v16+ and npm
- Git
- Access to the deployment environment (hosting provider)

## Frontend Deployment

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

This will create a `dist` directory with optimized static files ready for deployment.

### 2. Configure Environment Variables

Ensure the `.env` file in the project root has the correct production values:

```
VITE_API_URL=https://your-api-domain.com/api
```

### 3. Deploy Frontend

The frontend can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.):

- Upload the contents of the `frontend/dist` directory to your hosting provider
- Configure the hosting provider to handle client-side routing (SPA redirects)
- Set up any required environment variables on the hosting platform

## Backend Deployment

### 1. Prepare the Backend

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Update the `.env` file with production values:

```
JWT_SECRET=your-secure-production-jwt-secret
CLIENT_URL=https://your-frontend-domain.com
PORT=3001 (or as required by your hosting provider)
```

### 3. Database Setup

The SQLite database will be initialized automatically on first run. For production:

- Consider using a more robust database solution for high-traffic applications
- Ensure the database directory has proper write permissions
- Set up regular database backups

### 4. Deploy Backend

The backend can be deployed to any Node.js hosting service (Heroku, DigitalOcean, AWS, etc.):

- Upload the backend code to your hosting provider
- Configure the hosting provider to run `npm start` to start the server
- Set up any required environment variables on the hosting platform
- Configure proper CORS settings in `server/index.js` to allow requests from your frontend domain

## Post-Deployment Steps

### 1. Create Admin User

After deployment, create an admin user:

```bash
# Option 1: Use the provided script
node backend/promote-admin.js <user-email>

# Option 2: Direct database update
# Connect to your database and run:
UPDATE users SET role = 'admin' WHERE email = '<user-email>';
```

### 2. Verify Admin Panel Access

- Log in with the admin user credentials
- Navigate to the admin panel
- Verify all admin features are working:
  - User management
  - Wallet address updates
  - Platform status configuration
  - Investment data display

### 3. Security Considerations

- Ensure JWT_SECRET is strong and unique in production
- Set up HTTPS for both frontend and backend
- Configure proper CORS settings
- Implement rate limiting for API endpoints
- Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS configuration includes your frontend domain
2. **Authentication Failures**: Verify JWT token handling and localStorage key ('auth_token')
3. **Database Permissions**: Check file permissions for the SQLite database
4. **API Connection Issues**: Verify the VITE_API_URL is correctly set in frontend environment

### Monitoring

Consider setting up monitoring for:
- Server health
- API response times
- Error rates
- Database performance

## Maintenance

- Regularly update dependencies
- Back up the database
- Monitor server logs for errors
- Keep JWT secrets secure and rotate periodically
