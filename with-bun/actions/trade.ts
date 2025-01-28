import { intro, outro, text, note, isCancel } from '@clack/prompts';
import fs from 'fs';

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

  console.log(`Trading ${amount} of ${asset}...`);

  // Simulate saving or executing the trade
  try {
    fs.writeFileSync('./trade-log.txt', `Asset: ${asset}, Amount: ${amount}\n`, { flag: 'a' });
    outro(`Trade successfully logged: ${amount} of ${asset}`);
  } catch (error) {
    console.error('Error saving the trade:', error);
  }
}
