# Production Deployment Guide

This guide covers deploying the Claimly user frontend to production.

## Prerequisites

- Node.js 18+ installed
- Build tools (npm or yarn)
- Production hosting service (Vercel, Netlify, AWS S3, etc.)
- Environment variables configured

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_URL=https://api.claimly.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Important:** All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

## Security Checklist

- [ ] VITE_API_URL points to your production backend
- [ ] Firebase API key is configured correctly
- [ ] Firebase project has production domain authorized
- [ ] API key restrictions are configured in Google Cloud Console
- [ ] CORS is configured on the backend to allow your frontend domain

## Build for Production

### 1. Install Dependencies

```bash
npm ci
```

### 2. Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 3. Preview the Build (Optional)

```bash
npm run preview
```

## Deployment Options

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Deploy: `netlify deploy --prod`
3. Set environment variables in Netlify dashboard

### Static Hosting (AWS S3, Cloudflare Pages, etc.)

1. Build the application: `npm run build`
2. Upload the `dist/` directory contents to your hosting service
3. Configure your hosting service to:
   - Serve `index.html` for all routes (SPA routing)
   - Set proper cache headers
   - Enable HTTPS

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Production Features

### Error Boundaries
- Global error boundary catches React errors
- User-friendly error messages
- Error logging (can be extended to send to error tracking service)

### API Error Handling
- Automatic retry logic for network errors and 5xx responses
- Exponential backoff for retries
- Automatic redirect to login on 401 errors
- Request timeout of 30 seconds

### Build Optimizations
- Code splitting for better caching
- Minification and tree-shaking
- Console.log removal in production
- Optimized bundle sizes

### Environment Validation
- Environment variables are validated at startup
- Clear error messages for missing variables
- Prevents app from running with invalid configuration

## Performance Optimization

### Caching Strategy
- Static assets are cached with long expiration
- API responses should be cached appropriately
- Consider using a CDN for static assets

### Bundle Size
- Code splitting reduces initial load time
- Vendor chunks are separated for better caching
- Lazy loading for routes (can be added)

### Monitoring

### Recommended Tools
- Error tracking: Sentry, Rollbar, or similar
- Analytics: Google Analytics, Mixpanel, or similar
- Performance: Lighthouse, WebPageTest

### Key Metrics to Monitor
- Page load times
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Error rates
- API response times

## Troubleshooting

### Build Failures
1. Check Node.js version (18+ required)
2. Clear `node_modules` and reinstall: `rm -rf node_modules && npm ci`
3. Check for TypeScript errors: `npm run lint`

### Environment Variable Issues
1. Verify all variables start with `VITE_`
2. Restart dev server after changing `.env`
3. Check `.env` file is in the root directory
4. Verify no typos in variable names

### Firebase Issues
1. Verify API key is correct
2. Check Firebase project settings
3. Verify domain is authorized in Firebase Console
4. Check browser console for specific error messages

### API Connection Issues
1. Verify VITE_API_URL is correct
2. Check CORS configuration on backend
3. Verify backend is running and accessible
4. Check network tab in browser DevTools

## Updates and Maintenance

### Updating the Application
1. Pull latest code
2. Run `npm ci`
3. Update environment variables if needed
4. Run `npm run build`
5. Deploy the new build

### Environment Variable Changes
After changing environment variables:
1. Update `.env` file
2. Rebuild the application
3. Redeploy

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Use HTTPS** - Always serve the application over HTTPS
3. **Set proper headers** - Configure security headers on your hosting service
4. **API key restrictions** - Restrict Firebase API keys to your domain
5. **Content Security Policy** - Configure CSP headers

## Support

For issues or questions, refer to:
- README.md for general information
- FIREBASE_SETUP.md for Firebase configuration
- API_KEY_TROUBLESHOOTING.md for API key issues

