"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, type Message } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

// Mock current user data - in a real app, this would come from auth context
const CURRENT_USER = {
    name: "You",
    avatar: undefined,
};

// Mock chat partner - in a real app, this would be dynamic
const CHAT_PARTNER = {
    name: "Alex Johnson",
    avatar: undefined,
};

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (content: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: CURRENT_USER,
            timestamp: new Date(),
            isCurrentUser: true,
        };

        setMessages((prev) => [...prev, newMessage]);

        // Simulate a response after 1-2 seconds (for demo purposes)
        setTimeout(() => {
            const responseMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: getAutoResponse(content),
                sender: CHAT_PARTNER,
                timestamp: new Date(),
                isCurrentUser: false,
            };
            setMessages((prev) => [...prev, responseMessage]);
        }, 1000 + Math.random() * 1000);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Chat Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={CHAT_PARTNER.avatar} alt={CHAT_PARTNER.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {CHAT_PARTNER.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {CHAT_PARTNER.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="rounded-full bg-primary/10 p-6 mb-4">
                            <MessageSquare className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Start the conversation by sending a message below. Your messages
                            will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <ChatInput onSendMessage={handleSendMessage} />
        </div>
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
