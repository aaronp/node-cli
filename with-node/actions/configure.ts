import { prompt } from 'enquirer'
import fs from 'fs'

import path from 'path'

const configFile = 'config.json'

export const get = (key : string): any | null => {
  const configuration = config()
  if (!configuration || !configuration[key]) {
    throw new Error(`${key} is not defined in ${configFile}`)
  }
  return configuration[key]
}

export const config = (): Record<string, any> | null => {
  try {
    const configPath = path.resolve(__dirname, configFile)
    const rawData = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(rawData)
  } catch (error) {
    console.error('Error reading or parsing config.json', error)
    return null
  }
}

/**
 * prompt the user for the config
 */
export async function onConfigure() {
  console.log('Enter key-value pairs:')

  // Load existing config or create a new one
  let config: Record<string, any> = {}
  const configFilePath = `./${configFile}`
  if (fs.existsSync(configFilePath)) {
    try {
      const data = fs.readFileSync(configFilePath, 'utf-8');
      config = JSON.parse(data);
    } catch (err) {
      console.error('Error reading config file - using an empty configuration.');
    }
  }

  while (true) {
    try {
      // Prompt for a key-value pair
      const { key } = await prompt<{ key: string }>({
        type: 'input',
        name: 'key',
        message: 'Enter a key (or leave blank to quit):',
      });

      if (!key) break; // Exit if key is blank

      const existingValue = config[key] || '';

      console.log(`cebg: existingValue='${existingValue}'`)

      let defaultPrompt = existingValue ? `(${existingValue})` : '';

      const { value } = await prompt<{ value: string }>({
        type: 'input',
        name: 'value',
        message: `Enter a value for "${key}" ${defaultPrompt}:`,
      });

      // Update the configuration object
      const newValue = (existingValue && !value) ? existingValue : value
      console.log(`!value=${!value}, newValue=${newValue}, existingValue='${existingValue}'`)
      config[key] = newValue
    } catch (err) {
      console.error('An error occurred while prompting:', err)
    }
  }

  // Save updated config to file
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    console.log(`Configuration saved to ${configFilePath}`);
  } catch (err) {
    console.error('Failed to save configuration:', err);
  }
}
