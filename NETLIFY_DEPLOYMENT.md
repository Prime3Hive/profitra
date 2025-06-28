# Profitra Netlify Deployment Guide

This guide will walk you through deploying both the frontend and backend of your Profitra application to Netlify using Netlify Functions for the backend API.

## Prerequisites

- A Netlify account
- Git repository with your code (GitHub, GitLab, or Bitbucket)
- Node.js and npm installed locally

## Project Structure

Your project has been prepared for Netlify deployment with the following structure:

```
profitra/
├── frontend/           # React frontend
│   ├── dist/           # Built frontend files (created after build)
│   ├── src/            # Frontend source code
│   ├── .env.production # Production environment variables
│   └── ...
├── backend/            # Express backend
│   ├── server/         # Server code
│   └── ...
├── netlify/            # Netlify configuration
│   └── functions/      # Netlify serverless functions
│       └── api.js      # API function that adapts Express app
├── netlify.toml        # Netlify configuration file
└── package.json        # Root package.json with dependencies
```

## Step 1: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

## Step 2: Test Locally (Optional)

Before deploying, you can test your application locally:

```bash
# Build the frontend
cd frontend && npm run build

# Start the backend
cd ../backend && npm run start
```

## Step 3: Commit and Push Changes

Make sure all your changes are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

## Step 4: Deploy to Netlify

### Option 1: Deploy via Netlify UI

1. Log in to your Netlify account
2. Click "New site from Git"
3. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Configure build settings:
   - Base directory: Leave empty (root of the repository)
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
6. Click "Show advanced" and add the following environment variables:
   - `JWT_SECRET`: A secure random string for JWT authentication
   - `CLIENT_URL`: The URL of your Netlify site (you can update this after deployment)
7. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install netlify-cli -g
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize Netlify site:
   ```bash
   netlify init
   ```

4. Follow the prompts to create a new site or link to an existing one

5. Deploy your site:
   ```bash
   netlify deploy --prod
   ```

## Step 5: Configure Environment Variables

After deployment, go to your Netlify site dashboard:

1. Go to Site settings > Build & deploy > Environment
2. Add the following environment variables:
   - `JWT_SECRET`: A secure random string for JWT authentication
   - `CLIENT_URL`: The URL of your Netlify site (e.g., https://your-site-name.netlify.app)

## Step 6: Verify Deployment

1. Visit your deployed site at the URL provided by Netlify
2. Test the sign-in functionality
3. Test the admin panel and other features

## Troubleshooting

### API Connection Issues

If you encounter "Failed to fetch" errors:

1. Check that the Netlify Functions are properly deployed:
   - Go to Functions tab in your Netlify dashboard
   - Verify that the `api` function is listed and active

2. Check your API URL configuration:
   - In production, the API URL should be `/api` (relative path)
   - This is set in `frontend/.env.production`

3. Check CORS configuration:
   - The API function should allow requests from your Netlify domain
   - This is configured in `netlify/functions/api.js`

### Database Issues

SQLite database in Netlify Functions:

1. Netlify Functions have a read-only filesystem except for the `/tmp` directory
2. Update the database path in your code to use `/tmp/investpro.db`
3. Initialize the database on each cold start of the function

### Function Timeout Issues

If your functions time out:

1. Netlify Functions have a 10-second execution limit on the free plan
2. Consider optimizing database queries or upgrading to a paid plan

## Next Steps

1. Set up a custom domain for your Netlify site
2. Configure SSL for your custom domain
3. Set up continuous deployment from your Git repository

## Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Express.js on Netlify Functions](https://github.com/netlify/netlify-lambda/tree/master/examples/express)
