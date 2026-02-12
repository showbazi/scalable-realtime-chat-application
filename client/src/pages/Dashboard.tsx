import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import api from "../lib/axios";
import { Send, User as UserIcon, Plus, LogOut } from "lucide-react";

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

interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  participants: {
    user: {
      id: string;
      username: string;
    };
  }[];
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
  const [myChats, setMyChats] = useState<Conversation[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/chats").then((res) => setMyChats(res.data.data));
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

    socket.on("get_online_users", (userIds: string[]) => {
      setOnlineUsers([...userIds]);
    });

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

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length === 0) return;
    try {
      const { data } = await api.post("/chats/group", {
        name: groupName,
        memberIds: selectedUsers,
      });
      setMyChats((prev) => [data.data, ...prev]);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedUsers([]);
    } catch {
      alert("Error creating group");
    }
  };

  const openChat = async (chat: Conversation) => {
    setSelectedChat(chat);
    if (chat.isGroup) {
      setSelectedPartner({ id: chat.id, username: chat.name || "Group" });
    } else {
      const partner = chat.participants.find(
        (p) => p.user.id !== user?.id,
      )?.user;
      setSelectedPartner(partner || null);
    }

    const msgRes = await api.get(`/chats/${chat.id}/messages`);
    setMessages(msgRes.data.data);
    socket?.emit("join_room", chat.id);
  };

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar Section */}
      <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-white">
        {/* Sidebar Header Layout */}
        <div className="p-4 border-b h-[65px] flex items-center justify-between bg-gray-50 shadow-sm z-10">
          {/* Left: User Info */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-blue-600 p-1.5 rounded-full text-white flex-shrink-0 shadow-sm">
              <UserIcon size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="font-bold text-gray-800 text-sm truncate"
                title={user?.username}
              >
                {user?.username}
              </span>
              <span className="text-[10px] text-green-600 font-medium leading-none">
                Active
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGroupModal(true)}
              title="Create Group"
              className="bg-white border border-gray-200 text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="bg-white border border-gray-200 text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors shadow-sm"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {/* Groups Section */}
          {myChats.filter((c) => c.isGroup).length > 0 && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
              Groups
            </div>
          )}
          {myChats
            .filter((c) => c.isGroup)
            .map((chat) => (
              <div
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`p-4 cursor-pointer flex items-center space-x-3 border-b border-gray-100 hover:bg-gray-50 ${selectedChat?.id === chat.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}
              >
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <span className="font-bold text-xs">GR</span>
                </div>
                <span className="font-medium text-gray-800 truncate">
                  {chat.name}
                </span>
              </div>
            ))}

          {/* Direct Messages Section */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 mt-2">
            Direct Messages
          </div>
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
            <div className="p-4 bg-white border-b h-[65px] flex items-center space-x-3 shadow-sm text-gray-800 z-10">
              <div className="bg-blue-600 p-2 rounded-full text-white">
                <UserIcon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold leading-tight">
                  {selectedPartner.username}
                </span>
                <span
                  className={`text-xs font-medium ${isUserOnline(selectedPartner.id) ? "text-green-500" : "text-gray-400"}`}
                >
                  {isUserOnline(selectedPartner.id) ? "Online" : "Offline"}
                </span>
              </div>
            </div>

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

      {/* Styled Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl border border-gray-100 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-xl text-gray-800">
                Create New Group
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                placeholder="e.g. Tech Team"
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members
              </label>
              <div className="h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                {users.length === 0 ? (
                  <div className="text-center text-gray-400 py-4 text-sm">
                    No users found
                  </div>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors mb-1 ${
                        selectedUsers.includes(u.id)
                          ? "bg-blue-50 border border-blue-100"
                          : "hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 accent-blue-600 pointer-events-none"
                        checked={selectedUsers.includes(u.id)}
                        readOnly
                      />
                      <span
                        className={`text-sm ${selectedUsers.includes(u.id) ? "font-semibold text-blue-700" : "text-gray-700"}`}
                      >
                        {u.username}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {selectedUsers.length} selected
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
