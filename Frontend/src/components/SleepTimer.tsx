import { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SleepTimerProps {
    onTimerEnd: () => void;
}

const SleepTimer = ({ onTimerEnd }: SleepTimerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedTime, setSelectedTime] = useState("15");

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsActive(false);
                    onTimerEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onTimerEnd]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const startTimer = () => {
        const minutes = parseInt(selectedTime);
        setTimeLeft(minutes * 60);
        setIsActive(true);
    };

    const stopTimer = () => {
        setIsActive(false);
        setTimeLeft(0);
    };

    if (!isOpen) {
        return (
            <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setIsOpen(true)}
            >
                <Clock className="w-4 h-4 mr-2" />
                {isActive ? formatTime(timeLeft) : "Sleep Timer"}
            </Button>
        );
    }

    return (
        <Card className="absolute bottom-24 right-4 w-80 bg-card border-border shadow-lg z-50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Sleep Timer</CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isActive ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">
                                Set timer duration
                            </label>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 minutes</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={startTimer} className="w-full">
                            Start Timer
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="text-center py-4">
                            <div className="text-4xl font-bold text-primary mb-2">
                                {formatTime(timeLeft)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Playback will pause when timer ends
                            </p>
                        </div>
                        <Button onClick={stopTimer} variant="destructive" className="w-full">
                            Cancel Timer
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default SleepTimer;
