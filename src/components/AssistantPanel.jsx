const AssistantPanel = () => {
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
        <div className="assistant-message">
          <p className="assistant-message__meta">Hello! I'm here to help you with your project management tasks.</p>
          <p className="assistant-message__bubble">
            Hello! I'm here to help you with your project management tasks. Ask me anything about your sprint!
          </p>
        </div>
        <div className="user-message">
          <p className="user-message__bubble">Can you show me the status of our current sprint?</p>
        </div>
        <div className="assistant-message">
          <p className="assistant-message__bubble">
            Based on the current sprint, 63% of tasks are done, 12% in progress, and 25% still to do. The backlog is
            slightly behind schedule.
          </p>
        </div>
      </div>
      <form className="assistant-panel__input" aria-label="Send a message to the AI assistant">
        <input type="text" placeholder="Ask a question..." />
        <button type="button">Send</button>
      </form>
    </section>
  );
};

export default AssistantPanel;
