import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sliders,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import {
  fetchChatSessions,
  createChatSession,
  fetchChatSession,
  deleteChatSession,
  sendChatMessage,
} from '../api';
import { ChatMessage, ChatSession, SourceCitation } from '../types';

export const ChatInterface: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [topK, setTopK] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
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

    // Append optimistic user message
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
      const res = await sendChatMessage(question, topK, activeSessionId || undefined);

      // If a new session was created implicitly, update session list
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
      <aside className="w-72 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-xl hidden md:flex">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Conversations
          </span>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus size={14} />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading history...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare size={24} className="mx-auto text-slate-600 mb-2" />
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
                      ? 'bg-indigo-600/10 text-indigo-300 font-medium border border-indigo-500/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare size={14} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                    <span className="truncate">{sess.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
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
      <main className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        {/* Chat Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-white">{activeSessionTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                showSettings
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders size={14} />
              <span>top-k: {topK}</span>
            </button>
          </div>
        </div>

        {/* Top-K Settings Bar */}
        {showSettings && (
          <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span>Retrieval Depth (Chunks):</span>
              <input
                type="range"
                min="1"
                max="15"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-32 accent-indigo-500"
              />
              <span className="font-mono text-indigo-400 font-bold">{topK}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Only chunks meeting the cosine relevance threshold are passed to the model.
            </span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-4 shadow-inner">
                <Sparkles size={32} />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-1">
                Ask Questions Grounded in Your Documents
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                All answers cite your verified document sources and page numbers. Unrelated questions
                refuse to hallucinate.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md w-full">
                {[
                  'Summarize the key points of my uploaded document.',
                  'What are the milestones or deadlines mentioned?',
                  'Extract the budget and monetary allocations.',
                  'Who are the authors and main stakeholders?',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputQuestion(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left text-xs text-slate-300 hover:text-white transition"
                  >
                    "{prompt}"
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
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Sparkles size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm shadow-lg'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Grounded & Sources Tray (Assistant Only) */}
                  {msg.role === 'assistant' && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {msg.sources && msg.sources.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 mb-2">
                            <BookOpen size={13} />
                            <span>Verified Citations ({msg.sources.length})</span>
                          </div>

                          <div className="space-y-2">
                            {msg.sources.map((source, idx) => {
                              const isExpanded = expandedSources[`${msg.id}-${idx}`];
                              return (
                                <div
                                  key={idx}
                                  className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px]"
                                >
                                  <div
                                    onClick={() => toggleSourceExpand(msg.id, idx)}
                                    className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white transition"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText size={13} className="text-indigo-400 shrink-0" />
                                      <span className="font-medium truncate">{source.filename}</span>
                                      {source.page && (
                                        <span className="bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded text-[10px]">
                                          Page {source.page}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                      {source.distance !== undefined && (
                                        <span className="font-mono text-[10px]">
                                          dist: {source.distance}
                                        </span>
                                      )}
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                  </div>

                                  {isExpanded && source.preview && (
                                    <div className="mt-2 pt-2 border-t border-slate-800/60 text-slate-400 italic font-serif text-[11px] bg-slate-950/50 p-2 rounded">
                                      "{source.preview}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : msg.grounded === false ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                          <AlertCircle size={13} />
                          <span>No matching document chunks met the relevance threshold.</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))
          )}

          {loadingAnswer && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center gap-2">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <span>Searching vector store and generating grounded answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
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
              placeholder="Ask a question about your documents... (Press Enter to send)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || loadingAnswer}
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition shadow-lg shadow-indigo-600/20 shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span>Powered by OpenAI & pgvector cosine similarity</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </main>
    </div>
  );
};

