import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Link as LinkIcon,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Loader2,
} from "lucide-react";

type LinkType = "presentation" | "document" | "video" | "other";

interface StudentLink {
  _id: Id<"projectLinks">;
  url: string;
  title: string;
  linkType: LinkType;
}

interface StudentData {
  _id: Id<"users">;
  displayName: string;
  username: string;
  batch?: string;
  links: StudentLink[];
  reflection: {
    didWell?: string;
    projectDescription?: string;
    couldImprove?: string;
    isComplete: boolean;
  } | null;
}

interface StudentProjectCardProps {
  student: StudentData;
  projectId: Id<"projects">;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function StudentProjectCard({
  student,
  projectId,
  isExpanded,
  onToggleExpand,
}: StudentProjectCardProps) {
  // Mutations
  const addLink = useMutation(api.projectLinks.add);
  const updateLink = useMutation(api.projectLinks.update);
  const removeLink = useMutation(api.projectLinks.remove);
  const updateReflection = useMutation(api.projectReflections.update);

  // Local state for new link form
  const [newLink, setNewLink] = useState({
    url: "",
    title: "",
    linkType: "other" as LinkType,
  });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<Id<"projectLinks"> | null>(
    null
  );
  const [editingLink, setEditingLink] = useState<{
    title: string;
    url: string;
    linkType: LinkType;
  }>({
    title: "",
    url: "",
    linkType: "other",
  });
  const [linkEditError, setLinkEditError] = useState("");
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);

  // Local state for reflection edits (debounced saves)
  const [localReflection, setLocalReflection] = useState({
    didWell: student.reflection?.didWell || "",
    projectDescription: student.reflection?.projectDescription || "",
    couldImprove: student.reflection?.couldImprove || "",
  });
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  // Calculate completion status
  const hasLinks = student.links.length > 0;
  const hasPartialReflection =
    !!localReflection.didWell ||
    !!localReflection.projectDescription ||
    !!localReflection.couldImprove;
  const isComplete =
    hasLinks &&
    !!localReflection.didWell &&
    !!localReflection.projectDescription &&
    !!localReflection.couldImprove;

  const handleAddLink = async () => {
    if (!newLink.url || !newLink.title) return;

    setIsSavingLink(true);
    try {
      await addLink({
        projectId,
        userId: student._id,
        url: newLink.url,
        title: newLink.title,
        linkType: newLink.linkType,
      });
      setNewLink({ url: "", title: "", linkType: "other" });
      setIsAddingLink(false);
    } catch (err) {
      console.error("Failed to add link:", err);
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleRemoveLink = async (linkId: Id<"projectLinks">) => {
    try {
      await removeLink({ linkId });
    } catch (err) {
      console.error("Failed to remove link:", err);
    }
  };

  const startEditingLink = (link: StudentLink) => {
    setEditingLinkId(link._id);
    setEditingLink({
      title: link.title,
      url: link.url,
      linkType: link.linkType,
    });
    setLinkEditError("");
  };

  const cancelEditingLink = () => {
    setEditingLinkId(null);
    setLinkEditError("");
    setIsUpdatingLink(false);
  };

  const handleSaveEditedLink = async () => {
    if (!editingLinkId) return;

    const trimmedTitle = editingLink.title.trim();
    const trimmedUrl = editingLink.url.trim();
    if (!trimmedTitle || !trimmedUrl) {
      setLinkEditError("Title and URL are required.");
      return;
    }

    setLinkEditError("");
    setIsUpdatingLink(true);
    try {
      await updateLink({
        linkId: editingLinkId,
        title: trimmedTitle,
        url: trimmedUrl,
        linkType: editingLink.linkType,
      });
      setEditingLinkId(null);
    } catch (err) {
      console.error("Failed to update link:", err);
      setLinkEditError("Failed to update link. Please try again.");
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleSaveReflection = async () => {
    setIsSavingReflection(true);
    try {
      await updateReflection({
        projectId,
        userId: student._id,
        didWell: localReflection.didWell || undefined,
        projectDescription: localReflection.projectDescription || undefined,
        couldImprove: localReflection.couldImprove || undefined,
      });
    } catch (err) {
      console.error("Failed to save reflection:", err);
    } finally {
      setIsSavingReflection(false);
    }
  };

  // Auto-save reflection on blur
  const handleReflectionBlur = () => {
    // Only save if there's actual content
    if (hasPartialReflection) {
      handleSaveReflection();
    }
  };

  const getStatusBadge = () => {
    if (isComplete) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Complete
        </Badge>
      );
    }
    if (hasPartialReflection || hasLinks) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          <Circle className="mr-1 h-3 w-3" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-500">
        <Circle className="mr-1 h-3 w-3" />
        No Data
      </Badge>
    );
  };

  const linkTypeIcons: Record<LinkType, string> = {
    presentation: "📊",
    document: "📄",
    video: "🎬",
    other: "🔗",
  };

  return (
    <Card className={isExpanded ? "ring-2 ring-primary/20" : ""}>
      {/* Header - Always visible */}
      <button
        type="button"
        className="w-full text-left flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors border-0 bg-transparent"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-label={`Toggle ${student.displayName} project details`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
            {student.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{student.displayName}</span>
              {student.batch && (
                <span className="text-xs text-muted-foreground">
                  Batch {student.batch}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {student.links.length > 0 && (
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {student.links.length} link{student.links.length !== 1 && "s"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="border-t pt-4 space-y-6">
              {/* Links Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Work Links
                </h4>

                {/* Existing Links */}
                {student.links.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {student.links.map((link) => (
                      <div
                        key={link._id}
                        className="space-y-2 p-2 bg-muted/50 rounded-lg"
                      >
                        {editingLinkId === link._id ? (
                          <>
                            <div className="grid gap-2">
                              <Input
                                aria-label="Edit link title"
                                placeholder="Link title"
                                value={editingLink.title}
                                onChange={(e) =>
                                  setEditingLink((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                aria-label="Edit link URL"
                                placeholder="URL (https://...)"
                                value={editingLink.url}
                                onChange={(e) =>
                                  setEditingLink((prev) => ({
                                    ...prev,
                                    url: e.target.value,
                                  }))
                                }
                              />
                              <Select
                                value={editingLink.linkType}
                                onValueChange={(value) =>
                                  setEditingLink((prev) => ({
                                    ...prev,
                                    linkType: value as LinkType,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="presentation">
                                    📊 Presentation
                                  </SelectItem>
                                  <SelectItem value="document">
                                    📄 Document
                                  </SelectItem>
                                  <SelectItem value="video">🎬 Video</SelectItem>
                                  <SelectItem value="other">🔗 Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {linkEditError && (
                              <p className="text-xs text-destructive">{linkEditError}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveEditedLink}
                                disabled={isUpdatingLink}
                              >
                                {isUpdatingLink && (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                )}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingLink}
                                disabled={isUpdatingLink}
                              >
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 group">
                            <span className="text-lg">
                              {linkTypeIcons[link.linkType]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {link.title}
                              </p>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {link.url.slice(0, 50)}
                                {link.url.length > 50 && "..."}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingLink(link);
                                }}
                                aria-label="Edit link"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveLink(link._id);
                                }}
                                aria-label="Delete link"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Link Form */}
                {isAddingLink ? (
                  <div className="space-y-3 p-3 border rounded-lg bg-background">
                    <Input
                      placeholder="Link title (e.g., Final Presentation)"
                      value={newLink.title}
                      onChange={(e) =>
                        setNewLink({ ...newLink, title: e.target.value })
                      }
                    />
                    <Input
                      placeholder="URL (https://...)"
                      value={newLink.url}
                      onChange={(e) =>
                        setNewLink({ ...newLink, url: e.target.value })
                      }
                    />
                    <Select
                      value={newLink.linkType}
                      onValueChange={(v) =>
                        setNewLink({ ...newLink, linkType: v as LinkType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presentation">
                          📊 Presentation
                        </SelectItem>
                        <SelectItem value="document">📄 Document</SelectItem>
                        <SelectItem value="video">🎬 Video</SelectItem>
                        <SelectItem value="other">🔗 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddLink}
                        disabled={!newLink.url || !newLink.title || isSavingLink}
                      >
                        {isSavingLink && (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        Add Link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingLink(false);
                          setNewLink({ url: "", title: "", linkType: "other" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingLink(true)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Link
                  </Button>
                )}
              </div>

              {/* Reflections Section */}
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Reflection Questions
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      What did they do well?
                    </label>
                    <Textarea
                      placeholder="Describe what this student did well..."
                      value={localReflection.didWell}
                      onChange={(e) =>
                        setLocalReflection({
                          ...localReflection,
                          didWell: e.target.value,
                        })
                      }
                      onBlur={handleReflectionBlur}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      Describe their project
                    </label>
                    <Textarea
                      placeholder="Brief description of their project..."
                      value={localReflection.projectDescription}
                      onChange={(e) =>
                        setLocalReflection({
                          ...localReflection,
                          projectDescription: e.target.value,
                        })
                      }
                      onBlur={handleReflectionBlur}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">
                      What could they improve?
                    </label>
                    <Textarea
                      placeholder="Areas for improvement..."
                      value={localReflection.couldImprove}
                      onChange={(e) =>
                        setLocalReflection({
                          ...localReflection,
                          couldImprove: e.target.value,
                        })
                      }
                      onBlur={handleReflectionBlur}
                      rows={2}
                    />
                  </div>
                </div>
                {isSavingReflection && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </p>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default StudentProjectCard;
