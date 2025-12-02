"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, type Message } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MessageSquare } from "lucide-react";
import type { User } from "@/lib/mock-users";
import { mockUsers } from "@/lib/mock-users";

// Mock current user data - in a real app, this would come from auth context
const CURRENT_USER = {
    name: "You",
    avatar: undefined,
};

// Type for managing chat histories per user
type ChatHistories = {
    [userId: string]: Message[];
};

export function ChatInterface() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [chatHistories, setChatHistories] = useState<ChatHistories>({});
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get messages for the currently selected user
    const currentMessages = selectedUser
        ? chatHistories[selectedUser.id] || []
        : [];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages]);

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
    };

    const handleSendMessage = (content: string) => {
        if (!selectedUser) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: CURRENT_USER,
            timestamp: new Date(),
            isCurrentUser: true,
        };

        // Add message to the selected user's chat history
        setChatHistories((prev) => ({
            ...prev,
            [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage],
        }));

        // Simulate a response after 1-2 seconds (for demo purposes)
        setTimeout(() => {
            const responseMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: getAutoResponse(content),
                sender: {
                    name: selectedUser.name,
                    avatar: selectedUser.avatar,
                },
                timestamp: new Date(),
                isCurrentUser: false,
            };

            setChatHistories((prev) => ({
                ...prev,
                [selectedUser.id]: [...(prev[selectedUser.id] || []), responseMessage],
            }));
        }, 1000 + Math.random() * 1000);
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-background">
                {/* Sidebar */}
                <ChatSidebar
                    selectedUserId={selectedUser?.id}
                    onSelectUser={handleSelectUser}
                />

                {/* Main Chat Area */}
                <SidebarInset className="flex-1">
                    {selectedUser ? (
                        <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 px-6 py-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {selectedUser.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Online indicator */}
                                        {selectedUser.online && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {selectedUser.name}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedUser.online ? "Active now" : "Offline"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
                                {currentMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                        <div className="rounded-full bg-primary/10 p-6 mb-4">
                                            <MessageSquare className="h-12 w-12 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                                        <p className="text-muted-foreground max-w-sm">
                                            Start the conversation with {selectedUser.name} by sending a
                                            message below.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {currentMessages.map((message) => (
                                            <ChatMessage key={message.id} message={message} />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Input Area */}
                            <ChatInput onSendMessage={handleSendMessage} />
                        </div>
                    ) : (
                        // No user selected state
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 h-full">
                            <div className="rounded-full bg-primary/10 p-8 mb-6">
                                <MessageSquare className="h-16 w-16 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Welcome to Chat</h2>
                            <p className="text-muted-foreground max-w-md mb-6">
                                Select a user from the sidebar to start a conversation. You can
                                search for users using the search bar above.
                            </p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    {mockUsers.filter((u) => u.online).length} online
                                </span>
                                <span>•</span>
                                <span>{mockUsers.length} total users</span>
                            </div>
                        </div>
                    )}
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

// Simple auto-response function for demo purposes
function getAutoResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        return "Hey! How are you doing today?";
    }
    if (lowerMessage.includes("how are you")) {
        return "I'm doing great, thanks for asking! How about you?";
    }
    if (lowerMessage.includes("bye")) {
        return "Goodbye! Have a great day!";
    }
    if (lowerMessage.includes("?")) {
        return "That's a great question! Let me think about that...";
    }

    const responses = [
        "That's interesting! Tell me more.",
        "I see what you mean!",
        "Thanks for sharing that with me.",
        "That sounds really cool!",
        "I totally understand.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}
