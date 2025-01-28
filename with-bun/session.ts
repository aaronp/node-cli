import fs from 'fs'
import path from 'path'

const sessionFilePath = path.resolve(__dirname, 'session.json');


// Utility function to read the session file
function readSessionFile(): Record<string, any> {
  try {
    if (fs.existsSync(sessionFilePath)) {
      const data = fs.readFileSync(sessionFilePath, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error reading session file:', error);
    return {};
  }
}

// Utility function to write to the session file
function writeSessionFile(data: Record<string, any>): void {
  try {
    fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to session file:', error);
  }
}

// Get a value by key
export function get(key: string): any | null {
  const sessionData = readSessionFile();
  return sessionData[key] ?? null;
}

// Check if a key exists
export function has(key: string): boolean {
  const sessionData = readSessionFile();
  return Object.prototype.hasOwnProperty.call(sessionData, key);
}

// Set a key-value pair and persist to the session file
export function set(key: string, value: any): void {
  const sessionData = readSessionFile();
  sessionData[key] = value;
  writeSessionFile(sessionData);
}
