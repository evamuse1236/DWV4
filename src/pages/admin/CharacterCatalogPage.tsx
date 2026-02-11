import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rarityTone } from "@/lib/character-utils";

type Rarity = "common" | "rare" | "epic" | "legendary";

type CardFormState = {
  name: string;
  slug: string;
  description: string;
  unlockLevel: string;
  rarity: Rarity;
  domainAffinityId: string;
  displayOrder: string;
  isActive: boolean;
  imageFile: File | null;
};

const defaultFormState: CardFormState = {
  name: "",
  slug: "",
  description: "",
  unlockLevel: "1",
  rarity: "common",
  domainAffinityId: "__none",
  displayOrder: "",
  isActive: true,
  imageFile: null,
};

async function uploadCardImage(
  generateTarotUploadUrl: ReturnType<typeof useMutation>,
  file: File
) {
  const { uploadUrl } = await generateTarotUploadUrl({});
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error(`Image upload failed (${uploadRes.status}).`);
  }
  const uploadJson = await uploadRes.json();
  if (!uploadJson?.storageId) {
    throw new Error("Upload response missing storage id.");
  }
  return String(uploadJson.storageId);
}

function toMutationArgs(form: CardFormState) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim() || undefined,
    unlockLevel: Math.max(1, Number(form.unlockLevel || 1)),
    rarity: form.rarity,
    domainAffinityId:
      form.domainAffinityId && form.domainAffinityId !== "__none"
        ? (form.domainAffinityId as any)
        : undefined,
    displayOrder:
      form.displayOrder.trim() === ""
        ? undefined
        : Math.max(0, Number(form.displayOrder)),
    isActive: form.isActive,
  };
}

export function CharacterCatalogPage() {
  const catalog = useQuery(api.character.getTarotCatalog);
  const domains = useQuery(api.domains.getAll);

  const generateTarotUploadUrl = useMutation(api.character.generateTarotUploadUrl);
  const createTarotCard = useMutation(api.character.createTarotCard);
  const updateTarotCard = useMutation(api.character.updateTarotCard);
  const archiveTarotCard = useMutation(api.character.archiveTarotCard);

  const [form, setForm] = useState<CardFormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editCard, setEditCard] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<CardFormState>(defaultFormState);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const orderedDomains = useMemo(
    () => (domains ? [...domains].sort((a, b) => a.order - b.order) : []),
    [domains]
  );

  const resetCreateForm = () => {
    setForm(defaultFormState);
    setError(null);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.imageFile) {
      setError("Card image is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const imageStorageId = await uploadCardImage(generateTarotUploadUrl, form.imageFile);
      await createTarotCard({
        ...toMutationArgs(form),
        imageStorageId: imageStorageId as any,
      });
      resetCreateForm();
    } catch (err: any) {
      setError(err?.message || "Failed to create tarot card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (card: any) => {
    setEditCard(card);
    setEditError(null);
    setEditForm({
      name: card.name || "",
      slug: card.slug || "",
      description: card.description || "",
      unlockLevel: String(card.unlockLevel ?? 1),
      rarity: card.rarity || "common",
      domainAffinityId: card.domainAffinityId || "__none",
      displayOrder: String(card.displayOrder ?? 0),
      isActive: card.isActive !== false,
      imageFile: null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editCard) return;
    if (!editForm.name.trim()) {
      setEditError("Name is required.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      let imageStorageId: string | undefined;
      if (editForm.imageFile) {
        imageStorageId = await uploadCardImage(
          generateTarotUploadUrl,
          editForm.imageFile
        );
      }

      await updateTarotCard({
        tarotCardId: editCard._id,
        ...toMutationArgs(editForm),
        imageStorageId: imageStorageId as any,
      });
      setEditCard(null);
    } catch (err: any) {
      setEditError(err?.message || "Failed to save tarot card.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleArchive = async (tarotCardId: string) => {
    await archiveTarotCard({ tarotCardId: tarotCardId as any });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold">Character Catalog</h1>
        <p className="text-muted-foreground">
          Manage tarot cards and level unlock thresholds.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Tarot Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="The Initiate"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (optional)</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="the-initiate"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unlock Level</label>
              <Input
                type="number"
                min={1}
                value={form.unlockLevel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, unlockLevel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayOrder: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rarity</label>
              <Select
                value={form.rarity}
                onValueChange={(value: Rarity) =>
                  setForm((prev) => ({ ...prev, rarity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain Affinity</label>
              <Select
                value={form.domainAffinityId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, domainAffinityId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {orderedDomains.map((domain: any) => (
                    <SelectItem key={domain._id} value={domain._id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Card lore and meaning"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Card Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  imageFile: e.currentTarget.files?.[0] || null,
                }))
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
            />
            Active
          </label>

          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Card"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {catalog === undefined ? (
            <p className="text-sm text-muted-foreground">Loading catalog...</p>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tarot cards yet. Create the first one above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {catalog.map((card: any) => (
                <article
                  key={card._id}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="h-48 bg-muted">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{card.name}</p>
                      <Badge variant="outline" className={rarityTone(card.rarity)}>
                        {card.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lv. {card.unlockLevel} • Order {card.displayOrder}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {card.description || "No description"}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(card)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!card.isActive}
                        onClick={() => handleArchive(card._id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editCard)} onOpenChange={(open) => !open && setEditCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tarot Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {editError ? (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={editForm.slug}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, slug: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unlock Level</label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.unlockLevel}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, unlockLevel: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Order</label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.displayOrder}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, displayOrder: e.target.value }))
                  }
                  />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rarity</label>
                <Select
                  value={editForm.rarity}
                  onValueChange={(value: Rarity) =>
                    setEditForm((prev) => ({ ...prev, rarity: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain Affinity</label>
                <Select
                  value={editForm.domainAffinityId}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, domainAffinityId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {orderedDomains.map((domain: any) => (
                      <SelectItem key={domain._id} value={domain._id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Replace Image (optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    imageFile: e.currentTarget.files?.[0] || null,
                  }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              Active
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCard(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CharacterCatalogPage;
