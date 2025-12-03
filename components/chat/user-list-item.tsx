import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/mock-users";

interface UserListItemProps {
    user: User;
    isActive?: boolean;
    onClick: () => void;
}

export function UserListItem({ user, isActive, onClick }: UserListItemProps) {
    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const getLastSeenText = () => {
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

            <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                    {user.name}
                </p>
                <p
                    className={cn(
                        "text-xs truncate",
                        user.online ? "text-green-700 dark:text-green-600" : "text-muted-foreground"
                    )}
                >
                    {getLastSeenText()}
                </p>
            </div>
        </button>
    );
}
