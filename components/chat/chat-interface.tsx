"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, type Message } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { UserInfoSheet } from "@/components/chat/user-info-sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MessageSquare, Info } from "lucide-react";
import type { User } from "@/lib/mock-users";
import { useSocket } from "@/components/providers/socket-provider";

export function ChatInterface() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInfoSheetOpen, setUserInfoSheetOpen] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { socket, isConnected } = useSocket();


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    useEffect(() => {
        if (!socket) return;

        socket.on("receive-message", (message: any) => {
            const newMessage: Message = {
                id: message.id,
                content: message.content,
                sender: {
                    name: message.sender.name,
                    avatar: message.sender.image,
                },
                timestamp: new Date(message.sentAt),
                isCurrentUser: message.senderId === currentUserId,
            };
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => {
            socket.off("receive-message");
        };
    }, [socket, currentUserId]);

    const handleSelectUser = async (user: User) => {
        setSelectedUser(user);
        setMessages([]);

        try {
            const chatResponse = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
            });

            if (chatResponse.ok) {
                const chat = await chatResponse.json();
                setCurrentChatId(chat.id);

                const otherUserId = user.id;
                const myUserId = chat.participantIds.find((id: string) => id !== otherUserId);
                setCurrentUserId(myUserId);
                if (socket) {
                    socket.emit("join-room", chat.id);
                }

                const messagesResponse = await fetch(`/api/messages?chatId=${chat.id}`);
                if (messagesResponse.ok) {
                    const apiMessages = await messagesResponse.json();
                    const transformedMessages: Message[] = apiMessages.map((msg: any) => ({
                        id: msg.id,
                        content: msg.content,
                        sender: {
                            name: msg.sender.name,
                            avatar: msg.sender.image,
                        },
                        timestamp: new Date(msg.sentAt),
                        isCurrentUser: msg.sender.id === myUserId,
                    }));
                    setMessages(transformedMessages);
                }
            }
        } catch (error) {
            console.error("Failed to load chat:", error);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedUser || !currentChatId) return;

        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, chatId: currentChatId }),
            });

            if (response.ok) {
                const savedMessage = await response.json();

                if (socket) {
                    socket.emit("send-message", {
                        ...savedMessage,
                        sessionId: currentChatId,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
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
                                <div className="flex items-center justify-between">
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

                                    {/* Info Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => setUserInfoSheetOpen(true)}
                                    >
                                        <Info className="h-5 w-5" />
                                        <span className="sr-only">User info</span>
                                    </Button>
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
                                            Start the conversation with {selectedUser.name} by sending a
                                            message below.
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
                                    Online users
                                </span>
                            </div>
                        </div>
                    )}
                </SidebarInset>
            </div>

            {/* User Info Sheet */}
            <UserInfoSheet
                user={selectedUser}
                open={userInfoSheetOpen}
                onOpenChange={setUserInfoSheetOpen}
            />
        </SidebarProvider>
    );
}
