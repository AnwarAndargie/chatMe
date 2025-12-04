"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, type Message } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { UserInfoSheet } from "@/components/chat/user-info-sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare, Info, Loader2 } from "lucide-react";
import type { User } from "@/lib/mock-users";
import { usePusher } from "@/components/providers/pusher-provider";
import type PusherClient from "pusher-js";
import type { Channel, PresenceChannel } from "pusher-js";

interface NewMessageEvent {
    id: string;
    content: string;
    sender: {
        name: string;
        image?: string | null;
    };
    sentAt: string;
    senderId: string;
    isEdited?: boolean;
    editedAt?: string | null;
}

interface MessageEditedEvent {
    messageId: string;
    content: string;
    isEdited?: boolean;
    editedAt?: string | null;
}

interface MessageDeletedEvent {
    messageId: string;
}

interface PresenceMember {
    id: string;
}

export function ChatInterface() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [userInfoSheetOpen, setUserInfoSheetOpen] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { pusher } = usePusher();


    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current && messages.length > 0) {
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
                const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
                if (viewport) {
                    viewport.scrollTo({
                        top: viewport.scrollHeight,
                        behavior: "smooth"
                    });
                }
            });
        }
    }, [messages]);


    // Subscribe to Pusher channel for the current chat
    useEffect(() => {
        if (!pusher || !currentChatId) return;

        const chatChannel: Channel = (pusher as PusherClient).subscribe(`chat-${currentChatId}`);

        const handleNewMessage = (message: NewMessageEvent) => {
            const newMessage: Message = {
                id: message.id,
                content: message.content,
                sender: {
                    name: message.sender.name,
                    avatar: message.sender.image,
                },
                timestamp: new Date(message.sentAt),
                isCurrentUser: message.senderId === currentUserId,
                isEdited: message.isEdited,
                editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
            };
            setMessages((prev) => [...prev, newMessage]);
        };

        const handleMessageEdited = (data: MessageEditedEvent) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === data.messageId
                        ? {
                            ...msg,
                            content: data.content,
                            isEdited: data.isEdited,
                            editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
                        }
                        : msg
                )
            );
        };

        const handleMessageDeleted = (data: MessageDeletedEvent) => {
            setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
        };

        chatChannel.bind("message:new", handleNewMessage);
        chatChannel.bind("message:edited", handleMessageEdited);
        chatChannel.bind("message:deleted", handleMessageDeleted);

        return () => {
            chatChannel.unbind("message:new", handleNewMessage);
            chatChannel.unbind("message:edited", handleMessageEdited);
            chatChannel.unbind("message:deleted", handleMessageDeleted);
            (pusher as PusherClient).unsubscribe(`chat-${currentChatId}`);
        };
    }, [pusher, currentChatId, currentUserId]);

    // Keep selected user's online status (and lastSeen) in sync via Pusher presence channel
    useEffect(() => {
        if (!pusher || !selectedUser) {
            if (!pusher) {
                console.warn("[ChatInterface] No Pusher client for presence channel.");
            }
            return;
        }

        const presenceChannel = (pusher as PusherClient).subscribe("presence-users") as PresenceChannel;
        console.log("[ChatInterface] Subscribed to presence-users channel for selected user presence.");

        const updateFromMembers = () => {
            const onlineUserIds: string[] = [];

            const members = presenceChannel.members as unknown as {
                each: (callback: (member: PresenceMember) => void) => void;
            };

            members.each((member) => {
                if (member?.id) {
                    onlineUserIds.push(member.id);
                }
            });

            console.log("[ChatInterface] Presence members online IDs:", onlineUserIds);

            setSelectedUser((prev) => {
                if (!prev) return prev;
                const isOnline = onlineUserIds.includes(prev.id);
                const wasOnline = prev.online;
                return {
                    ...prev,
                    online: isOnline,
                    // If this user just went offline, update lastSeen locally
                    lastSeen: !isOnline && wasOnline ? new Date() : prev.lastSeen,
                };
            });
        };

        presenceChannel.bind("pusher:subscription_succeeded", updateFromMembers);
        presenceChannel.bind("pusher:member_added", updateFromMembers);
        presenceChannel.bind("pusher:member_removed", updateFromMembers);

        return () => {
            console.log("[ChatInterface] Cleaning up presence-users bindings for selected user.");
            presenceChannel.unbind("pusher:subscription_succeeded", updateFromMembers);
            presenceChannel.unbind("pusher:member_added", updateFromMembers);
            presenceChannel.unbind("pusher:member_removed", updateFromMembers);
            // Do not unsubscribe here to avoid affecting other components using the same channel
        };
    }, [pusher, selectedUser]);

    const handleSelectUser = async (user: User) => {
        setSelectedUser(user);
        setMessages([]);
        setIsLoadingMessages(true);

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
                const myUserId = chat.participantIds.find((id: string) => id !== otherUserId) ?? null;
                setCurrentUserId(myUserId);

                const messagesResponse = await fetch(`/api/messages?chatId=${chat.id}`);
                if (messagesResponse.ok) {
                    const apiMessages: NewMessageEvent[] = await messagesResponse.json();
                    const transformedMessages: Message[] = apiMessages.map((msg) => ({
                        id: msg.id,
                        content: msg.content,
                        sender: {
                            name: msg.sender.name,
                            avatar: msg.sender.image,
                        },
                        timestamp: new Date(msg.sentAt),
                        isCurrentUser: msg.sender.id === myUserId,
                        isEdited: msg.isEdited,
                        editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
                    }));
                    setMessages(transformedMessages);
                }
            }
        } catch (error) {
            console.error("Failed to load chat:", error);
        } finally {
            setIsLoadingMessages(false);
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
                // Pusher event will be triggered from the server API and received via subscription
                await response.json();
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        if (!currentChatId) return;

        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent }),
            });

            if (response.ok) {
                // Pusher event will be triggered from the server API and received via subscription
                await response.json();
            }
        } catch (error) {
            console.error("Failed to edit message:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentChatId) return;

        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Pusher event will be triggered from the server API and received via subscription
                await response.json();
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
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
                <SidebarInset className="flex-1 overflow-hidden">
                    {selectedUser ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Chat Header */}
                            <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 px-4 md:px-6 py-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {/* Sidebar Trigger for Mobile */}
                                        <SidebarTrigger className="md:hidden" />
                                        <div className="flex items-center gap-2 md:gap-3">
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
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-700 rounded-full border border-background ring-2 ring-green-700" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-foreground">
                                                    {selectedUser.name}
                                                </h2>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedUser.online ? "Online" : "Offline"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1">
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
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 relative overflow-hidden min-h-0">
                                {isLoadingMessages && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 bg-background/80 backdrop-blur-sm">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                                        <p className="text-muted-foreground">Loading messages...</p>
                                    </div>
                                )}
                                <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
                                    <div className="px-6 py-4">
                                        {messages.length === 0 && !isLoadingMessages ? (
                                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
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
                                            <div className="space-y-1 pb-2">
                                                {messages.map((message) => (
                                                    <ChatMessage
                                                        key={message.id}
                                                        message={message}
                                                        onEdit={handleEditMessage}
                                                        onDelete={handleDeleteMessage}
                                                    />
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Input Area - Fixed at bottom */}
                            <div className="flex-shrink-0">
                                <ChatInput onSendMessage={handleSendMessage} />
                            </div>
                        </div>
                    ) : (
                        // No user selected state
                        <div className="flex-1 flex flex-col h-full">
                            {/* Mobile Header with Sidebar Trigger */}
                            <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 px-4 py-3 md:hidden">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <SidebarTrigger />
                                        <h2 className="text-lg font-semibold">Chats</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
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
