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

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, loadingAnswer]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await fetchChatSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) selectSession(data[0].id);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMobileDrawerOpen(false);
    try {
      const full = await fetchChatSession(sessionId);
      setMessages(full.messages || []);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const s = await createChatSession('New Chat');
      setSessions((prev) => [s, ...prev]);
      setActiveSessionId(s.id);
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
        if (remaining.length > 0) selectSession(remaining[0].id);
        else { setActiveSessionId(null); setMessages([]); }
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

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setLoadingAnswer(true);

    try {
      const res = await sendChatMessage(question, 5, activeSessionId || undefined);
      if (!activeSessionId) {
        setActiveSessionId(res.session_id);
        await loadSessions();
      }
      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        grounded: res.grounded,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err.message || 'Unable to generate response'}`,
          sources: [],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const toggleSourceExpand = (msgId: string, idx: number) => {
    const key = `${msgId}-${idx}`;
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeSessionTitle = sessions.find((s) => s.id === activeSessionId)?.title || 'New Chat';

  // shared style helpers
  const sidebarBg = isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]';
  const textMain = isLight ? 'text-ink' : 'text-dark-ink';
  const textMuted = isLight ? 'text-muted' : 'text-dark-muted';
  const dividerBorder = isLight ? 'border-hairline' : 'border-[#38383E]';
  const inputBg = isLight
    ? 'bg-surface border-hairline text-ink placeholder:text-muted focus:border-[#A1A1A1] focus:ring-1 focus:ring-[#A1A1A1]'
    : 'bg-dark-surface border-[#38383E] text-dark-ink placeholder:text-dark-muted focus:border-[#6B6B70] focus:ring-1 focus:ring-[#6B6B70]';

  const activeSessCls = isLight
    ? 'bg-ink text-white'
    : 'bg-dark-ink text-dark-surface';
  const inactiveSessCls = isLight
    ? 'text-muted hover:bg-surface-raised hover:text-ink'
    : 'text-dark-muted hover:bg-dark-surface hover:text-dark-ink';

  return (
    <div className="w-full max-w-[1080px] mx-auto px-3 sm:px-6 py-4 sm:py-6 h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8.5rem)] flex gap-4 sm:gap-5 relative">

      {/* Desktop Sidebar */}
      <aside className={`w-64 border rounded-xl flex-col overflow-hidden shrink-0 shadow-ambient hidden md:flex transition-colors ${sidebarBg}`}>
        {/* Sidebar header */}
        <div className={`p-4 border-b flex items-center justify-between ${dividerBorder}`}>
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className={textMuted} />
            <span className={`font-space-mono text-[11px] uppercase tracking-wider ${textMuted}`}>
              Conversations
            </span>
          </div>
          <button
            onClick={handleNewChat}
            className={`flex items-center gap-1 text-[13px] h-[32px] px-3 rounded-md transition ${
              isLight ? 'bg-ink text-white hover:opacity-85' : 'bg-dark-ink text-dark-surface hover:opacity-85'
            }`}
          >
            <Plus size={13} />
            New
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingSessions ? (
            <div className={`p-6 text-center text-[13px] ${textMuted}`}>Loading…</div>
          ) : sessions.length === 0 ? (
            <div className={`p-8 text-center ${textMuted}`}>
              <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-[13px]">No previous chats</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md text-[13px] cursor-pointer transition ${
                    isActive ? activeSessCls : inactiveSessCls
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare size={13} className="shrink-0 opacity-60" />
                    <span className="truncate">{sess.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className={`relative w-4/5 max-w-xs h-full border-r shadow-2xl flex flex-col z-10 ${
            isLight ? 'bg-white border-hairline text-ink' : 'bg-dark-raised border-[#38383E] text-dark-ink'
          }`}>
            <div className={`p-4 border-b ${dividerBorder} flex items-center justify-between`}>
              <span className="font-space-mono text-[11px] uppercase tracking-wider">Conversations</span>
              <button onClick={() => setMobileDrawerOpen(false)} className={textMuted}>
                <X size={18} />
              </button>
            </div>
            <div className={`p-3 border-b ${dividerBorder}`}>
              <button
                onClick={handleNewChat}
                className={`w-full flex items-center justify-center gap-1.5 h-[40px] rounded-md text-[13px] transition ${
                  isLight ? 'bg-ink text-white hover:opacity-85' : 'bg-dark-ink text-dark-surface hover:opacity-85'
                }`}
              >
                <Plus size={13} /> New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-[13px] cursor-pointer transition ${
                      isActive ? activeSessCls : inactiveSessCls
                    }`}
                  >
                    <span className="truncate pr-2">{sess.title}</span>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className={`p-1 hover:text-red-500 ${textMuted}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className={`flex-1 border rounded-xl flex flex-col overflow-hidden shadow-ambient transition-colors ${
        isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]'
      }`}>
        {/* Chat Header */}
        <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-2 ${dividerBorder} ${
          isLight ? 'bg-white' : 'bg-dark-raised'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className={`md:hidden p-1.5 rounded-md border ${isLight ? 'border-hairline text-muted' : 'border-[#38383E] text-dark-muted'} shrink-0`}
            >
              <PanelLeft size={15} />
            </button>
            <div className={`p-1.5 rounded-md border shrink-0 ${isLight ? 'bg-surface-raised border-hairline' : 'bg-dark-surface border-[#38383E]'}`}>
              <Brain size={14} className={textMuted} />
            </div>
            <h2 className={`text-[14px] truncate ${textMain}`}>{activeSessionTitle}</h2>
          </div>
          <div className={`flex items-center gap-1 text-[11px] shrink-0 ${textMuted}`}>
            <ShieldCheck size={12} />
            <span className="hidden sm:inline font-space-mono">Grounded</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 ${isLight ? 'bg-surface' : 'bg-dark-surface'}`}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <div className={`p-4 rounded-xl border mb-4 ${isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]'}`}>
                <Brain size={32} className={textMuted} />
              </div>
              <h3 className={`font-fraunces text-[22px] mb-1 ${textMain}`}>Ask Grounded Questions</h3>
              <p className={`text-[13px] max-w-md mb-6 ${textMuted}`}>
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
                    onClick={() => { setInputQuestion(item.text); textareaRef.current?.focus(); }}
                    className={`p-3 rounded-md text-left text-[13px] transition flex items-start gap-2 border ${
                      isLight
                        ? 'bg-white border-hairline hover:border-[#A1A1A1] text-muted hover:text-ink'
                        : 'bg-dark-raised border-[#38383E] hover:border-[#6B6B70] text-dark-muted hover:text-dark-ink'
                    }`}
                  >
                    <item.icon size={13} className="shrink-0 mt-0.5 opacity-60" />
                    <span>"{item.text}"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]'
                  }`}>
                    <Brain size={13} className={textMuted} />
                  </div>
                )}
                <div className={`max-w-[88%] sm:max-w-[80%] rounded-xl p-3.5 text-[14px] leading-relaxed ${
                  msg.role === 'user'
                    ? isLight
                      ? 'bg-ink text-white rounded-tr-sm'
                      : 'bg-dark-ink text-dark-surface rounded-tr-sm'
                    : isLight
                    ? 'bg-white border border-hairline text-ink rounded-tl-sm shadow-ambient'
                    : 'bg-dark-raised border border-[#38383E] text-dark-ink rounded-tl-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Sources */}
                  {msg.role === 'assistant' && (
                    <div className={`mt-3 pt-2.5 border-t ${dividerBorder}`}>
                      {msg.sources && msg.sources.length > 0 ? (
                        <div>
                          <div className={`flex items-center gap-1.5 font-space-mono text-[11px] mb-2 ${textMuted}`}>
                            <BookOpen size={11} />
                            <span>Verified Citations ({msg.sources.length})</span>
                          </div>
                          <div className="space-y-1.5">
                            {msg.sources.map((source, idx) => {
                              const isExpanded = expandedSources[`${msg.id}-${idx}`];
                              return (
                                <div key={idx} className={`rounded-md p-2 text-[12px] border ${
                                  isLight ? 'bg-surface border-hairline' : 'bg-dark-surface border-[#38383E]'
                                }`}>
                                  <div
                                    onClick={() => toggleSourceExpand(msg.id, idx)}
                                    className={`flex items-center justify-between cursor-pointer transition ${
                                      isLight ? 'text-ink hover:text-[#3563AD]' : 'text-dark-ink hover:text-[#86A8E6]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileText size={11} className="shrink-0 opacity-60" />
                                      <span className="truncate">{source.filename}</span>
                                      {source.page && (
                                        <span className={`px-1.5 py-0.5 rounded-xs font-space-mono text-[10px] ${
                                          isLight ? 'bg-surface-raised text-muted' : 'bg-dark-surface text-dark-muted'
                                        }`}>
                                          p.{source.page}
                                        </span>
                                      )}
                                    </div>
                                    <div className={textMuted}>
                                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </div>
                                  </div>
                                  {isExpanded && source.preview && (
                                    <div className={`mt-1.5 pt-1.5 border-t font-fraunces italic text-[12px] p-1.5 rounded-sm ${
                                      isLight ? 'border-hairline text-muted bg-white' : 'border-[#38383E] text-dark-muted bg-dark-raised'
                                    }`}>
                                      "{source.preview}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : msg.grounded === false ? (
                        <div className="flex items-center gap-1 text-[12px] text-amber-500">
                          <AlertCircle size={11} />
                          <span>No matching sources found in your documents.</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-surface-raised border-hairline text-ink' : 'bg-dark-surface border-[#38383E] text-dark-muted'
                  }`}>
                    <UserIcon size={13} />
                  </div>
                )}
              </div>
            ))
          )}

          {loadingAnswer && (
            <div className="flex gap-3 justify-start">
              <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]'
              }`}>
                <Brain size={13} className={`animate-pulse ${textMuted}`} />
              </div>
              <div className={`rounded-xl rounded-tl-sm p-3.5 text-[14px] flex items-center gap-2 border ${
                isLight ? 'bg-white border-hairline text-muted' : 'bg-dark-raised border-[#38383E] text-dark-muted'
              }`}>
                <div className="flex space-x-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isLight ? 'bg-ink' : 'bg-dark-ink'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isLight ? 'bg-ink' : 'bg-dark-ink'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLight ? 'bg-ink' : 'bg-dark-ink'}`}></div>
                </div>
                <span>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-3 sm:p-4 border-t ${dividerBorder} ${isLight ? 'bg-white' : 'bg-dark-raised'}`}>
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
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
              placeholder="Ask a question about your documents…"
              className={`flex-1 rounded-md px-4 py-2.5 text-[14px] focus:outline-none transition resize-none max-h-28 border ${inputBg}`}
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loadingAnswer}
              className={`h-[42px] px-4 rounded-md flex items-center justify-center transition shrink-0 disabled:opacity-40 ${
                isLight ? 'bg-ink text-white hover:opacity-85' : 'bg-dark-ink text-dark-surface hover:opacity-85'
              }`}
            >
              <Send size={14} />
            </button>
          </form>
          <div className={`flex items-center justify-between font-space-mono text-[10px] mt-1.5 px-1 ${textMuted}`}>
            <span className="flex items-center gap-1">
              <ShieldCheck size={10} /> Strict document verification
            </span>
            <span className="hidden sm:inline">Shift + Enter for new line</span>
          </div>
        </div>
      </main>
    </div>
  );
};
