import { type FormEvent, useCallback, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config';
import '../css/AssistantPanel.css';

type MessageRole = 'assistant' | 'user';

type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  meta?: string;
  isTyping?: boolean;
};

const createId = (): string => Math.random().toString(36).slice(2, 11);

const initialMessages: ConversationMessage[] = [
  {
    id: createId(),
    role: 'assistant',
    content: "Hello! I'm here to help you with your project management tasks. Ask me anything about your sprint!",
    meta: "Hello! I'm here to help you with your project management tasks.",
  },
  {
    id: createId(),
    role: 'user',
    content: 'Can you show me the status of our current sprint?',
  },
  {
    id: createId(),
    role: 'assistant',
    content: 'Based on the current sprint, 63% of tasks are done, 12% in progress, and 25% still to do. The backlog is slightly behind schedule.',
  },
];

const AssistantPanel = (): JSX.Element => {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('give me summary of Oct 2025');
  const [isLoading, setIsLoading] = useState(false);

  const assistantReplies = useMemo(
    () => [
      'Sure thing! I drafted a quick summary for you. Let me know if you want a deeper dive.',
      "I've got a few ideas that could help. Want me to outline the next steps?",
      'Done! I added it to your action items for follow-up later today.',
      'Consider pairing this task with a quick stand-up note so the team stays aligned.',
      'I just checked your backlog—two items might need refinement before the next sprint planning.',
      'Remember to celebrate the wins! I highlighted three tasks that wrapped up ahead of schedule.',
      'Noted. I shuffled a couple of tasks to balance the workload across the team.',
      'Great question! The timeline still looks healthy, but keep an eye on the review column.',
      'Heads-up: I spotted a dependency that could block progress tomorrow. Shall I flag it?',
      'All set! I captured your question in the retrospective notes so it is not forgotten.',
    ],
    [],
  );

  const extractAnswer = useCallback((payload: unknown): string | null => {
    if (typeof payload === 'string' && payload.trim() !== '') {
      return payload.trim();
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const value = record.answer ?? record.result ?? record.message;
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }

    return null;
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmedValue = inputValue.trim();

    if (!trimmedValue || isLoading) {
      return;
    }

    const userMessage: ConversationMessage = {
      id: createId(),
      role: 'user',
      content: trimmedValue,
    };

    const typingMessage: ConversationMessage = {
      id: createId(),
      role: 'assistant',
      content: 'Typing…',
      isTyping: true,
    };

    setMessages((current) => [...current, userMessage, typingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.ask, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedValue }),
      });

      if (!response.ok) {
        throw new Error(`Unable to retrieve assistant response: ${response.status}`);
      }

      let answer = extractAnswer(await response.json());
      if (answer === null) {
        answer = assistantReplies[Math.floor(Math.random() * assistantReplies.length)];
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === typingMessage.id
            ? { ...message, content: answer ?? '', isTyping: false }
            : message,
        ),
      );
    } catch (error) {
      console.error(error);
      const fallback =
        "I'm sorry, I couldn't fetch that right now. Please try asking again in a moment.";
      setMessages((current) =>
        current.map((message) =>
          message.id === typingMessage.id
            ? { ...message, content: fallback, isTyping: false }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel assistant-panel">
      <header className="panel__header">
        <div className="assistant-panel__title">
          <span className="assistant-panel__badge" aria-hidden="true">
            🤖
          </span>
          <h2>AI Assistant</h2>
        </div>
      </header>
      <div className="assistant-panel__conversation">
        {messages.map((message) => {
          const isAssistant = message.role === 'assistant';
          const bubbleClass = isAssistant ? 'assistant-message__bubble' : 'user-message__bubble';
          return (
            <div
              key={message.id}
              className={isAssistant ? 'assistant-message' : 'user-message'}
              aria-live={isAssistant ? 'polite' : undefined}
            >
              {isAssistant && message.meta ? (
                <p className="assistant-message__meta">{message.meta}</p>
              ) : null}
              <p
                className={`${bubbleClass}${message.isTyping ? ' assistant-message__bubble--typing' : ''}`.trim()}
              >
                {message.isTyping ? (
                  <>
                    <span className="typing-indicator" aria-hidden="true">
                      <span className="typing-indicator__dot" />
                      <span className="typing-indicator__dot" />
                      <span className="typing-indicator__dot" />
                    </span>
                    <span className="sr-only">{message.content}</span>
                  </>
                ) : (
                  message.content
                )}
              </p>
            </div>
          );
        })}
      </div>
      <form
        className="assistant-panel__input"
        aria-label="Send a message to the AI assistant"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="give me summary of Oct 2025"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  );
};

export default AssistantPanel;
