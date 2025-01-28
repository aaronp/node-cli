import { intro, outro, text, note, isCancel, spinner } from '@clack/prompts';
import axios from 'axios';

export const onAddUser = async () => {
  intro('Add a new user');

  // Prompt the user to enter a search query
  const query = await text({
    message: 'Enter a search query:',
    placeholder: 'e.g., scala vs kotlin',
  });

  if (isCancel(query)) {
    note('Operation canceled.', 'info');
    return;
  }

  // Show a spinner while performing the search
  const progress = spinner();
  progress.start('Performing search...');

  try {
    const searchResults = await search(query as string);
    progress.stop('Search completed successfully!');

    console.log('Search Results:', JSON.stringify(searchResults.data, null, 2));
    outro('User added successfully!');
  } catch (error) {
    progress.stop('Error occurred during the search!');
    console.error('Error performing search:', error);
  }
};

const search = async (text: string): Promise<any> => {
  try {
    // Simulate search (e.g., fetching data from a configuration file or database)
    const response = await axios.get(`https://www.google.com/search?q=${text}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export default search;
