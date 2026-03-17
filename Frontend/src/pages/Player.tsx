import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, RotateCcw, RotateCw, RefreshCcw } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import Quiz from "@/components/Quiz";
import BookmarkManager from "@/components/BookmarkManager";
import EsewaPaymentModal from "@/components/books/EsewaPaymentModal";
import ReviewSection from "@/components/books/ReviewSection";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Player = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(70);
    const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem("preferredVoice") || "voice1");
    const [playbackSpeed, setPlaybackSpeed] = useState("1.0");
    const [showQuiz, setShowQuiz] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [bookmarks, setBookmarks] = useState<Array<{ id: string; timestamp: number; label: string; text: string }>>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const currentTimeRef = useRef(0);
    const resumeTimeRef = useRef(0);

    const { id } = useParams();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentBook, setCurrentBook] = useState<any>(null);
    const [bookText, setBookText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [duration, setDuration] = useState(0);
    const [alignment, setAlignment] = useState<Array<{ start: number; end: number; text: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQuizPrompt, setShowQuizPrompt] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);



    const chunks = useMemo(() => {
        if (alignment.length > 0) {
            return alignment;
        }

        const textToProcess = isPurchased ? bookText : bookText.slice(0, 5000);
        return textToProcess.split(' ').map(w => ({ text: w, start: 0, end: 0 }));
    }, [bookText, alignment, isPurchased]);

    const activeIndex = useMemo(() => {
        if (chunks.length === 0 || duration === 0) return -1;
        let index = -1;
        if (alignment.length > 0) {
            for (let i = 0; i < chunks.length; i++) {
                if (currentTime >= chunks[i].start) index = i;
                else break;
            }
        } else {
            index = Math.floor((currentTime / duration) * chunks.length);
        }
        return Math.max(0, Math.min(index, chunks.length - 1));
    }, [currentTime, chunks, duration, alignment]);

    useEffect(() => {
        if (activeIndex >= 0) {
            const el = document.getElementById(`chunk-${activeIndex}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeIndex]);

    const lastSavedTime = useRef(0);
    const saveProgress = async (time: number, completed: boolean = false) => {
        if (!id || (time === 0 && duration > 0 && !completed)) return;
        try {
            await api.post(`/books/${id}/progress`, { last_timestamp: time, is_completed: completed });
            lastSavedTime.current = time;
            if (completed) toast.success("Book Completed! +1 Book Read");
        } catch (e) { console.error("Save progress failed", e); }
    };

    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                if (Math.abs(currentTimeRef.current - lastSavedTime.current) > 5) saveProgress(currentTimeRef.current);
            }, 10000);
            return () => clearInterval(interval);
        } else if (currentTimeRef.current > 0) {
            saveProgress(currentTimeRef.current);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
            else audioRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = parseFloat(playbackSpeed);
    }, [playbackSpeed]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume / 100;
    }, [volume]);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const bookRes = await api.get(`/books/${id}`);
                const progRes = await api.get(`/books/${id}/progress`);
                const bookmarksRes = await api.get(`/books/${id}/bookmarks`);

                setBookmarks(bookmarksRes.data);
                const savedTime = progRes.data.last_timestamp || 0;
                setCurrentTime(savedTime);
                resumeTimeRef.current = savedTime;

                const token = localStorage.getItem("token");
                const audioUrl = `http://localhost:8000/api/v1/books/${id}/audio?voice=${selectedVoice}${token ? `&token=${token}` : ''}`;
                const cover = bookRes.data.cover_image
                    ? `http://localhost:8000/${bookRes.data.cover_image}`
                    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800";

                setCurrentBook({ ...bookRes.data, cover, audioUrl });

                // Check purchase status
                try {
                    const statusRes = await api.get(`/payments/status/${id}`);
                    setIsPurchased(statusRes.data.purchased);
                } catch (e) {
                    console.error("Failed to check purchase status", e);
                }

                // Trigger audio generation in background (DO NOT AWAIT)
                api.post(`/books/${id}/audio`, { voice: selectedVoice }).catch(e => console.error("Background audio trigger failed", e));

                setIsGeneratingText(true);
                setLoading(false); // Set loading(false) here so UI appears while text is fetched
                
                try {
                    const alignRes = await api.get(`/books/${id}/alignment`, { params: { voice: selectedVoice } });
                    if (alignRes.data && alignRes.data.length > 0) {
                        setAlignment(alignRes.data);
                    } else {
                        const textRes = await api.get(`/books/${id}/text`);
                        setBookText(textRes.data.text || "");
                    }
                } catch (e) {
                    const textRes = await api.get(`/books/${id}/text`);
                    setBookText(textRes.data.text || "");
                } finally {
                    setIsGeneratingText(false);
                }
            } catch (e) {
                console.error("LOAD ERROR:", e);
                setError("Failed to load book data");
                setLoading(false);
            }
        };
        load();
    }, [id, selectedVoice]);

    const formatTime = (time: number) => {
        if (isNaN(time) || time < 0) return "0:00";
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="min-h-screen gradient-hero flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-foreground">Loading your book...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <p className="text-red-500 text-xl mb-4">{error}</p>
                <Button onClick={() => window.location.href = '/library'}>
                    Return to Library
                </Button>
            </div>
        </div>
    );

    if (!currentBook) return null;

    return (
        <div className="min-h-screen pb-48 bg-background">
            <Navigation />
            <div className="container mx-auto px-6 pt-32 max-w-6xl">
                <div className="grid md:grid-cols-3 gap-12">
                    { }
                    <div className="md:col-span-1 space-y-6">
                        <Card className="overflow-hidden bg-card/50 border-border/50">
                            <CardContent className="p-6">
                                <div className="aspect-[2/3] rounded-lg overflow-hidden mb-6 glow">
                                    <img src={currentBook.cover} alt={currentBook.title} className="w-full h-full object-cover" />
                                </div>
                                <h2 className="text-2xl font-bold mb-1">{currentBook.title}</h2>
                                <p className="text-muted-foreground mb-4">{currentBook.author}</p>
                                <Badge variant="secondary">{currentBook.chapter}</Badge>

                                <div className="mt-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Voice</label>
                                        <Select value={selectedVoice} onValueChange={async (v) => {
                                            if (audioRef.current) resumeTimeRef.current = audioRef.current.currentTime;
                                            setSelectedVoice(v);
                                            localStorage.setItem("preferredVoice", v);
                                            setIsPlaying(false);
                                            setIsGenerating(true);
                                            try {
                                                await api.post(`/books/${id}/audio`, { voice: v });
                                                const alRes = await api.get(`/books/${id}/alignment`, { params: { voice: v } });
                                                if (alRes.data) setAlignment(alRes.data);
                                                if (audioRef.current) {
                                                    const token = localStorage.getItem("token");
                                                    audioRef.current.src = `http://localhost:8000/api/v1/books/${id}/audio?voice=${v}${token ? `&token=${token}` : ''}&t=${Date.now()}`;
                                                    audioRef.current.load();
                                                }
                                            } catch (e) { console.error(e); } finally { setIsGenerating(false); }
                                        }}>
                                            <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="voice1">Ava (Female - Modern)</SelectItem>
                                                <SelectItem value="voice2">Andrew (Male)</SelectItem>
                                                <SelectItem value="voice3">Brian (Deep Male)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Speed</label>
                                        <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                                            <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["0.5", "0.75", "1.0", "1.25", "1.5", "2.0"].map(s => <SelectItem key={s} value={s}>{s}x</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <BookmarkManager
                                        bookmarks={bookmarks}
                                        currentTime={currentTime}
                                        onAddBookmark={async (b) => {
                                            const res = await api.post(`/books/${id}/bookmarks`, { label: b.label, timestamp: b.timestamp });
                                            setBookmarks([...bookmarks, res.data]);
                                            setShowQuizPrompt(true);
                                        }}
                                        onDeleteBookmark={async (bid) => {
                                            await api.delete(`/books/${id}/bookmarks/${bid}`);
                                            setBookmarks(bookmarks.filter(x => x.id !== bid));
                                        }}
                                        onJumpToBookmark={(t) => {
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = t;
                                                setCurrentTime(t);
                                                resumeTimeRef.current = 0;
                                            }
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    { }
                    <div className="md:col-span-2">
                        <Card className="h-[600px] bg-card/50 border-border/50">
                            <CardContent className="p-8 h-full overflow-y-auto prose prose-invert max-w-none scrollbar-thin scrollbar-thumb-primary/20">
                                {isGeneratingText ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                                        <p className="text-muted-foreground italic">Restoring text alignment...</p>
                                    </div>
                                ) : (
                                    <div className="text-lg leading-relaxed relative pb-20">
                                        <div className="space-y-4">
                                            {chunks.map((chunk, idx) => (
                                                <span
                                                    key={idx}
                                                    id={`chunk-${idx}`}
                                                    className={`transition-all duration-300 px-1 rounded inline-block cursor-pointer
                                                        ${idx === activeIndex
                                                            ? "bg-primary/20 text-primary-foreground shadow-sm shadow-primary/10 border-b-2 border-primary/50"
                                                            : "text-foreground/80 hover:text-foreground"
                                                        }`}
                                                    onClick={() => {
                                                        if (audioRef.current && chunk.start >= 0) {
                                                            audioRef.current.currentTime = chunk.start;
                                                            setIsPlaying(true);
                                                        }
                                                    }}
                                                >
                                                    {chunk.text}{' '}
                                                </span>
                                            ))}
                                        </div>

                                        { }
                                        {(!isPurchased && (alignment.length > 0 || bookText.length > 5000)) && (
                                            <div className="relative mt-12 py-16 border-t border-border/20">
                                                <div className="filter blur-[5px] opacity-30 select-none pointer-events-none space-y-4" aria-hidden="true">
                                                    <p>Beyond this point lies the heart of the story. The characters face their greatest challenges, and the mystery finally begins to unravel.</p>
                                                    <p>Unlock the full experience to continue listening with high-quality AI voices and synchronized text highlighting.</p>
                                                    <p>Premium members get unlimited access to all chapters and exclusive features like deep-dive quizzes and summaries.</p>
                                                </div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-background via-background/80 to-transparent p-6 text-center">
                                                    <h3 className="text-2xl font-bold mb-2 text-primary">Ready for more?</h3>
                                                    <p className="text-base font-medium text-foreground/90 mb-6 max-w-xs">
                                                        Unlock the full book with Premium to continue your listening journey.
                                                    </p>
                                                    <Button
                                                        size="lg"
                                                        className="rounded-full px-8 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                                        onClick={() => setShowPaymentModal(true)}
                                                    >
                                                        Get Premium for More
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 shadow-lg">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg">AI Companion</h3>
                                    <p className="text-sm text-muted-foreground">Test your comprehension with an AI-generated quiz based on this chapter.</p>
                                </div>
                                <Button variant="outline" className="border-primary/20 hover:bg-primary/10" onClick={() => setShowQuiz(true)}>Take Quiz</Button>
                            </CardContent>
                        </Card>

                        {/* Ratings & Reviews Section */}
                        <div id="reviews-section" className="mt-12">
                            <ReviewSection bookId={parseInt(id || "0")} />
                        </div>
                    </div>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={currentBook.audioUrl}
                loop={repeat}
                onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onCanPlay={(e) => {
                    if (resumeTimeRef.current > 0) {
                        e.currentTarget.currentTime = resumeTimeRef.current;
                        setCurrentTime(resumeTimeRef.current);
                        resumeTimeRef.current = 0;
                    }
                }}
                onTimeUpdate={(e) => {
                    const t = e.currentTarget.currentTime;
                    setCurrentTime(t);
                    currentTimeRef.current = t;
                    if (e.currentTarget.duration) setProgress((t / e.currentTarget.duration) * 100);
                }}
                onEnded={() => {
                    if (!repeat) {
                        setIsPlaying(false);


                        const isFullBook = bookText.length <= 5000;
                        saveProgress(duration, isFullBook);
                    }
                }}
            />

            { }
            <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border py-6 z-[100] shadow-2xl">
                <div className="container mx-auto px-6 max-w-6xl">
                    <Slider
                        value={[progress]}
                        onValueChange={(v) => {
                            if (audioRef.current && duration > 0) {
                                const t = (v[0] / 100) * duration;
                                audioRef.current.currentTime = t;
                                setProgress(v[0]);
                                setCurrentTime(t);
                            }
                        }}
                        className="mb-8 cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-8">
                        { }
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded overflow-hidden shadow-lg hidden sm:block h-fit">
                                <img src={currentBook.cover} alt={currentBook.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold truncate text-foreground">{currentBook.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="font-mono">{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span className="font-mono">{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>

                        { }
                        <div className="flex items-center gap-3 sm:gap-6">
                            <Button
                                size="icon"
                                variant="ghost"
                                className={`rounded-full ${repeat ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                                onClick={() => setRepeat(!repeat)}
                                title="Repeat"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </Button>

                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30); }}>
                                    <RotateCcw className="w-6 h-6" />
                                </Button>
                                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }}>
                                    <SkipBack className="w-6 h-6" />
                                </Button>
                            </div>

                            <Button
                                size="icon"
                                className={`w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${isGenerating
                                    ? "bg-slate-700/50 shadow-none scale-95"
                                    : "bg-primary shadow-primary/20 hover:bg-primary/90 hover:scale-105"
                                    }`}
                                onClick={() => setIsPlaying(!isPlaying)}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <div className="animate-spin h-7 w-7 border-3 border-white/20 border-t-white rounded-full" />
                                ) : isPlaying ? (
                                    <Pause className="w-8 h-8 fill-primary-foreground" />
                                ) : (
                                    <Play className="w-8 h-8 fill-primary-foreground ml-1" />
                                )}
                            </Button>

                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10); }}>
                                    <SkipForward className="w-6 h-6" />
                                </Button>
                                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30); }}>
                                    <RotateCw className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        { }
                        <div className="flex-1 hidden md:flex justify-end items-center gap-3">
                            <Volume2 className="w-5 h-5 text-muted-foreground" />
                            <Slider
                                value={[volume]}
                                onValueChange={(v) => setVolume(v[0])}
                                max={100}
                                className="w-28 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            { }
            {showQuizPrompt && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-primary/20 bg-card">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Badge variant="outline" className="text-primary border-primary/50 text-lg">✓</Badge>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Bookmark Added!</h3>
                            <p className="text-muted-foreground">Test your comprehension with a quick AI-generated quiz based on what you just heard.</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowQuizPrompt(false)}>Keep Listening</Button>
                            <Button className="flex-1 shadow-lg shadow-primary/20" onClick={() => { setShowQuizPrompt(false); setShowQuiz(true); setIsPlaying(false); }}>Yes, Quiz!</Button>
                        </div>
                    </Card>
                </div>
            )}
            {showQuiz && <Quiz bookId={currentBook.id!} bookTitle={currentBook.title} onClose={() => setShowQuiz(false)} />}
            {isGenerating && (
                <div className="fixed inset-0 z-[150] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-4 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Volume2 className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Generating New Voice</h3>
                        <p className="text-muted-foreground">Synthesizing audio with {selectedVoice === 'voice1' ? 'Ava' : selectedVoice === 'voice2' ? 'Andrew' : 'Brian'}...</p>
                    </div>
                </div>
            )}

            <EsewaPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                book={{
                    id: parseInt(id || "0"),
                    title: currentBook.title,
                    author: currentBook.author,
                    cover: currentBook.cover
                }}
                onSuccess={async () => {
                    setIsPurchased(true);
                    setShowPaymentModal(false);
                    toast.success("🎉 Premium Unlocked! Full content is now available.");

                    // Step 1: Immediately fetch and show full text (instant)
                    try {
                        const textRes = await api.get(`/books/${id}/text`);
                        const fullText = textRes.data.text || "";
                        setBookText(fullText);
                        // Clear alignment so the full text chunks are used for display
                        setAlignment([]);
                    } catch (e) {
                        console.error("Failed to fetch full text", e);
                    }

                    // Step 2: Silently regenerate full audio in the background (no blocking overlay)
                    toast.info("🎵 Generating full audio in the background...", { duration: 3000 });
                    api.post(`/books/${id}/audio`, { voice: selectedVoice })
                        .then(async () => {
                            // Reload alignment and audio source once done
                            const alRes = await api.get(`/books/${id}/alignment`, { params: { voice: selectedVoice } });
                            if (alRes.data && alRes.data.length > 0) setAlignment(alRes.data);

                            if (audioRef.current) {
                                const token = localStorage.getItem("token");
                                audioRef.current.src = `http://localhost:8000/api/v1/books/${id}/audio?voice=${selectedVoice}${token ? `&token=${token}` : ''}&t=${Date.now()}`;
                                audioRef.current.load();
                            }
                            toast.success("✅ Full audio ready! You can now listen to the complete book.");
                        })
                        .catch((e) => console.error("Background audio generation failed", e));
                }}
            />
        </div>
    );
};

export default Player;
