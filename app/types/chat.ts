export interface ChatMessage {
  advertiserID: string;
  conversationID: string;
  accountSegment: string;
  messageTime: string;
  website_image: 'campaign' | 'adgroup' | 'creative';
  sender: 'visitor' | 'bot' | 'advertiser';
  messageText: string;
  labelCategories: Record<string, string | number | string[]>;
}

export interface ReviewerNote {
  messageId: string;
  note: string;
  timestamp: string;
}

