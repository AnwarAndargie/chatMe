"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { useState } from "react";

export interface Message {
    id: string;
    content: string;
    sender: {
        name: string;
        avatar?: string;
    };
    timestamp: Date;
    isCurrentUser: boolean;
    isEdited?: boolean;
    editedAt?: Date;
}

interface ChatMessageProps {
    message: Message;
    onEdit?: (messageId: string, newContent: string) => void;
    onDelete?: (messageId: string) => void;
}

export function ChatMessage({ message, onEdit, onDelete }: ChatMessageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isHovered, setIsHovered] = useState(false);

    const formattedTime = message.timestamp.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });

    const initials = message.sender.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== message.content && onEdit) {
            onEdit(message.id, editContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(message.content);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (onDelete && confirm("Are you sure you want to delete this message?")) {
            onDelete(message.id);
        }
    };

    return (
        <div
            className={cn(
                "flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group",
                message.isCurrentUser && "flex-row-reverse"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div
                className={cn(
                    "flex flex-col gap-1 max-w-[70%]",
                    message.isCurrentUser && "items-end"
                )}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                        {message.sender.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{formattedTime}</span>
                </div>

                <div className="relative">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveEdit();
                                    } else if (e.key === "Escape") {
                                        handleCancelEdit();
                                    }
                                }}
                                className="flex-1"
                                autoFocus
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={handleSaveEdit}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={handleCancelEdit}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    "rounded-2xl px-4 py-2.5 shadow-sm",
                                    message.isCurrentUser
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-muted text-foreground rounded-tl-sm"
                                )}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {message.content}
                                </p>
                                {message.isEdited && (
                                    <span className="text-xs opacity-70 italic block text-right mt-1">
                                        edited
                                    </span>
                                )}
                            </div>

                            {/* Action buttons - only show for current user's messages */}
                            {message.isCurrentUser && isHovered && !isEditing && (
                                <div
                                    className={cn(
                                        "absolute top-0 flex gap-1",
                                        message.isCurrentUser ? "right-full mr-2" : "left-full ml-2"
                                    )}
                                >
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
