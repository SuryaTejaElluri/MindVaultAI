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
  PanelLeft,
  X,
} from 'lucide-react';
import {
  fetchChatSessions,
  createChatSession,
  fetchChatSession,
  deleteChatSession,
  sendChatMessage,
} from '../api';
import { ChatMessage, ChatSession } from '../types';
import { useTheme } from '../context/ThemeContext';

export const ChatInterface: React.FC = () => {
  const { isLight } = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
    setMobileDrawerOpen(false);
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
      setMobileDrawerOpen(false);
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
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6 h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8.5rem)] flex gap-4 sm:gap-6 relative">
      {/* Sessions Sidebar for Desktop */}
      <aside
        className={`w-72 border rounded-2xl flex-col overflow-hidden shrink-0 shadow-lg hidden md:flex transition-colors ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#1E293B] border-slate-700'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-[#1E293B] border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Conversations
            </span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className={`flex-1 overflow-y-auto p-2 space-y-1 ${isLight ? 'bg-white' : 'bg-[#1E293B]'}`}>
          {loadingSessions ? (
            <div
              className={`p-6 text-center text-xs flex items-center justify-center gap-2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <Sparkles size={14} className="animate-spin text-indigo-400" />
              <span>Loading history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className={`p-8 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              <MessageSquare size={26} className="mx-auto mb-2 opacity-40" />
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
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare
                      size={14}
                      className={isActive ? 'text-white' : isLight ? 'text-slate-400' : 'text-slate-400'}
                    />
                    <span className="truncate">{sess.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
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

      {/* Mobile Slide-over Drawer for Conversations */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div
            className={`relative w-4/5 max-w-xs h-full border-r shadow-2xl flex flex-col z-10 transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1E293B] border-slate-700 text-slate-100'
            }`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                <MessageSquare size={15} className="text-indigo-500" />
                <span>Conversations</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold py-2 rounded-xl shadow-sm"
              >
                <Plus size={14} />
                <span>New Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate pr-2">{sess.title}</span>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="p-1 hover:text-red-400 text-slate-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main
        className={`flex-1 border rounded-2xl flex flex-col overflow-hidden shadow-xl transition-colors ${
          isLight
            ? 'bg-[#F8FAFC] border-slate-200'
            : 'bg-[#0F172A] border-slate-700'
        }`}
      >
        {/* Chat Header Bar */}
        <div
          className={`px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-2 ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#1E293B] border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 shrink-0"
              title="Open Conversations"
            >
              <PanelLeft size={16} />
            </button>
            <div
              className={`p-1 rounded-lg border shrink-0 ${
                isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <Brain size={15} />
            </div>
            <h2 className={`text-xs sm:text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {activeSessionTitle}
            </h2>
          </div>
          <div className={`flex items-center gap-1 text-[11px] shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <ShieldCheck size={13} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
            <span className="hidden xs:inline text-[11px]">Grounded Citations</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'}`}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <div
                className={`p-3 sm:p-4 rounded-2xl border mb-3 sm:mb-4 shadow-md ${
                  isLight
                    ? 'bg-white border-slate-200 text-indigo-600'
                    : 'bg-[#1E293B] border-slate-700 text-indigo-400'
                }`}
              >
                <Brain size={32} />
              </div>
              <h3
                className={`text-sm sm:text-base font-semibold mb-1 flex items-center gap-1.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Sparkles size={15} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                Ask Grounded Questions
              </h3>
              <p className={`text-[11px] sm:text-xs max-w-md mb-4 sm:mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                All responses cite your verified document sources and page numbers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
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
                    className={`p-2.5 sm:p-3 rounded-xl text-left text-[11px] sm:text-xs transition flex items-start gap-2 border group ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-slate-900 shadow-sm'
                        : 'bg-[#1E293B] border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white'
                    }`}
                  >
                    <item.icon size={14} className="text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                    <span>"{item.text}"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                      isLight
                        ? 'bg-white border-slate-200 text-indigo-600'
                        : 'bg-[#1E293B] border-slate-700 text-indigo-400'
                    }`}
                  >
                    <Brain size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-tr-sm shadow-md'
                      : isLight
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                      : 'bg-[#1E293B] border border-slate-700 text-slate-100 rounded-tl-sm shadow-md'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Sources Tray (Assistant Only) */}
                  {msg.role === 'assistant' && (
                    <div
                      className={`mt-3 pt-2.5 border-t ${
                        isLight ? 'border-slate-100' : 'border-slate-700'
                      }`}
                    >
                      {msg.sources && msg.sources.length > 0 ? (
                        <div>
                          <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold mb-1.5 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
                            <BookOpen size={12} />
                            <span>Verified Citations ({msg.sources.length})</span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.sources.map((source, idx) => {
                              const isExpanded = expandedSources[`${msg.id}-${idx}`];
                              return (
                                <div
                                  key={idx}
                                  className={`rounded-xl p-2 text-[10px] sm:text-[11px] border ${
                                    isLight
                                      ? 'bg-slate-50 border-slate-200'
                                      : 'bg-[#0F172A] border-slate-700'
                                  }`}
                                >
                                  <div
                                    onClick={() => toggleSourceExpand(msg.id, idx)}
                                    className={`flex items-center justify-between cursor-pointer transition ${
                                      isLight
                                        ? 'text-slate-700 hover:text-indigo-600'
                                        : 'text-slate-300 hover:text-indigo-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileText size={12} className="text-indigo-400 shrink-0" />
                                      <span className="font-medium truncate">{source.filename}</span>
                                      {source.page && (
                                        <span
                                          className={`px-1 py-0.2 rounded text-[9px] ${
                                            isLight
                                              ? 'bg-slate-200 text-slate-700'
                                              : 'bg-slate-800 text-slate-300'
                                          }`}
                                        >
                                          p.{source.page}
                                        </span>
                                      )}
                                    </div>
                                    <div className={isLight ? 'text-slate-400' : 'text-slate-500'}>
                                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </div>
                                  </div>

                                  {isExpanded && source.preview && (
                                    <div
                                      className={`mt-1.5 pt-1.5 border-t italic font-serif text-[10px] sm:text-[11px] p-1.5 rounded ${
                                        isLight
                                          ? 'border-slate-200 text-slate-600 bg-white'
                                          : 'border-slate-700 text-slate-400 bg-[#1E293B]'
                                      }`}
                                    >
                                      "{source.preview}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : msg.grounded === false ? (
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-500">
                          <AlertCircle size={12} />
                          <span>No matching sources found in your documents.</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                      isLight
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-[#1E293B] text-slate-200 border-slate-700'
                    }`}
                  >
                    <UserIcon size={14} />
                  </div>
                )}
              </div>
            ))
          )}

          {loadingAnswer && (
            <div className="flex gap-2 sm:gap-3.5 justify-start">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-white border-slate-200 text-indigo-600'
                    : 'bg-[#1E293B] border-slate-700 text-indigo-400'
                }`}
              >
                <Brain size={14} className="animate-pulse" />
              </div>
              <div
                className={`rounded-2xl rounded-tl-sm p-3 sm:p-4 text-xs flex items-center gap-2 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-600 shadow-sm'
                    : 'bg-[#1E293B] border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          className={`p-2.5 sm:p-4 border-t ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B] border-slate-700'
          }`}
        >
          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 items-end">
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
              className={`flex-1 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none max-h-28 sm:max-h-32 border ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0F172A] border-slate-700 text-slate-100 placeholder:text-slate-500'
              }`}
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loadingAnswer}
              className="h-9 sm:h-10 px-3.5 sm:px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center transition shadow-md shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
          <div
            className={`flex items-center justify-between text-[10px] mt-1.5 px-1 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} /> Strict document verification
            </span>
            <span className="hidden sm:inline">Shift + Enter for new line</span>
          </div>
        </div>
      </main>
    </div>
  );
};
