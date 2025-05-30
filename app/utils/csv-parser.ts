import { ChatMessage } from '../types/chat';
import Papa from 'papaparse';
import advertiserMessageCategories from './advertiser_message_categories.json';
import botMessageEvalDimensions from './bot_message_eval_dimensions.json';

export async function parseCSV(file: File): Promise<ChatMessage[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false, // Change this to false
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          reject(new Error('Error parsing CSV: ' + results.errors[0].message));
          return;
        }

        const messages: ChatMessage[] = results.data.map((row: any, index: number) => {
          if (!row.advertiser_id || !row.conversation_id || !row.account_segment || 
              !row.message_time || !row.website_image || !row.sender || !row.text) {
            throw new Error(`Row ${index + 2} is missing required fields`);
          }

          const labelCategories = {
            ...Object.keys(advertiserMessageCategories.label_categories).reduce((acc, category) => ({
              ...acc,
              [category]: ''
            }), {}),
            ...Object.keys(botMessageEvalDimensions.label_categories).reduce((acc, category) => ({
              ...acc,
              [category]: ''
            }), {})
          };

          return {
            advertiserID: String(row.advertiser_id),
            conversationID: String(row.conversation_id),
            accountSegment: String(row.account_segment),
            messageTime: String(row.message_time),
            website_image: String(row.website_image),
            sender: String(row.sender) as 'bot' | 'advertiser',
            messageText: String(row.text),
            labelCategories
          };
        });

        console.log('Parsed messages:', messages);
        resolve(messages);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      }
    });
  });
}

