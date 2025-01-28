import { prompt } from 'enquirer';
import { get } from './configure'
import axios from 'axios'


export const onAddUser = async () => {
    console.log('on add user')
    const ownera = await search('scala vs kotlin')
    console.log(JSON.stringify(ownera.data))
}


const search = async (text: string): Promise<any> => {
  try {
    // const baseUrl = get('url')
    const response = await axios.get(`https://www.google.com/search?q=${text}`)

    return response
  } catch (error) {
    console.error('Error performing search:', error)
    throw error
  }
}

export default search
