'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ChatContext } from '@/lib/study-chat';
const ChatState = createContext<{ context: ChatContext | null; attach: (value: ChatContext) => void; clear: () => void; openVersion: number } | null>(null);
export function ChatProvider({children}: {children: ReactNode}) {
  const [context,setContext] = useState<ChatContext | null>(null);
  const [openVersion,setOpenVersion] = useState(0);
  return <ChatState.Provider value={{context, attach(value) {setContext(value); setOpenVersion(n=>n+1);}, clear() {setContext(null);}, openVersion}}>{children}</ChatState.Provider>;
}
export function useStudyChat() { const state = useContext(ChatState); if (!state) throw Error('ChatProvider required'); return state; }
