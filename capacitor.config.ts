import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vestauth.hoxe',
  appName: 'HOXE',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#F5F5F3",
    },
  },
};

export default config;
