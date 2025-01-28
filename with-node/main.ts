const { Select } = require('enquirer')
import { onConfigure } from './actions/configure'
import { onAddUser } from './actions/addUser'
import { onTrade } from './actions/trade'

async function main() {
  try {
    // Create a prompt using enquirer
    const prompt = () => new Select({
      name: 'mainMenu',
      message: 'What would you like to do?',
      choices: [
        { name: 'configure', message: 'Configure the app' },
        { name: 'addUser', message: 'Add a new user' },
        { name: 'trade', message: 'Trade' },
        { name: 'quit', message: 'Quit' },
      ],
    });

    // Await user selection
    var choice = await prompt().run();

    // Handle user choice
    while (choice !== 'quit') {
      switch (choice) {
        case 'configure':
          await onConfigure();
          break;
        case 'addUser':
          await onAddUser()
          break;
        case 'trade':
          await onTrade();
          break;
        default:
          console.log('Invalid option selected.');
          break;
      }

      console.log(`Prompting again...`);
      // Await user selection
      choice = await prompt().run();

      console.log(`choice is ${choice}`);
    }

    console.log(`quitting...`);
    // process.exit(0);
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

// Invoke the main function
main();
