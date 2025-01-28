import { intro, outro, text, note, isCancel, spinner } from '@clack/prompts';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

export async function onTrade() {
  intro('Trade an Asset');

  // Prompt the user to specify the asset to trade
  const asset = await text({
    message: 'Enter the asset to trade:',
    placeholder: 'e.g., Bitcoin, Ethereum, Apple Stock',
  });

  if (isCancel(asset)) {
    note('Operation canceled.', 'info');
    return;
  }

  // Prompt the user for the trade amount
  const amount = await text({
    message: `Enter the trade amount for ${asset}:`,
    placeholder: 'e.g., 100, 0.5',
  });

  if (isCancel(amount)) {
    note('Operation canceled.', 'info');
    return;
  }

  // Show a spinner while the trade is being executed
  const progress = spinner();
  progress.start(`Executing trade: ${amount} of ${asset}...`);

  try {
    // Simulate trade execution delay
    await setTimeout(2000);

    // Simulate saving or executing the trade
    // fs.writeFileSync('./trade-log.txt', `Asset: ${asset}, Amount: ${amount}\n`, { flag: 'a' });
    progress.stop('Trade successfully logged!');
    outro(`Trade completed: ${amount} of ${asset}`);
  } catch (error) {
    progress.stop('Error occurred during the trade!');
    console.error('Error saving the trade:', error);
  }
}
