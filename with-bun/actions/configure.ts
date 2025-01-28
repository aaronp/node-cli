import { intro, text, confirm, outro, note, isCancel } from '@clack/prompts';
import fs from 'fs';
import path from 'path';

const configFile = 'config.json';

export const get = (key: string): any | null => {
  const configuration = config();
  if (!configuration || !configuration[key]) {
    throw new Error(`${key} is not defined in ${configFile}`);
  }
  return configuration[key];
};

export const config = (): Record<string, any> | null => {
  try {
    const configPath = path.resolve(__dirname, configFile);
    const rawData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading or parsing config.json', error);
    return null;
  }
};

/**
 * Prompt the user for the configuration
 */
export async function onConfigure() {
  intro('Configure your application');
  console.log('Enter key-value pairs:');

  // Load existing config or create a new one
  let config: Record<string, any> = {};
  const configFilePath = path.resolve(__dirname, configFile);

  if (fs.existsSync(configFilePath)) {
    try {
      const data = fs.readFileSync(configFilePath, 'utf-8');
      config = JSON.parse(data);
    } catch (err) {
      console.error('Error reading config file - using an empty configuration.');
    }
  }

  while (true) {
    const key = await text({
      message: 'Enter a key (or leave blank to quit):',
      placeholder: 'e.g., apiKey',
    });

    if (isCancel(key) || !key) break;

    const existingValue = config[key] || '';
    const value = await text({
      message: `Enter a value for "${key}" ${existingValue ? `(current: ${existingValue})` : ''}:`,
      placeholder: 'e.g., 123456',
      defaultValue: existingValue,
    });

    if (isCancel(value)) {
      note('Configuration canceled. Exiting...', 'info');
      break;
    }

    // Update the configuration object
    config[key] = value || existingValue;
  }

  // Save updated config to file
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    outro(`Configuration saved to ${configFilePath}`);
  } catch (err) {
    console.error('Failed to save configuration:', err);
  }
}
