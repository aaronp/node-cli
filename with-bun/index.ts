import { intro, select, isCancel, outro } from '@clack/prompts'
import { onConfigure } from './actions/configure'
import { onAddUser } from './actions/addUser'
import { onTrade } from './actions/trade'

async function main() {
  intro('Welcome to the CLI!')

  let exit = false;
  while (!exit) {
    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'config', label: 'Configuration', hint: 'save session files' },
        { value: 'addUser', label: 'Add User', hint: 'Add/remove users' },
        { value: 'trade', label: 'Trade', hint: 'Trade assets' },
        { value: 'quit', label: 'Quit' }
      ]
    });

    if (isCancel(action)) {
      outro('Exiting...')
      process.exit(0);
    }

    switch (action) {
      case 'config':
        await onConfigure()
        break
      case 'addUser':
        await onAddUser()
        break
      case 'trade':
        await onTrade()
        break
      case 'quit':
        outro('Goodbye!')
        exit = true;
        break;
      default:
        console.log('Unknown action!')
    }
  }
}

main().catch((err) => {
  console.error('An error occurred:', err);
});
