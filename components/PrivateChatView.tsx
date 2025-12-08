
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Send, MoreHorizontal, Loader2 } from 'lucide-react';
import { Language, User, PrivateChatSummary, PrivateMessage } from '../types';
import { listenToPrivateMessages, sendPrivateMessage, markChatAsRead } from '../services/firebaseService';
import { STORE_ITEMS } from '../constants';

interface PrivateChatViewProps {
  language: Language;
  onBack: () => void;
  currentUser: User;
  chatSummary: PrivateChatSummary;
}

const PrivateChatView: React.FC<PrivateChatViewProps> = ({ language, onBack, currentUser, chatSummary }) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      // Mark as read when opening
      if (currentUser.uid) {
          markChatAsRead(currentUser.uid, chatSummary.otherUserUid);
      }

      setLoading(true);
      const unsub = listenToPrivateMessages(chatSummary.chatId, (msgs) => {
          setMessages(msgs);
          setLoading(false);
          // Scroll on new message
          setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      });
      return () => unsub();
  }, [chatSummary.chatId, currentUser.uid]);

  const handleSend = async () => {
      if (!inputText.trim() || !currentUser.uid || sending) return;
      
      setSending(true);
      const text = inputText;
      setInputText(''); // Optimistic clear

      try {
          const sender = {
              uid: currentUser.uid,
              name: currentUser.name,
              avatar: currentUser.avatar,
              frameId: currentUser.equippedFrame,
              bubbleId: currentUser.equippedBubble
          };
          
          const receiver = {
              uid: chatSummary.otherUserUid,
              name: chatSummary.otherUserName,
              avatar: chatSummary.otherUserAvatar
          };

          await sendPrivateMessage(sender, receiver, text);
          // Auto scroll will happen via listener update
      } catch (e) {
          console.error("Send failed", e);
          setInputText(text); // Revert on fail
          alert("Failed to send message");
      }
      setSending(false);
  };

  const getBubbleClass = (id?: string) => {
      if (!id) return 'bg-gray-800 text-white rounded-bl-none'; // Default Other
      const item = STORE_ITEMS.find(i => i.id === id);
      return item ? `${item.previewClass} rounded-bl-none` : 'bg-gray-800 text-white rounded-bl-none';
  };

  const getMyBubbleClass = (id?: string) => {
      if (!id) return 'bg-brand-600 text-white rounded-br-none'; // Default Me
      const item = STORE_ITEMS.find(i => i.id === id);
      return item ? `${item.previewClass} rounded-br-none` : 'bg-brand-600 text-white rounded-br-none';
  };

  // Optimization: Memoize message list to avoid unnecessary re-calc
  const renderedMessages = useMemo(() => {
      return messages.map(msg => {
          const isMe = msg.senderId === currentUser.uid;
          const bubbleStyle = isMe 
              ? getMyBubbleClass(msg.bubbleId) 
              : getBubbleClass(msg.bubbleId);

          return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${bubbleStyle}`}>
                      {msg.text}
                      <div className="text-[9px] text-white/50 text-right mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                  </div>
              </div>
          );
      });
  }, [messages, currentUser.uid]);

  return (
    <div className="h-full bg-black flex flex-col font-sans">
        {/* Header */}
        <div className="p-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800">
                    <ArrowLeft className="w-5 h-5 text-white rtl:rotate-180" />
                </button>
                <div className="flex items-center gap-2">
                    <img src={chatSummary.otherUserAvatar} className="w-9 h-9 rounded-full object-cover border border-gray-600" />
                    <h3 className="text-white font-bold">{chatSummary.otherUserName}</h3>
                </div>
            </div>
            <button className="p-2 hover:bg-gray-800 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-400"/></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
            {loading ? (
                <div className="flex justify-center items-center h-full text-gray-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin"/> Loading...
                </div>
            ) : (
                renderedMessages
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:border-brand-500 outline-none disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={!inputText.trim() || sending} className="p-2.5 bg-brand-600 rounded-full text-white hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {sending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5 rtl:rotate-180" />}
            </button>
        </div>
    </div>
  );
};

export default PrivateChatView;
