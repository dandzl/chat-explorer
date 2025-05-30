'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ChatMessage, ReviewerNote } from '../types/chat'
import { parseCSV } from '../utils/csv-parser'
import { SkipBack, SkipForward, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { FocusedLabelCategory } from './focused-label-category'
import Papa from 'papaparse'

// Import the website image mapping and message categories
import websiteImageMapping from '../utils/website_image_mapping.json'
import advertiserMessageCategories from '../utils/advertiser_message_categories.json'
import botMessageEvalDimensions from '../utils/bot_message_eval_dimensions.json'

export default function ChatReview() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [notes, setNotes] = useState<ReviewerNote[]>([])
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [currentConversation, setCurrentConversation] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [labelSelections, setLabelSelections] = useState<Record<string, string[] | number | string>>({});
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setErrorMessage(null);
        const parsedMessages = await parseCSV(file)
        console.log('Parsed messages:', parsedMessages);
        const uniqueConversationIds = [...new Set(parsedMessages.map(msg => msg.conversationID))];
        setConversationIds(uniqueConversationIds);
        setCurrentConversation(parsedMessages.filter(msg => msg.conversationID === uniqueConversationIds[0]));
        setMessages(parsedMessages)
        setCurrentIndex(0)
        setCurrentConversationIndex(0);
      } catch (error) {
        console.error('Error parsing CSV:', error)
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred while parsing the CSV file');
      }
    }
  }

  const handleExportNotes = () => {
    const csvData = messages.map(message => {
      return {
        ...message,
        ...message.labelCategories
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'chat-review-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const currentMessage = currentConversation[currentIndex];

  useEffect(() => {
    console.log('Current message:', currentMessage);
    if (currentMessage) {
      setFocusedCategoryIndex(0);
      setLabelSelections(currentMessage.labelCategories || {});
    }
  }, [currentMessage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentIndex]);

  const getScreenshotUrl = (website_image: string) => {
    const imageName = websiteImageMapping[website_image as keyof typeof websiteImageMapping];
    if (!imageName) {
      console.warn(`No mapping found for website_image: ${website_image}`);
      return 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder_page-xDToGG9tzzXjFixe9bGJsQOIl2Gvrw.png';
    }
    return imageName;
  }

  const handleScrubChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value, 10);
    setCurrentIndex(newIndex);
  };

  const goToPreviousMessage = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const goToNextMessage = () => {
    setCurrentIndex(Math.min(currentConversation.length - 1, currentIndex + 1));
  };

  const goToPreviousConversation = () => {
    if (currentConversationIndex > 0) {
      setCurrentConversationIndex(currentConversationIndex - 1);
      setCurrentConversation(messages.filter(msg => msg.conversationID === conversationIds[currentConversationIndex -1]));
      setCurrentIndex(0);
    }
  };

  const goToNextConversation = () => {
    if (currentConversationIndex < conversationIds.length - 1) {
      setCurrentConversationIndex(currentConversationIndex + 1);
      setCurrentConversation(messages.filter(msg => msg.conversationID === conversationIds[currentConversationIndex + 1]));
      setCurrentIndex(0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab' && !event.repeat) {
        event.preventDefault();
        if (event.shiftKey && currentIndex > 0) {
          goToPreviousMessage();
        } else if (!event.shiftKey && currentIndex < currentConversation.length - 1) {
          goToNextMessage();
        }
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousConversation();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        goToNextConversation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, currentConversation.length, goToPreviousMessage, goToNextMessage, goToPreviousConversation, goToNextConversation]);


  const handleCategorySelectionConfirmed = (category: string, selection: string[] | number | string) => {
    setLabelSelections(prevSelections => {
      const newSelections = {
        ...prevSelections,
        [category]: selection === 'D/K' ? 'D/K' : selection
      };
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.conversationID === currentMessage.conversationID && msg.messageTime === currentMessage.messageTime
            ? {
                ...msg,
                labelCategories: {
                  ...msg.labelCategories,
                  [category]: selection === 'D/K' ? 'D/K' : selection
                }
              }
            : msg
        )
      );

      return newSelections;
    });
    
    const categories = currentMessage.sender === 'advertiser' 
      ? Object.keys(advertiserMessageCategories.label_categories)
      : Object.keys(botMessageEvalDimensions.label_categories);
    
    const nextIndex = focusedCategoryIndex + 1;
    
    if (nextIndex < categories.length) {
      setFocusedCategoryIndex(nextIndex);
    } else {
      // Move to the next message or conversation
      moveToNextMessageOrConversation();
    }
  };

  const moveToNextMessageOrConversation = () => {
    if (currentIndex < currentConversation.length - 1) {
      // Move to the next message in the current conversation
      setCurrentIndex(currentIndex + 1);
      setFocusedCategoryIndex(0);
    } else if (currentConversationIndex < conversationIds.length - 1) {
      // Move to the first message of the next conversation
      setCurrentConversationIndex(currentConversationIndex + 1);
      setCurrentConversation(messages.filter(msg => msg.conversationID === conversationIds[currentConversationIndex + 1]));
      setCurrentIndex(0);
      setFocusedCategoryIndex(0);
    }
    // If it's the last message of the last conversation, do nothing
  };

  const handleMoveToPreviousCategory = () => {
    setFocusedCategoryIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-[2fr_1fr] gap-4 p-4">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        {/* Screenshot Panel with Chat Overlay */}
        <div className="border rounded-lg p-4 relative">
          {currentMessage?.website_image ? (
            <div className="relative">
              <img
                src={getScreenshotUrl(currentMessage.website_image) || "/placeholder.svg"}
                alt={`${currentMessage.website_image} screenshot`}
                className="w-full h-auto"
              />
              {!websiteImageMapping[currentMessage.website_image as keyof typeof websiteImageMapping] && (
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-black/75 text-white px-4 py-2 rounded text-center">
                  image not found for page: {currentMessage.website_image}
                </div>
              )}
            </div>
          ) : (
            <p>Upload a CSV of chat records to start the replay</p>
          )}

          {/* Chat Panel Overlay */}
          <div className="absolute top-[64px] right-0 bottom-0 w-1/2 max-w-[390px] overflow-y-auto bg-white/90 border-l rounded-r-lg p-4 shadow-lg text-sm" ref={chatContainerRef}>
            <h2 className="text-lg font-semibold mb-4">Ads Copilot Replay</h2>
            <div className="space-y-4">
              {currentConversation.slice(0, currentIndex + 1).map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'visitor' || message.sender === 'advertiser' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] p-3 rounded-lg ${
                      message.sender === 'advertiser'
                        ? 'bg-[#11968F] text-white'
                        : message.sender === 'visitor'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <span className="text-[9px] opacity-70 block mb-1">{message.messageTime}</span>
                    <div className="text-sm">
                      {(String(message.messageText || "")).split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Panel */}
        <div className="border rounded-lg p-4 overflow-y-auto notes-panel">
          <h2 className="text-lg font-semibold mb-3">Reviewer's Notes</h2>
          {currentMessage && (currentMessage.sender === 'advertiser' || currentMessage.sender === 'bot') ? (
            <div className="space-y-[-20px]">
              {Object.entries(currentMessage.sender === 'advertiser' ? advertiserMessageCategories.label_categories : botMessageEvalDimensions.label_categories).map(([category, config], index) => (
                <FocusedLabelCategory
                  key={category}
                  category={category}
                  options={config['option-set']}
                  selectionType={config['selection-type']}
                  maxSelection={config.max_selection}
                  minSelection={config.min_selection}
                  allowNA={config['allow-NA']}
                  allowDontKnow={config['allow-dont-know']}
                  onSelectionConfirmed={handleCategorySelectionConfirmed}
                  onMoveToPrevious={handleMoveToPreviousCategory}
                  isFocused={index === focusedCategoryIndex}
                  value={labelSelections[category]}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No labels available for this message type.</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t p-4">
        <div className="flex items-center w-full">
          <div className="flex items-center gap-4 flex-grow flex-wrap pr-8">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goToPreviousMessage}
                  disabled={currentIndex === 0}
                  className="w-10 h-10 p-0 flex items-center justify-center relative group"
                >
                  <SkipBack className="h-4 w-4" />
                  <span className="sr-only">Previous Message (Shift + Tab)</span>
                  <span className="absolute bottom-0 right-0 text-[8px] bg-gray-200 rounded-tl px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">⇧+Tab</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={goToNextMessage}
                  disabled={currentIndex === currentConversation.length - 1}
                  className="w-10 h-10 p-0 flex items-center justify-center relative group"
                >
                  <SkipForward className="h-4 w-4" />
                  <span className="sr-only">Next Message (Tab)</span>
                  <span className="absolute bottom-0 right-0 text-[8px] bg-gray-200 rounded-tl px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Tab</span>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goToPreviousConversation}
                  disabled={currentConversationIndex === 0}
                  className="w-10 h-5 p-0 flex items-center justify-center"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  onClick={goToNextConversation}
                  disabled={currentConversationIndex === conversationIds.length - 1}
                  className="w-10 h-5 p-0 flex items-center justify-center"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Scrubbable Playback Control */}
            <div className="flex items-center gap-2 flex-grow pr-4">
              <input
                type="range"
                min="0"
                max={currentConversation.length - 1}
                value={currentIndex}
                onChange={handleScrubChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 min-w-[4rem] text-right">
                {currentIndex + 1} / {currentConversation.length}
              </span>
            </div>
            <div className="flex flex-col items-end text-sm text-gray-500 ml-4">
              <span>Conversation ID: {currentConversation[0]?.conversationID || 'N/A'}</span>
              <span>Advertiser ID: {currentConversation[0]?.advertiserID || 'N/A'}</span>
              <span>Account Segment: {currentConversation[0]?.accountSegment || 'N/A'}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportNotes}
              disabled={messages.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      <style jsx global>{`
  .notes-panel {
    font-size: 75%; /* Reduce font size by 25% */
  }
  .notes-panel > * {
    margin-bottom: 0.75rem; /* Reduce vertical spacing by 25% */
  }
  .notes-panel h2 {
    font-size: 1.125rem; /* Adjust the heading size */
    margin-bottom: 0.75rem;
  }
`}</style>
    </div>
  )
}

