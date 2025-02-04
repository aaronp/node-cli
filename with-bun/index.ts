import { intro, select, isCancel, outro } from '@clack/prompts'
import { onConfigure } from './actions/configure'
import { onFillOutForm } from './actions/onFillOutForm';
async function main() {
  intro('Welcome to the CLI!')

  let exit = false;
  while (!exit) {
    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'config', label: 'Configuration', hint: 'save session files' },
        { value: 'form', label: 'Fill out form' },
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
      case 'form':
        await onFillOutForm()
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
