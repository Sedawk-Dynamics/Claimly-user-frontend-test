import { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Vite plugin to inject Firebase config into service worker during build
 * This ensures the service worker can initialize Firebase even when browser is closed
 */
export function injectServiceWorkerConfig(): Plugin {
  return {
    name: 'inject-service-worker-config',
    buildStart() {
      // This runs during build
    },
    writeBundle() {
      // This runs after all files are written
      const swPath = join(process.cwd(), 'dist', 'firebase-messaging-sw.js');
      const swSourcePath = join(process.cwd(), 'public', 'firebase-messaging-sw.js');
      
      try {
        // Check if service worker file exists
        let swContent: string;
        try {
          swContent = readFileSync(swPath, 'utf-8');
        } catch {
          // If not in dist, read from source
          swContent = readFileSync(swSourcePath, 'utf-8');
        }
        
        // Get Firebase config from environment variables
        const firebaseConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY || '',
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.VITE_FIREBASE_APP_ID || '',
        };
        
        // Only inject if we have valid config
        if (!firebaseConfig.apiKey) {
          console.warn('⚠️ Firebase config not available, service worker will use runtime config');
          return;
        }
        
        const configString = JSON.stringify(firebaseConfig, null, 2);
        
        // Inject config and initialize Firebase immediately
        let finalContent = swContent.replace(
          /let firebaseConfig = null;/,
          `// Firebase config injected at build time
let firebaseConfig = ${configString};`
        );
        
        // The service worker will automatically initialize Firebase if config is available
        // No need to add extra initialization code - it's already in the service worker
        
        // Write the modified service worker to dist
        writeFileSync(swPath, finalContent, 'utf-8');
        console.log('✅ Service worker config injected successfully');
      } catch (error) {
        console.warn('⚠️ Could not inject service worker config:', error);
        // Don't fail the build if this fails
      }
    },
  };
}

