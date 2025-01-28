import { intro, outro, text, note, isCancel } from '@clack/prompts';
import { get } from './configure';
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

  console.log('Performing search...');
  const searchResults = await search(query as string);

  console.log('Search Results:', JSON.stringify(searchResults.data, null, 2));
  outro('User added successfully!');
};

const search = async (text: string): Promise<any> => {
  try {
    // Example: Fetch the base URL from the configuration file
    // const baseUrl = get('url');
    const response = await axios.get(`https://www.google.com/search?q=${text}`);

    return response;
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};

export default search;
