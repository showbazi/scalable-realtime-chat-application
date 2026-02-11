import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import api from "../lib/axios";
import { Send, User as UserIcon } from "lucide-react";

interface Chat {
  id: string;
}

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data.data));
  }, []);

  const startChat = async (partner: User) => {
    const { data } = await api.post("/chats", { partnerId: partner.id });
    setSelectedChat(data.data);
    setSelectedPartner(partner);

    const msgRes = await api.get(`/chats/${data.data.id}/messages`);
    setMessages(msgRes.data.data);

    socket?.emit("join_room", data.data.id);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("new_message", (incomingMsg) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === incomingMsg.id);
        if (exists) return prev;
        return [...prev, incomingMsg];
      });
    });

    // Listen for the broadcasted list
    socket.on("get_online_users", (userIds: string[]) => {
      setOnlineUsers([...userIds]); // Use spread operator to ensure a fresh reference
    });

    // Request an update the moment the socket connects
    socket.emit("request_online_users");

    return () => {
      socket.off("new_message");
      socket.off("get_online_users");
    };
  }, [socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !socket) return;

    socket.emit("send_message", {
      conversationId: selectedChat.id,
      content: newMessage,
      senderId: user?.id,
    });
    setNewMessage("");
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar: User List */}
      <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-white">
        <div className="p-4 border-b h-[65px] flex items-center justify-between bg-gray-50 text-gray-800">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="bg-blue-600 p-1.5 rounded-full text-white flex-shrink-0">
              <UserIcon size={16} />
            </div>
            <span
              className="font-bold text-gray-800 truncate"
              title={user?.username}
            >
              {user?.username}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors border border-red-200"
          >
            Logout
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => startChat(u)}
              className={`p-4 cursor-pointer flex items-center space-x-3 border-b border-gray-100 transition-colors ${
                selectedPartner?.id === u.id
                  ? "bg-blue-50 border-l-4 border-l-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`${selectedPartner?.id === u.id ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"} p-2 rounded-full`}
                >
                  <UserIcon size={20} />
                </div>
                {/* Green Dot in Sidebar */}
                {isUserOnline(u.id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <span
                className={`font-medium truncate ${selectedPartner?.id === u.id ? "text-blue-700" : "text-gray-800"}`}
              >
                {u.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        {selectedChat && selectedPartner ? (
          <>
            {/* Header: User Avatar and Name */}
            <div className="p-4 bg-white border-b h-[65px] flex items-center space-x-3 shadow-sm text-gray-800">
              <div className="bg-blue-600 p-2 rounded-full text-white">
                <UserIcon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold leading-tight">
                  {selectedPartner.username}
                </span>
                {/* Dynamic Online/Offline Label */}
                <span
                  className={`text-xs font-medium ${isUserOnline(selectedPartner.id) ? "text-green-500" : "text-gray-400"}`}
                >
                  {isUserOnline(selectedPartner.id) ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm text-sm ${
                      msg.senderId === user?.id
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-gray-200 flex space-x-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedPartner.username}...`}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white p-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <span className="hidden sm:inline font-medium">Send</span>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="bg-gray-200 p-6 rounded-full">
              <UserIcon size={48} />
            </div>
            <p className="text-lg font-medium">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
