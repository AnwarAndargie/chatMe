"use client";

import { cn } from "@/lib/utils";

export type ConversationFilter = "all" | "online";

interface ConversationFiltersProps {
    activeFilter: ConversationFilter;
    onFilterChange: (filter: ConversationFilter) => void;
    unreadCount?: number;
}

export function ConversationFilters({
    activeFilter,
    onFilterChange,
    unreadCount,
}: ConversationFiltersProps) {
    const filters: { value: ConversationFilter; label: string; count?: number }[] = [
        { value: "all", label: "All", count: unreadCount },
        { value: "online", label: "Online" },
    ];

    return (
        <div className="flex gap-1 p-2 bg-muted/50 rounded-lg">
            {filters.map((filter) => (
                <button
                    key={filter.value}
                    onClick={() => onFilterChange(filter.value)}
                    className={cn(
                        "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        "hover:bg-background/80",
                        activeFilter === filter.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground"
                    )}
                >
                    {filter.label}
                    {filter.count !== undefined && filter.count > 0 && (
                        <span
                            className={cn(
                                "ml-1.5 px-1.5 py-0.5 text-xs rounded-full",
                                activeFilter === filter.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                            )}
                        >
                            {filter.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
