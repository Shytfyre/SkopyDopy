import { useState, useEffect, useCallback } from 'react';
import { getDB, Conversation, Message } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    const db = await getDB();
    const convs = await db.getAllFromIndex('conversations', 'updatedAt');
    setConversations(convs.reverse());
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const createConversation = useCallback(async (modelId: string, title: string = "New Chat") => {
    const db = await getDB();
    const newConv: Conversation = {
      id: uuidv4(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelUsed: modelId,
      messages: []
    };
    await db.put('conversations', newConv);
    await loadConversations();
    setActiveConversationId(newConv.id);
    return newConv;
  }, [loadConversations]);

  const addMessage = useCallback(async (id: string, role: Message['role'], content: string) => {
    const db = await getDB();
    const conv = await db.get('conversations', id);
    if (!conv) return;

    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now()
    };

    // Auto-generate title if it's the first user message
    let newTitle = conv.title;
    if (conv.messages.length === 0 && role === 'user') {
      newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

    const updatedConv = {
      ...conv,
      title: newTitle,
      messages: [...conv.messages, newMessage],
      updatedAt: Date.now()
    };

    await db.put('conversations', updatedConv);
    await loadConversations();
  }, [loadConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    const db = await getDB();
    await db.delete('conversations', id);
    if (activeConversationId === id) setActiveConversationId(null);
    await loadConversations();
  }, [activeConversationId, loadConversations]);

  return { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    activeConversation, 
    createConversation, 
    addMessage, 
    deleteConversation 
  };
}
