import { useState, useEffect } from "react";
import api from "@/lib/api";
import { X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
}

interface QuizProps {
    bookId: number;
    bookTitle: string;
    onClose: () => void;
}

const Quiz = ({ bookId, bookTitle, onClose }: QuizProps) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [answered, setAnswered] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                
                
                const response = await api.get(`/books/${bookId}/quiz`);
                setQuestions(response.data);
            } catch (error) {
                console.error("Failed to fetch quiz", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [bookId]);

    if (loading) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] text-white">Generating Quiz...</div>;
    if (questions.length === 0) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"><Card className="w-full max-w-md p-6 text-center"><h3 className="text-xl font-bold mb-4">No Quiz Available</h3><p className="mb-4">Could not generate a quiz from this text.</p><Button onClick={onClose}>Close</Button></Card></div>;

    const handleAnswerSelect = (answerIndex: number) => {
        if (answered) return;

        setSelectedAnswer(answerIndex);
        setAnswered(true);

        if (answerIndex === questions[currentQuestion].correctAnswer) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setAnswered(false);
        } else {
            setShowResult(true);
            
            try {
                
                
                
                
                
                
                api.post(`/books/${bookId}/quiz/result`, {
                    score: score,
                    total: questions.length
                }).catch(err => console.error("Failed to submit quiz result", err));
            } catch (e) { console.error(e); }
        }
    };

    const handleRestart = () => {
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setScore(0);
        setShowResult(false);
        setAnswered(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
            <Card className="w-full max-w-2xl bg-background border-border">
                <CardContent className="p-6">
                    {}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Quiz: {bookTitle}</h2>
                            <p className="text-sm text-muted-foreground">
                                Test your understanding of what you've listened to
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="hover-lift"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {!showResult ? (
                        <>
                            {/* Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                                    <span>Score: {score}/{questions.length}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-foreground h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Question */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">
                                    {questions[currentQuestion].question}
                                </h3>

                                {/* Options */}
                                <div className="space-y-3">
                                    {questions[currentQuestion].options.map((option, index) => {
                                        const isCorrect = index === questions[currentQuestion].correctAnswer;
                                        const isSelected = selectedAnswer === index;
                                        const showFeedback = answered;

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleAnswerSelect(index)}
                                                disabled={answered}
                                                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${!showFeedback
                                                    ? 'border-border hover:border-foreground hover:bg-secondary'
                                                    : isCorrect
                                                        ? 'border-green-500 bg-green-50'
                                                        : isSelected
                                                            ? 'border-red-500 bg-red-50'
                                                            : 'border-border'
                                                    } ${answered ? 'cursor-not-allowed' : 'cursor-pointer hover-lift'}`}
                                                style={
                                                    showFeedback && isCorrect
                                                        ? { backgroundColor: 'hsl(45 93% 95%)', borderColor: 'hsl(45 93% 58%)' }
                                                        : {}
                                                }
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-foreground">{option}</span>
                                                    {showFeedback && isCorrect && (
                                                        <CheckCircle className="h-5 w-5" style={{ color: 'hsl(45 93% 58%)' }} />
                                                    )}
                                                    {showFeedback && isSelected && !isCorrect && (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Next Button */}
                            {answered && (
                                <Button
                                    onClick={handleNext}
                                    className="w-full hover-lift"
                                    size="lg"
                                >
                                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                                </Button>
                            )}
                        </>
                    ) : (
                        /* Results */
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <div
                                    className="text-6xl font-bold mb-2"
                                    style={{ color: score >= questions.length * 0.7 ? 'hsl(45 93% 58%)' : 'inherit' }}
                                >
                                    {score}/{questions.length}
                                </div>
                                <p className="text-xl text-foreground mb-2">
                                    {score >= questions.length * 0.7
                                        ? '🎉 Great job!'
                                        : score >= questions.length * 0.5
                                            ? '👍 Good effort!'
                                            : '📚 Keep listening!'}
                                </p>
                                <p className="text-muted-foreground">
                                    You got {Math.round((score / questions.length) * 100)}% correct
                                </p>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <Button onClick={handleRestart} variant="outline" className="hover-lift">
                                    Try Again
                                </Button>
                                <Button onClick={onClose} className="hover-lift">
                                    Continue Listening
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Quiz;
