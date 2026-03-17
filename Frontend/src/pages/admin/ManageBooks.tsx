import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  cover_image?: string;
  status: "published" | "draft" | "processing";
  uploaded_at: string;
}

const ManageBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    genre: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const handleUpdateBook = async () => {
    if (!editingBook) return;

    try {
      const formData = new FormData();
      formData.append("title", editingBook.title);
      formData.append("author", editingBook.author);
      formData.append("genre", editingBook.genre);

      await api.put(`/admin/books/${editingBook.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Book updated successfully");
      setIsAddOpen(false); 
      setEditingBook(null);
      fetchBooks();
    } catch (e) {
      toast.error("Failed to update book");
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.get("/admin/books");
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      toast.error("Failed to load books");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please select a PDF file");
      }
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedCoverFile(file);
      } else {
        toast.error("Please select an image file");
      }
    }
  };

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.genre || !selectedFile) {
      toast.error("Please fill all fields and select a PDF file");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", newBook.title);
      formData.append("author", newBook.author);
      formData.append("genre", newBook.genre);
      formData.append("file", selectedFile);

      
      if (selectedCoverFile) {
        formData.append("cover", selectedCoverFile);
      }

      const response = await api.post("/admin/books", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Book uploaded successfully!");
      setNewBook({ title: "", author: "", genre: "" });
      setSelectedFile(null);
      setSelectedCoverFile(null);
      setIsAddOpen(false);
      fetchBooks(); 
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.response?.data?.detail || "Failed to upload book");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      await api.delete(`/admin/books/${id}`);
      toast.success("Book deleted successfully");
      fetchBooks();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete book");
    }
  };

  const getStatusColor = (status: Book["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-500";
      case "draft":
        return "bg-yellow-500/20 text-yellow-500";
      case "processing":
        return "bg-blue-500/20 text-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Manage Books</h1>
          <p className="text-muted-foreground">Upload and manage books in the library</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Upload Book
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Upload New Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>PDF File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : "Click to select PDF file"}
                    </p>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cover Image (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {selectedCoverFile ? selectedCoverFile.name : "Click to select cover image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      If not provided, will auto-generate from PDF
                    </p>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Enter book title"
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Enter author name"
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Input
                  value={newBook.genre}
                  onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                  placeholder="Enter genre (e.g., Fiction, Non-Fiction, Mystery)"
                />
              </div>
              <Button
                onClick={handleAddBook}
                className="w-full"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Book"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No books found. Upload your first book to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book.id} className="border-border">
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.genre}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                      {book.status}
                    </span>
                  </TableCell>
                  <TableCell>{book.uploaded_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary"
                        onClick={() => setEditingBook(book)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {}
      <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Book Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingBook?.title || ""}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Enter book title"
              />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={editingBook?.author || ""}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, author: e.target.value } : null)}
                placeholder="Enter author name"
              />
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Input
                value={editingBook?.genre || ""}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, genre: e.target.value } : null)}
                placeholder="Enter genre"
              />
            </div>
            <Button onClick={handleUpdateBook} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageBooks;
