import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import Layout from "@/components/layout/Layout";
import BookCard from "@/components/books/BookCard";
import BookDetailModal from "@/components/books/BookDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



const Library = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [books, setBooks] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const genres = new Set(books.map(b => b.category));
    
    const uniqueGenres = Array.from(genres).filter(g => g && g !== "Unknown").sort();
    return ["All", ...uniqueGenres];
  }, [books]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await api.get("/books/", { params: { q: searchQuery } });
        const mappedBooks = response.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          cover: b.cover_image ? `http://localhost:8000/${b.cover_image}` : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
          progress: 0,
          duration: "10m",
          category: b.genre || "Unknown",
          date: new Date(b.created_at).toLocaleDateString()
        }));
        setBooks(mappedBooks);
      } catch (error) {
        console.error(error);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.get("/books/recommendations/list", {
          params: { genre: activeCategory !== "All" ? activeCategory : undefined }
        });
        const mappedBooks = response.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          cover: b.cover_image ? `http://localhost:8000/${b.cover_image}` : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
          progress: 0,
          duration: "10m",
          category: b.genre || "Unknown",
          date: new Date(b.created_at).toLocaleDateString()
        }));
        setRecommendedBooks(mappedBooks);
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      }
    };
    fetchRecommendations();
  }, [activeCategory]); 

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await api.delete(`/books/${id}`);
      setBooks(books.filter(b => b.id !== id));
    } catch (error) {
      console.error("Failed to delete book", error);
    }
  };

  const filteredBooks = books.filter((book) => {
    
    const matchesCategory = activeCategory === "All" || book.category === activeCategory;
    return matchesCategory;
  });

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Your <span className="text-gradient">Library</span>
            </h1>
            <p className="text-muted-foreground">
              Browse and discover your audiobook collection
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            {}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            {}
            <div className="flex gap-2 overflow-x-auto pb-2 items-center">
              {categories.slice(0, 5).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}

              {categories.length > 5 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      More <span className="ml-1">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {categories.slice(5).map((category) => (
                      <DropdownMenuItem
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={activeCategory === category ? "bg-accent" : ""}
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {}
          </motion.div>

          {}
          {recommendedBooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                Recommended for You
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {recommendedBooks.map((book: any, index: number) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-shrink-0 w-40"
                  >
                    <BookCard
                      {...book}
                      onClick={() => navigate(`/player/${book.id}`)}
                      className="h-full text-sm"
                      variant="compact"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-4"
          >
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              All Books
            </h2>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BookCard
                  {...book}
                  onReadMore={() => {
                    setSelectedBookId(book.id);
                    setShowDetailModal(true);
                  }}
                  onClick={() => navigate(`/player/${book.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>

          {}
          {filteredBooks.length === 0 && (
            <div className="text-center py-16">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                No books found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </section>
      <BookDetailModal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        bookId={selectedBookId as number}
      />
    </Layout>
  );
};

export default Library;
