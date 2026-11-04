import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  User as UserIcon,
  Sparkles,
  Search,
  FileQuestion,
  HelpCircle,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchChatSessions,
  createChatSession,
  fetchChatSession,
  deleteChatSession,
  sendChatMessage,
} from '../api';
import { ChatMessage, ChatSession } from '../types';

export const ChatInterface: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingAnswer]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await fetchChatSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        selectSession(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const fullSession = await fetchChatSession(sessionId);
      setMessages(fullSession.messages || []);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSess = await createChatSession('New Chat');
      setSessions((prev) => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const question = inputQuestion.trim();
    if (!question || loadingAnswer) return;

    setInputQuestion('');

    const tempUserMsgId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoadingAnswer(true);

    try {
      const res = await sendChatMessage(question, 5, activeSessionId || undefined);

      if (!activeSessionId) {
        setActiveSessionId(res.session_id);
        await loadSessions();
      }

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        grounded: res.grounded,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to generate response'}`,
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const toggleSourceExpand = (msgId: string, idx: number) => {
    const key = `${msgId}-${idx}`;
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeSessionTitle = sessions.find((s) => s.id === activeSessionId)?.title || 'New Chat';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4.5rem)] flex gap-6">
      {/* Sessions Sidebar */}
      <aside className="w-72 bg-[#19305C] border-2 border-[#413B61] rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-xl hidden md:flex">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#413B61] flex items-center justify-between bg-[#19305C]">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-[#F1916D]" />
            <span className="text-xs font-semibold text-[#F3DADF] uppercase tracking-wider">
              Conversations
            </span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 bg-[#F1916D] hover:bg-[#F1916D]/90 text-[#03122F] text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#19305C]">
          {loadingSessions ? (
            <div className="p-6 text-center text-xs text-[#AE7DAC] flex items-center justify-center gap-2">
              <Sparkles size={14} className="animate-spin text-[#F1916D]" />
              <span>Loading history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-[#AE7DAC]">
              <MessageSquare size={26} className="mx-auto text-[#413B61] mb-2" />
              <p className="text-xs">No previous chats</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-[#F1916D] text-[#03122F] font-bold shadow-sm'
                      : 'text-[#AE7DAC] hover:bg-[#413B61]/50 hover:text-[#F3DADF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare size={14} className={isActive ? 'text-[#03122F]' : 'text-[#AE7DAC]'} />
                    <span className="truncate">{sess.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#03122F]/70 hover:text-red-700 transition"
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 bg-[#03122F] border-2 border-[#413B61] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Chat Header Bar */}
        <div className="px-6 py-3.5 border-b border-[#413B61] flex items-center justify-between bg-[#19305C]">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-[#03122F] border border-[#413B61]">
              <Brain size={16} className="text-[#F1916D]" />
            </div>
            <h2 className="text-sm font-semibold text-white">{activeSessionTitle}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#AE7DAC]">
            <ShieldCheck size={14} className="text-[#F1916D]" />
            <span className="text-[11px]">Vault Grounded Citations</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#03122F]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 bg-[#19305C] border-2 border-[#413B61] text-[#F1916D] rounded-2xl mb-4 shadow-[0_0_30px_rgba(241,145,109,0.2)]">
                <Brain size={36} />
              </div>
              <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Sparkles size={16} className="text-[#F1916D]" />
                Ask Grounded Questions
              </h3>
              <p className="text-xs text-[#AE7DAC] max-w-md mb-6">
                All responses cite your verified document sources and page numbers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
                {[
                  { icon: FileSearch, text: 'Summarize the key points of my uploaded document.' },
                  { icon: HelpCircle, text: 'What are the main requirements and objectives?' },
                  { icon: Search, text: 'Extract key dates, figures, and important numbers.' },
                  { icon: FileQuestion, text: 'Identify all conclusions and recommendations.' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputQuestion(item.text);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 bg-[#19305C] border border-[#413B61] hover:border-[#F1916D] hover:bg-[#413B61]/40 rounded-xl text-left text-xs text-[#F3DADF] hover:text-white transition flex items-start gap-2.5 group"
                  >
                    <item.icon size={15} className="text-[#F1916D] shrink-0 mt-0.5 group-hover:scale-110 transition" />
                    <span>"{item.text}"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#19305C] border border-[#413B61] text-[#F1916D] flex items-center justify-center shrink-0 shadow-sm">
                    <Brain size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#F1916D] text-[#03122F] font-medium rounded-tr-sm shadow-md'
                      : 'bg-[#19305C] border border-[#413B61] text-[#F3DADF] rounded-tl-sm shadow-md'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Sources Tray (Assistant Only) */}
                  {msg.role === 'assistant' && (
                    <div className="mt-4 pt-3 border-t border-[#413B61]">
                      {msg.sources && msg.sources.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F1916D] mb-2">
                            <BookOpen size={13} />
                            <span>Verified Citations ({msg.sources.length})</span>
                          </div>

                          <div className="space-y-2">
                            {msg.sources.map((source, idx) => {
                              const isExpanded = expandedSources[`${msg.id}-${idx}`];
                              return (
                                <div
                                  key={idx}
                                  className="bg-[#03122F] border border-[#413B61] rounded-xl p-2.5 text-[11px]"
                                >
                                  <div
                                    onClick={() => toggleSourceExpand(msg.id, idx)}
                                    className="flex items-center justify-between cursor-pointer text-[#F3DADF] hover:text-[#F1916D] transition"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText size={13} className="text-[#F1916D] shrink-0" />
                                      <span className="font-medium truncate">{source.filename}</span>
                                      {source.page && (
                                        <span className="bg-[#413B61] text-[#F3DADF] px-1.5 py-0.5 rounded text-[10px]">
                                          Page {source.page}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[#AE7DAC]">
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                  </div>

                                  {isExpanded && source.preview && (
                                    <div className="mt-2 pt-2 border-t border-[#413B61] text-[#AE7DAC] italic font-serif text-[11px] bg-[#19305C]/60 p-2 rounded">
                                      "{source.preview}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : msg.grounded === false ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#F1916D]">
                          <AlertCircle size={13} />
                          <span>No matching sources found in your documents.</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#19305C] text-[#F3DADF] border border-[#413B61] flex items-center justify-center shrink-0">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))
          )}

          {loadingAnswer && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[#19305C] border border-[#413B61] text-[#F1916D] flex items-center justify-center shrink-0">
                <Brain size={16} className="animate-pulse" />
              </div>
              <div className="bg-[#19305C] border border-[#413B61] rounded-2xl rounded-tl-sm p-4 text-xs text-[#AE7DAC] flex items-center gap-2.5">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-[#F1916D] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#F1916D] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#F1916D] rounded-full animate-bounce"></div>
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#19305C] border-t border-[#413B61]">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question about your documents..."
              className="flex-1 bg-[#03122F] border border-[#413B61] rounded-xl px-4 py-3 text-xs text-[#F3DADF] placeholder-[#AE7DAC]/60 focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] transition resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loadingAnswer}
              className="h-10 px-4 bg-[#F1916D] hover:bg-[#F1916D]/90 disabled:opacity-40 disabled:hover:bg-[#F1916D] text-[#03122F] font-bold rounded-xl flex items-center justify-center transition shadow-md shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-[#AE7DAC] mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-[#F1916D]" /> Strict document verification
            </span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </main>
    </div>
  );
};
