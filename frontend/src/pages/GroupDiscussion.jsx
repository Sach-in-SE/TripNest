import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const GroupDiscussion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    fetchGroupInfo();
    fetchMessages(true);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 120;
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  const fetchGroupInfo = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.error("Failed to load group info:", err);
      setError(err.response?.data?.message || "Failed to load group details");
    }
  };

  const fetchMessages = async (isInitial = false) => {
    try {
      const res = await api.get(`/groups/${id}/messages`);
      const newMessages = res.data || [];
      const shouldScroll = isInitial || isInitialLoadRef.current || isNearBottom();
      
      setMessages(newMessages);

      if (isInitial) {
        setLoading(false);
      }

      if (shouldScroll) {
        setTimeout(() => {
          scrollToBottom(!isInitialLoadRef.current);
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }
        }, 50);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      if (isInitial) {
        setError(err.response?.data?.message || "Failed to load messages");
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessageContent || !newMessageContent.trim() || sendingMessage) return;

    const contentToSend = newMessageContent.trim();
    try {
      setSendingMessage(true);
      setError(null);
      await api.post(`/groups/${id}/messages`, { content: contentToSend });
      setNewMessageContent("");
      await fetchMessages(false);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="tn-user-layout-container" style={{ height: "100vh", overflow: "hidden" }}>
        <Sidebar />
        <main className="tn-user-main" style={{ display: "flex", flexDirection: "column", height: "100vh", boxSizing: "border-box" }}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading discussion...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="tn-user-layout-container" style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main className="tn-user-main" style={{ display: "flex", flexDirection: "column", height: "100vh", boxSizing: "border-box" }}>
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <button className="btn-compact" onClick={() => navigate(`/groups/${id}`)}>
              ← Back to Group Details
            </button>
            <div>
              <h1 style={styles.title}>💬 {group?.name ? `${group.name} Discussion` : "Group Discussion"}</h1>
              <p style={styles.subtitle}>
                {group?.tripTitle ? `Trip: ${group.tripTitle}` : "Persistent Group Chat"}
                {group?.memberCount ? ` • ${group.memberCount} members` : ""}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={() => setError(null)} style={styles.closeError}>×</button>
          </div>
        )}

        <div style={styles.chatCard} className="glass-card">
          <div ref={messagesContainerRef} style={styles.messageList}>
            {messages.length === 0 ? (
              <div style={styles.emptyChat}>
                No messages in this group yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageItem,
                    alignSelf: msg.isSelf ? "flex-end" : "flex-start",
                    background: msg.isSelf ? "rgba(124, 58, 237, 0.25)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: msg.isSelf ? "rgba(167, 139, 250, 0.4)" : "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={styles.messageHeader}>
                    <span style={styles.messageSender}>
                      {msg.isSelf ? "You" : (msg.senderName || msg.senderUsername)}
                    </span>
                    <span style={styles.messageTime}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p style={styles.messageContent}>{msg.content}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={styles.chatForm}>
            <input
              className="aurora-input"
              placeholder="Type a message... (Press Enter to send)"
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
              maxLength={1000}
              style={styles.chatInput}
            />
            <button
              type="submit"
              className="btn-aurora"
              disabled={sendingMessage || !newMessageContent.trim()}
              style={styles.sendBtn}
            >
              {sendingMessage ? "Sending..." : "Send 📤"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 },
  headerTitleGroup: { display: "flex", alignItems: "center", gap: "16px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif" },
  subtitle: { color: "#94a3b8", fontSize: "13px", marginTop: "2px" },
  chatCard: { flex: 1, padding: "20px", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 },
  messageList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "8px", marginBottom: "16px" },
  emptyChat: { color: "#94a3b8", fontSize: "14px", fontStyle: "italic", margin: "auto", textAlign: "center" },
  messageItem: { display: "flex", flexDirection: "column", gap: "4px", padding: "10px 14px", borderRadius: "12px", border: "1px solid", maxWidth: "75%" },
  messageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" },
  messageSender: { color: "#a78bfa", fontSize: "12px", fontWeight: "600" },
  messageTime: { color: "#64748b", fontSize: "11px" },
  messageContent: { color: "#f1f5f9", fontSize: "14px", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 },
  chatForm: { display: "flex", gap: "12px", flexShrink: 0 },
  chatInput: { flex: 1 },
  sendBtn: { whiteSpace: "nowrap" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(125,211,252,0.2)", borderTop: "3px solid #7dd3fc", borderRadius: "50%" },
  loadingText: { color: "#94a3b8", fontSize: "14px" },
  errorBanner: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 },
  closeError: { background: "none", border: "none", color: "#ef4444", fontSize: "20px", cursor: "pointer", padding: "0 8px" },
};

export default GroupDiscussion;
