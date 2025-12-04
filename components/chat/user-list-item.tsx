import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/mock-users";

interface UserListItemProps {
    user: User;
    isActive?: boolean;
    onClick: () => void;
    unreadCount?: number;
    lastMessage?: {
        id: string;
        content: string;
        sentAt: Date;
        senderId: string;
    };
    lastMessageAt?: Date;
}

const formatRelativeTime = (date?: Date) => {
    if (!date) return "";

    const now = Date.now();
    const diffMs = now - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
};

export function UserListItem({ user, isActive, onClick, unreadCount = 0, lastMessage, lastMessageAt }: UserListItemProps) {
    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const getPresenceText = () => {
        if (user.online) return "Online";
        if (!user.lastSeen) return "Offline";

        const now = new Date();
        const lastSeenDate = new Date(user.lastSeen);
        const diff = now.getTime() - lastSeenDate.getTime();
        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const lastMessagePreview = () => {
        if (!lastMessage?.content) {
            return "Start a conversation";
        }

        const prefix = lastMessage.senderId === user.id ? "" : "You: ";
        const text = `${prefix}${lastMessage.content}`.trim();

        return text.length > 64 ? `${text.slice(0, 61)}…` : text;
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors rounded-lg",
                isActive && "bg-accent"
            )}
        >
            <div className="relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div
                    className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border border-background",
                        user.online ? "bg-green-700 ring-2 ring-green-700" : "bg-muted-foreground"
                    )}
                />
            </div>

            <div className="flex-1 text-left min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={cn(
                            "font-medium text-sm truncate",
                            unreadCount > 0 && "text-foreground"
                        )}
                    >
                        {user.name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(lastMessageAt)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <p
                        className={cn(
                            "truncate",
                            unreadCount > 0 && "text-foreground"
                        )}
                    >
                        {lastMessagePreview()}
                    </p>
                    <span className={cn(user.online ? "text-green-700 dark:text-green-600" : "text-muted-foreground")}>
                        {getPresenceText()}
                    </span>
                </div>
            </div>

            {unreadCount > 0 && (
                <div className="ml-2 inline-flex min-w-[1.75rem] justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </div>
            )}
        </button>
    );
}
