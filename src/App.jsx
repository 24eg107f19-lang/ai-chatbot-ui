import { useRef, useState } from "react";
import "./App.css";

function App() {

  // =========================================================
  // CONVERSATION ID
  // =========================================================

  const [conversationId] = useState(() => {
    let id = localStorage.getItem("conversationId");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("conversationId", id);
    }

    return id;
  });

  // =========================================================
  // CHAT STATE
  // =========================================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================================================
  // PDF STATE
  // =========================================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef(null);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = async () => {

    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();

    // Show user message immediately
    setMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        content: userMessage
      }
    ]);

    // Clear input
    setMessage("");

    // Start loading
    setLoading(true);

    try {

      // =====================================================
      // SPRING BOOT RAG CHAT ENDPOINT
      // =====================================================

      const res = await fetch(
        "http://localhost:8081/api/rag/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            message: userMessage,
            conversationId: conversationId
          })
        }
      );

      // Backend returns String
      const data = await res.text();

      if (!res.ok) {
        throw new Error(data);
      }

      // Add AI response
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "ai",
          content: data
        }
      ]);

    } catch (error) {

      console.error(error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "ai",
          content:
            error.message ||
            "Something went wrong. Please check whether the Spring Boot server is running."
        }
      ]);

    } finally {

      setLoading(false);
    }
  };

  // =========================================================
  // ENTER TO SEND
  // SHIFT + ENTER = NEW LINE
  // =========================================================

  const handleKeyDown = (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

      event.preventDefault();

      sendMessage();
    }
  };

  // =========================================================
  // PDF UPLOAD
  // =========================================================

  const uploadDocument = async () => {

    if (!selectedFile) {

      setUploadStatus("Please select a PDF.");

      return;
    }

    // Check PDF
    if (selectedFile.type !== "application/pdf") {

      setUploadStatus("Only PDF files are allowed.");

      return;
    }

    setUploading(true);
    setUploadStatus("Uploading PDF...");

    try {

      const formData = new FormData();

      formData.append("file", selectedFile);

      // =====================================================
      // SPRING BOOT PDF UPLOAD ENDPOINT
      // =====================================================

      const res = await fetch(
        "http://localhost:8081/api/rag/upload",
        {
          method: "POST",
          body: formData
        }
      );

      // Backend returns String
      const data = await res.text();

      if (!res.ok) {

        throw new Error(data);
      }

      setUploadStatus(data);

    } catch (error) {

      console.error(error);

      setUploadStatus(
        error.message ||
        "Upload failed. Please check the backend."
      );

    } finally {

      setUploading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="sidebar-header">

          <div className="logo">
            AI
          </div>

          <div>

            <h2>
              AI Chatbot
            </h2>

            <span>
              Gemini Assistant
            </span>

          </div>

        </div>

        <div className="sidebar-section">

          <p className="section-title">
            CONVERSATION
          </p>

          <div className="conversation-card">

            <div className="conversation-icon">
              💬
            </div>

            <div className="conversation-info">

              <strong>
                Current Chat
              </strong>

              <span>
                {messages.length} message
                {messages.length !== 1 ? "s" : ""}
              </span>

            </div>

          </div>

        </div>

        <div className="sidebar-section conversation-details">

          <p className="section-title">
            MEMORY
          </p>

          <div className="memory-box">

            <div className="memory-status">

              <span className="status-dot"></span>

              Memory Active

            </div>

            <p>
              This conversation is stored using
              your Spring Boot + MySQL memory.
            </p>

          </div>

        </div>

        <div className="sidebar-bottom">

          <p>
            Spring Boot
          </p>

          <p>
            Spring AI + Gemini
          </p>

          <p>
            MySQL Memory
          </p>

          <p>
            Pinecone RAG
          </p>

        </div>

      </aside>


      {/* =====================================================
          MAIN CHAT
      ====================================================== */}

      <main className="chat-panel">

        {/* HEADER */}

        <header className="chat-header">

          <div>

            <h1>
              AI Assistant
            </h1>

            <p>
              Ask anything and continue your conversation
            </p>

          </div>

          <div className="online-status">

            <span></span>

            Online

          </div>

        </header>


        {/* ===================================================
            MESSAGES
        ==================================================== */}

        <div className="messages-container">

          {messages.length === 0 && !loading ? (

            <div className="welcome">

              <div className="welcome-icon">
                ✨
              </div>

              <h2>
                How can I help you?
              </h2>

              <p>
                Start a conversation with your AI assistant.
              </p>

              <div className="example-prompts">

                <button
                  onClick={() =>
                    setMessage(
                      "Explain Spring Boot in simple words"
                    )
                  }
                >
                  Explain Spring Boot
                </button>

                <button
                  onClick={() =>
                    setMessage(
                      "What is dependency injection?"
                    )
                  }
                >
                  Explain Dependency Injection
                </button>

                <button
                  onClick={() =>
                    setMessage(
                      "Teach me Java 21"
                    )
                  }
                >
                  Teach me Java 21
                </button>

              </div>

            </div>

          ) : (

            <div className="messages-list">

              {messages.map((msg, index) => (

                <div
                  key={index}
                  className={`message-row ${
                    msg.role === "user"
                      ? "user-row"
                      : "ai-row"
                  }`}
                >

                  <div
                    className={`message-avatar ${
                      msg.role === "user"
                        ? "user-avatar"
                        : "ai-avatar"
                    }`}
                  >

                    {msg.role === "user"
                      ? "You"
                      : "AI"}

                  </div>


                  <div
                    className={`message-content ${
                      msg.role === "user"
                        ? "user-message"
                        : "ai-message"
                    }`}
                  >

                    <div className="message-label">

                      {msg.role === "user"
                        ? "You"
                        : "AI"}

                    </div>

                    <div className="message-text">

                      {msg.content}

                    </div>

                  </div>

                </div>

              ))}


              {/* AI THINKING */}

              {loading && (

                <div className="message-row ai-row">

                  <div className="message-avatar ai-avatar">
                    AI
                  </div>

                  <div className="message-content ai-message">

                    <div className="message-label">
                      AI
                    </div>

                    <div className="typing">

                      <span></span>
                      <span></span>
                      <span></span>

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* ===================================================
            INPUT AREA
        ==================================================== */}

        <div className="input-area">

          <div className="input-wrapper">

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              rows="1"
              disabled={loading}
            />

            <div className="action-buttons">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setSelectedFile(e.target.files[0]);
                  setUploadStatus("");
                }}
                className="hidden-file-input"
              />

              <button
                type="button"
                className="upload-button"
                onClick={selectedFile ? uploadDocument : triggerFilePicker}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : selectedFile ? "Upload PDF" : "Upload"}
              </button>

              <button
                className="send-button"
                onClick={sendMessage}
                disabled={
                  loading || !message.trim()
                }
              >

                {loading ? (

                  <span className="button-loader"></span>

                ) : (

                  "➤"

                )}

              </button>
            </div>

          </div>

          <div className="upload-feedback-row">
            {selectedFile && !uploadStatus && (
              <span className="selected-file-pill">
                Selected: {selectedFile.name}
              </span>
            )}

            {uploadStatus && (
              <span className={`upload-status ${uploading ? "uploading" : "success"}`}>
                {uploadStatus}
              </span>
            )}
          </div>

          <p className="input-hint">

            Press Enter to send • Shift + Enter for new line

          </p>

        </div>

      </main>

    </div>
  );
}

export default App;