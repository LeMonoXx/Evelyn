import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.monoxnet.evelyn',
  appName: 'Evelyn',
  webDir: 'dist/evelyn',
  server: {
    androidScheme: 'https'
  }
};

export default config;
