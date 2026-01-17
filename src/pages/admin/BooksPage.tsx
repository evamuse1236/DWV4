import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  BookOpen,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

type Book = {
  _id: string;
  title: string;
  author: string;
  genre?: string;
  gradeLevel?: string;
  description?: string;
  coverImageUrl?: string;
  readingUrl?: string;
  pageCount?: number;
  isPrePopulated?: boolean;
};

const emptyBookForm = {
  title: "",
  author: "",
  genre: "",
  gradeLevel: "",
  description: "",
  coverImageUrl: "",
  readingUrl: "",
  pageCount: "",
};

type BookFormState = typeof emptyBookForm;

// Extracted outside component to prevent re-creation on every render
function BookFormFields({
  bookForm,
  setBookForm,
  error,
}: {
  bookForm: BookFormState;
  setBookForm: (form: BookFormState) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Title *</label>
          <Input
            placeholder="Book title"
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Author *</label>
          <Input
            placeholder="Author name"
            value={bookForm.author}
            onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Genre</label>
          <Input
            placeholder="e.g., Fiction, Science"
            value={bookForm.genre}
            onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Grade Level</label>
          <Input
            placeholder="e.g., 3-5, Middle School"
            value={bookForm.gradeLevel}
            onChange={(e) => setBookForm({ ...bookForm, gradeLevel: e.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="Brief description of the book"
            value={bookForm.description}
            onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Cover Image URL</label>
          <Input
            placeholder="https://..."
            value={bookForm.coverImageUrl}
            onChange={(e) => setBookForm({ ...bookForm, coverImageUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Reading URL</label>
          <Input
            placeholder="Link to read the book online"
            value={bookForm.readingUrl}
            onChange={(e) => setBookForm({ ...bookForm, readingUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Page Count</label>
          <Input
            type="number"
            placeholder="e.g., 250"
            value={bookForm.pageCount}
            onChange={(e) => setBookForm({ ...bookForm, pageCount: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Books Management Page
 * Add, edit, and delete books in the reading library
 */
export function BooksPage() {
  const books = useQuery(api.books.getAll);
  const createBook = useMutation(api.books.create);
  const updateBook = useMutation(api.books.update);
  const removeBook = useMutation(api.books.remove);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [bookForm, setBookForm] = useState(emptyBookForm);

  // Get unique genres for filter
  const genres = books
    ? [...new Set(books.map((b: any) => b.genre).filter(Boolean))]
    : [];

  // Filter books
  const filteredBooks = books?.filter((book: any) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      filterGenre === "all" || book.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });

  const resetForm = () => {
    setBookForm(emptyBookForm);
    setError(null);
  };

  const handleCreateBook = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await createBook({
        title: bookForm.title,
        author: bookForm.author,
        genre: bookForm.genre || undefined,
        gradeLevel: bookForm.gradeLevel || undefined,
        description: bookForm.description || undefined,
        coverImageUrl: bookForm.coverImageUrl || undefined,
        readingUrl: bookForm.readingUrl || undefined,
      });

      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      setError("An error occurred while adding the book");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (book: Book) => {
    setSelectedBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre || "",
      gradeLevel: book.gradeLevel || "",
      description: book.description || "",
      coverImageUrl: book.coverImageUrl || "",
      readingUrl: book.readingUrl || "",
      pageCount: book.pageCount?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateBook = async () => {
    if (!selectedBook) return;
    setIsLoading(true);
    setError(null);

    try {
      await updateBook({
        bookId: selectedBook._id as any,
        title: bookForm.title,
        author: bookForm.author,
        genre: bookForm.genre || undefined,
        gradeLevel: bookForm.gradeLevel || undefined,
        description: bookForm.description || undefined,
        coverImageUrl: bookForm.coverImageUrl || undefined,
        readingUrl: bookForm.readingUrl || undefined,
        pageCount: bookForm.pageCount ? parseInt(bookForm.pageCount) : undefined,
      });

      setIsEditDialogOpen(false);
      setSelectedBook(null);
      resetForm();
    } catch (err) {
      setError("An error occurred while updating the book");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (book: Book) => {
    setSelectedBook(book);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    setIsLoading(true);

    try {
      await removeBook({ bookId: selectedBook._id as any });
      setIsDeleteDialogOpen(false);
      setSelectedBook(null);
    } catch (err) {
      setError("An error occurred while deleting the book");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Book Library</h1>
          <p className="text-muted-foreground">
            Manage the reading collection for students
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Add a book to the reading library for students to explore.
              </DialogDescription>
            </DialogHeader>
            <BookFormFields bookForm={bookForm} setBookForm={setBookForm} error={error} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateBook}
                disabled={isLoading || !bookForm.title || !bookForm.author}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Book
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedBook(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update the book details.
            </DialogDescription>
          </DialogHeader>
          <BookFormFields bookForm={bookForm} setBookForm={setBookForm} error={error} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBook}
              disabled={isLoading || !bookForm.title || !bookForm.author}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBook?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBook} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((genre: any) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary">
                {filteredBooks?.length || 0} books
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBooks && filteredBooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book: any) => (
                  <TableRow key={book._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {book.coverImageUrl ? (
                          <img
                            src={book.coverImageUrl}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{book.title}</p>
                          {book.isPrePopulated && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.author}
                    </TableCell>
                    <TableCell>
                      {book.genre && (
                        <Badge variant="outline">{book.genre}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.gradeLevel || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {book.readingUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={book.readingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(book)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(book)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              {searchQuery || filterGenre !== "all" ? (
                <>
                  <p className="text-muted-foreground">No books found</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterGenre("all");
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No books yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add books to the library for students to read
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Book
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BooksPage;
