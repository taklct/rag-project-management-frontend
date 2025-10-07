import { type FormEvent, useMemo, useState } from 'react';

type MessageRole = 'assistant' | 'user';

type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  meta?: string;
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
  const [inputValue, setInputValue] = useState('');

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }

    const userMessage: ConversationMessage = {
      id: createId(),
      role: 'user',
      content: trimmedValue,
    };

    const assistantMessage: ConversationMessage = {
      id: createId(),
      role: 'assistant',
      content: assistantReplies[Math.floor(Math.random() * assistantReplies.length)],
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInputValue('');
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
          return (
            <div
              key={message.id}
              className={isAssistant ? 'assistant-message' : 'user-message'}
              aria-live={isAssistant ? 'polite' : undefined}
            >
              {isAssistant && message.meta ? (
                <p className="assistant-message__meta">{message.meta}</p>
              ) : null}
              <p className={isAssistant ? 'assistant-message__bubble' : 'user-message__bubble'}>{message.content}</p>
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
          placeholder="Ask a question..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
};

export default AssistantPanel;
