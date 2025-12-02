export interface User {
    id: string;
    name: string;
    avatar?: string;
    online: boolean;
    lastSeen?: Date;
}

export const mockUsers: User[] = [
    {
        id: "1",
        name: "Alex Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        online: true,
    },
    {
        id: "2",
        name: "Sarah Williams",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        online: true,
    },
    {
        id: "3",
        name: "Michael Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
        online: true,
    },
    {
        id: "4",
        name: "Emily Davis",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
        id: "5",
        name: "James Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
        id: "6",
        name: "Jessica Martinez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
        online: true,
    },
    {
        id: "7",
        name: "David Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
        id: "8",
        name: "Lisa Anderson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
        online: true,
    },
    {
        id: "9",
        name: "Robert Taylor",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
    {
        id: "10",
        name: "Amanda Garcia",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda",
        online: true,
    },
];

export function getOnlineUsers(): User[] {
    return mockUsers.filter((user) => user.online);
}

export function getOfflineUsers(): User[] {
    return mockUsers.filter((user) => !user.online);
}

export function searchUsers(query: string): User[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return mockUsers;

    return mockUsers.filter((user) =>
        user.name.toLowerCase().includes(lowerQuery)
    );
}
