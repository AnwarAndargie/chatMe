import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Message {
    id: string;
    content: string;
    sender: {
        name: string;
        avatar?: string;
    };
    timestamp: Date;
    isCurrentUser: boolean;
}

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
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

    return (
        <div
            className={cn(
                "flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.isCurrentUser && "flex-row-reverse"
            )}
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
                </div>
            </div>
        </div>
    );
}
