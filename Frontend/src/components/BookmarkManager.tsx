import { useState } from "react";
import { X, Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Bookmark {
    id: string;
    timestamp: number;
    label: string;
    text: string;
}

interface BookmarkManagerProps {
    bookmarks: Bookmark[];
    onAddBookmark: (bookmark: Omit<Bookmark, "id">) => void;
    onDeleteBookmark: (id: string) => void;
    onJumpToBookmark: (timestamp: number) => void;
    currentTime: number;
}

const BookmarkManager = ({
    bookmarks,
    onAddBookmark,
    onDeleteBookmark,
    onJumpToBookmark,
    currentTime,
}: BookmarkManagerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleAddBookmark = () => {
        const bookmark = {
            timestamp: currentTime,
            label: `Bookmark at ${formatTime(currentTime)}`,
            text: "Current position",
        };
        onAddBookmark(bookmark);
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(true)}
            >
                <BookmarkIcon className="w-4 h-4 mr-2" />
                Bookmarks ({bookmarks.length})
            </Button>
        );
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Bookmarks</CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button
                    variant="default"
                    className="w-full"
                    onClick={handleAddBookmark}
                >
                    <BookmarkIcon className="w-4 h-4 mr-2" />
                    Add Bookmark
                </Button>

                <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                        {bookmarks.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No bookmarks yet. Add one to save your position!
                            </p>
                        ) : (
                            bookmarks.map((bookmark) => (
                                <div
                                    key={bookmark.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                                >
                                    <button
                                        onClick={() => onJumpToBookmark(bookmark.timestamp)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="font-medium text-sm">
                                            {bookmark.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatTime(bookmark.timestamp)}
                                        </div>
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDeleteBookmark(bookmark.id)}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default BookmarkManager;
