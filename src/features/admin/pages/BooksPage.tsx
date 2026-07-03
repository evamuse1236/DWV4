import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { parseBulkPaste, parseDelimitedBookFile, type ImportBookRow, type ImportIssue } from "@/features/admin/lib/bookImport";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
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
  source?: "seed" | "admin" | "student";
  libraryStatus?: "draft" | "curated";
  needsAdminReview?: boolean;
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
      {error ? (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      ) : null}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Title *</label>
          <Input
            placeholder="Book title"
            value={bookForm.title}
            onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Author *</label>
          <Input
            placeholder="Author name"
            value={bookForm.author}
            onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Genre</label>
          <Input
            placeholder="e.g. Fiction, Science"
            value={bookForm.genre}
            onChange={(event) => setBookForm({ ...bookForm, genre: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Grade Level</label>
          <Input
            placeholder="e.g. 3-5, Middle School"
            value={bookForm.gradeLevel}
            onChange={(event) => setBookForm({ ...bookForm, gradeLevel: event.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Brief description of the book"
            value={bookForm.description}
            onChange={(event) => setBookForm({ ...bookForm, description: event.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Cover Image URL</label>
          <Input
            placeholder="https://..."
            value={bookForm.coverImageUrl}
            onChange={(event) => setBookForm({ ...bookForm, coverImageUrl: event.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Reading URL</label>
          <Input
            placeholder="Link to read the book online"
            value={bookForm.readingUrl}
            onChange={(event) => setBookForm({ ...bookForm, readingUrl: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Page Count</label>
          <Input
            type="number"
            placeholder="e.g. 250"
            value={bookForm.pageCount}
            onChange={(event) => setBookForm({ ...bookForm, pageCount: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function buildImportSummary(rows: ImportBookRow[], issues: ImportIssue[]) {
  if (rows.length === 0 && issues.length === 0) return null;
  return {
    accepted: rows.length,
    issues,
  };
}

export function BooksPage() {
  const { token } = useAuth();
  const books = (useQuery(api.books.getAll) as Book[] | undefined) ?? [];
  const createBook = useMutation(api.books.create);
  const updateBook = useMutation(api.books.update);
  const removeBook = useMutation(api.books.remove);
  const bulkImport = useMutation(api.books.bulkImport);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterCuration, setFilterCuration] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"paste" | "upload">("paste");
  const [pasteInput, setPasteInput] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [preparedRows, setPreparedRows] = useState<ImportBookRow[]>([]);
  const [preparedIssues, setPreparedIssues] = useState<ImportIssue[]>([]);
  const [bookForm, setBookForm] = useState(emptyBookForm);

  const genres = useMemo(
    () => [...new Set(books.map((book) => book.genre).filter(Boolean) as string[])],
    [books]
  );

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const normalizedSearch = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        book.title.toLowerCase().includes(normalizedSearch) ||
        book.author.toLowerCase().includes(normalizedSearch);
      const matchesGenre = filterGenre === "all" || book.genre === filterGenre;
      const matchesCuration =
        filterCuration === "all" ||
        (filterCuration === "needs_review" && Boolean(book.needsAdminReview)) ||
        (filterCuration === "draft" && book.libraryStatus === "draft") ||
        (filterCuration === "curated" && book.libraryStatus !== "draft" && !book.needsAdminReview);
      return matchesSearch && matchesGenre && matchesCuration;
    });
  }, [books, filterCuration, filterGenre, searchQuery]);

  const needsReviewCount = books.filter((book) => book.needsAdminReview).length;
  const draftCount = books.filter((book) => book.libraryStatus === "draft").length;
  const importSummary = buildImportSummary(preparedRows, preparedIssues);

  const resetForm = () => {
    setBookForm(emptyBookForm);
    setError(null);
  };

  const resetImportState = () => {
    setPasteInput("");
    setSelectedFileName("");
    setPreparedRows([]);
    setPreparedIssues([]);
    setImportError(null);
    setImportMode("paste");
  };

  const handleCreateBook = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      await createBook({
        adminToken: token,
        title: bookForm.title,
        author: bookForm.author,
        genre: bookForm.genre || undefined,
        gradeLevel: bookForm.gradeLevel || undefined,
        description: bookForm.description || undefined,
        coverImageUrl: bookForm.coverImageUrl || undefined,
        readingUrl: bookForm.readingUrl || undefined,
        pageCount: bookForm.pageCount ? Number(bookForm.pageCount) : undefined,
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch {
      setError("An error occurred while adding the book.");
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
    if (!selectedBook || !token) return;
    setIsLoading(true);
    setError(null);

    try {
      await updateBook({
        adminToken: token,
        bookId: selectedBook._id as any,
        title: bookForm.title,
        author: bookForm.author,
        genre: bookForm.genre || undefined,
        gradeLevel: bookForm.gradeLevel || undefined,
        description: bookForm.description || undefined,
        coverImageUrl: bookForm.coverImageUrl || undefined,
        readingUrl: bookForm.readingUrl || undefined,
        pageCount: bookForm.pageCount ? Number(bookForm.pageCount) : undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedBook(null);
      resetForm();
    } catch {
      setError("An error occurred while updating the book.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook || !token) return;
    setIsLoading(true);
    try {
      await removeBook({ adminToken: token, bookId: selectedBook._id as any });
      setIsDeleteDialogOpen(false);
      setSelectedBook(null);
    } catch {
      setError("An error occurred while deleting the book.");
    } finally {
      setIsLoading(false);
    }
  };

  const preparePasteImport = () => {
    const { rows, invalidRows } = parseBulkPaste(pasteInput);
    setPreparedRows(rows);
    setPreparedIssues(invalidRows);
    setImportError(rows.length === 0 ? "No valid rows were found in the pasted text." : null);
  };

  const prepareDelimitedFileImport = async (file: File | undefined) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setImportError(null);
    try {
      const { rows, invalidRows } = await parseDelimitedBookFile(file);
      setPreparedRows(rows);
      setPreparedIssues(invalidRows);
      if (rows.length === 0) {
        setImportError("No valid rows were found in that file.");
      }
    } catch {
      setPreparedRows([]);
      setPreparedIssues([]);
      setImportError("That file could not be read. Try a CSV or TSV export.");
    }
  };

  const handleRunImport = async () => {
    if (!token) return;
    if (preparedRows.length === 0) {
      setImportError("Add some valid rows before importing.");
      return;
    }

    setIsLoading(true);
    setImportError(null);
    try {
      const result = (await bulkImport({
        adminToken: token,
        rows: preparedRows.map((row) => ({
          title: row.title,
          author: row.author,
          genre: row.genre,
          gradeLevel: row.gradeLevel,
          description: row.description,
          coverImageUrl: row.coverImageUrl,
          readingUrl: row.readingUrl,
          pageCount: row.pageCount,
        })),
      })) as {
        createdCount: number;
        updatedCount: number;
        unchangedCount: number;
        invalidRows: ImportIssue[];
      };

      setPreparedIssues([...preparedIssues, ...result.invalidRows]);
      setPreparedRows([]);
      setPasteInput("");
      setSelectedFileName("");
      setImportError(
        `Imported ${result.createdCount} new books, updated ${result.updatedCount}, left ${result.unchangedCount} unchanged.`
      );
    } catch {
      setImportError("The import failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Manage
          </p>
          <h1>Book Library</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Curate the student library, clean up drafts, and bulk-add existing books without
            one-by-one pain.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pb-1">
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={(open) => {
              setIsImportDialogOpen(open);
              if (!open) resetImportState();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Books</DialogTitle>
                <DialogDescription>
                  Paste `Title - Author` rows or upload a CSV/TSV export. Existing matches are updated only where details are missing.
                </DialogDescription>
              </DialogHeader>

              <Tabs value={importMode} onValueChange={(value) => setImportMode(value as "paste" | "upload")}>
                <TabsList>
                  <TabsTrigger value="paste">Paste list</TabsTrigger>
                  <TabsTrigger value="upload">Upload file</TabsTrigger>
                </TabsList>
                <TabsContent value="paste" className="space-y-4">
                  <Textarea
                    value={pasteInput}
                    onChange={(event) => setPasteInput(event.target.value)}
                    placeholder={"Charlotte's Web - E.B. White\nThe Hobbit - J.R.R. Tolkien"}
                    className="min-h-[220px]"
                  />
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={preparePasteImport}>
                      Preview Paste Import
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="space-y-4">
                  <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6">
                    <label className="flex cursor-pointer flex-col items-center gap-3 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Upload CSV or TSV</p>
                        <p className="text-sm text-muted-foreground">Required columns: title, author. Optional columns match the current book fields.</p>
                      </div>
                      <Input
                        type="file"
                        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                        className="max-w-sm"
                        onChange={(event) => void prepareDelimitedFileImport(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                  {selectedFileName ? (
                    <p className="text-sm text-muted-foreground">Selected file: {selectedFileName}</p>
                  ) : null}
                </TabsContent>
              </Tabs>

              {importSummary ? (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{importSummary.accepted} ready to import</Badge>
                    <Badge variant={importSummary.issues.length > 0 ? "outline" : "secondary"}>
                      {importSummary.issues.length} issues
                    </Badge>
                  </div>
                  {importSummary.issues.length > 0 ? (
                    <div className="max-h-32 overflow-auto text-sm text-muted-foreground space-y-1">
                      {importSummary.issues.map((issue) => (
                        <p key={`${issue.rowNumber}-${issue.reason}`}>Row {issue.rowNumber}: {issue.reason}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {importError ? (
                <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{importError}</div>
              ) : null}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => void handleRunImport()} disabled={isLoading || preparedRows.length === 0}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Import Books
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogDescription>Add a curated book directly to the shared library.</DialogDescription>
              </DialogHeader>
              <BookFormFields bookForm={bookForm} setBookForm={setBookForm} error={error} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void handleCreateBook()} disabled={isLoading || !bookForm.title || !bookForm.author}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Book
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total books</p>
            <p className="mt-2 text-3xl font-semibold">{books.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Needs admin review</p>
            <p className="mt-2 text-3xl font-semibold">{needsReviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Draft entries</p>
            <p className="mt-2 text-3xl font-semibold">{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedBook(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Saving changes also marks the book as curated.</DialogDescription>
          </DialogHeader>
          <BookFormFields bookForm={bookForm} setBookForm={setBookForm} error={error} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleUpdateBook()} disabled={isLoading || !bookForm.title || !bookForm.author}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{selectedBook?.title}"? This also removes any student records tied to it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteBook()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCuration} onValueChange={setFilterCuration}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All curation states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  <SelectItem value="needs_review">Needs review</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="curated">Curated</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">{filteredBooks.length} books</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {book.coverImageUrl ? (
                          <img src={book.coverImageUrl} alt={book.title} className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="font-medium">{book.title}</p>
                          <div className="flex flex-wrap gap-1">
                            {book.isPrePopulated ? <Badge variant="secondary">Default</Badge> : null}
                            {book.needsAdminReview ? <Badge variant="outline">Needs review</Badge> : null}
                            {book.libraryStatus === "draft" ? <Badge variant="outline">Draft</Badge> : null}
                            {book.source === "student" ? <Badge variant="secondary">Student added</Badge> : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{book.author}</TableCell>
                    <TableCell>
                      {book.needsAdminReview ? (
                        <span className="text-sm text-amber-700">Needs enrichment</span>
                      ) : (
                        <span className="text-sm text-emerald-700">Curated</span>
                      )}
                    </TableCell>
                    <TableCell>{book.genre ? <Badge variant="outline">{book.genre}</Badge> : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{book.gradeLevel || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {book.readingUrl ? (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={book.readingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(book)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBook(book);
                            setIsDeleteDialogOpen(true);
                          }}
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
              {searchQuery || filterGenre !== "all" || filterCuration !== "all" ? (
                <>
                  <p className="text-muted-foreground">No books match those filters.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterGenre("all");
                      setFilterCuration("all");
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No books yet.</p>
                  <p className="text-sm text-muted-foreground mb-4">Add a curated book or bulk import your existing library.</p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Book
                    </Button>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Bulk Import
                    </Button>
                  </div>
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
