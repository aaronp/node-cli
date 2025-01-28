const { Select } = require('enquirer')
import { onConfigure } from './configure'

async function main() {
  try {
    // Create a prompt using enquirer
    const prompt = new Select({
      name: 'mainMenu',
      message: 'What would you like to do?',
      choices: [
        { name: 'configure', message: 'Configure the app' },
        { name: 'addUser', message: 'Add a new user' },
        { name: 'trade', message: 'Trade' },
      ],
    });

    // Await user selection
    const choice = await prompt.run();

    // Handle user choice
    switch (choice) {
      case 'configure':
        await onConfigure();
        break;
      case 'addUser':
        console.log('Add User functionality is not yet implemented.');
        break;
      case 'trade':
        console.log('Trade functionality is not yet implemented.');
        break;
      default:
        console.log('Invalid option selected.');
        break;
    }
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

// Invoke the main function
main();
