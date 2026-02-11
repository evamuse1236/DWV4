import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizeCharacterDomainLabel,
  rarityTone,
} from "@/lib/character-utils";

function CharacterSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-48" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Skeleton className="h-[500px] rounded-2xl" />
        <Skeleton className="h-[220px] rounded-2xl" />
      </div>
      <Skeleton className="h-[160px] rounded-2xl" />
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  );
}

export function CharacterPage() {
  const { user } = useAuth();
  const character = useQuery(
    api.character.getMyCharacter,
    user ? { userId: user._id as any } : "skip"
  );
  const equipCard = useMutation(api.character.equipCard);
  const [equippingCardId, setEquippingCardId] = useState<string | null>(null);

  const displayActiveCardId = equippingCardId || character?.profile.activeTarotCardId;
  const activeCard = useMemo(() => {
    if (!character) return null;
    return (
      character.collection.find((card: any) => card._id === displayActiveCardId) ||
      character.activeCard ||
      null
    );
  }, [character, displayActiveCardId]);

  const handleEquip = async (tarotCardId: string) => {
    if (!user) return;
    setEquippingCardId(tarotCardId);
    try {
      await equipCard({
        userId: user._id as any,
        tarotCardId: tarotCardId as any,
      });
    } finally {
      setEquippingCardId(null);
    }
  };

  if (character === undefined) {
    return <CharacterSkeleton />;
  }

  if (!character) {
    return (
      <div className="rounded-2xl border border-border bg-background p-8">
        <h1 className="text-3xl font-serif font-semibold">Character</h1>
        <p className="mt-2 text-muted-foreground">
          Character data is not available yet.
        </p>
      </div>
    );
  }

  const levelProgress = Math.max(
    0,
    Math.min(100, character.levelProgress.progressPercent || 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Character
        </p>
        <h1 className="mt-2 text-4xl font-serif font-semibold">Your Arc</h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          {activeCard ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-muted">
                {activeCard.imageUrl ? (
                  <img
                    src={activeCard.imageUrl}
                    alt={activeCard.name}
                    className="h-[440px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[440px] items-center justify-center text-sm text-muted-foreground">
                    No art uploaded
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{activeCard.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activeCard.description || "No description"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Unlock your first card to equip it.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Level</p>
                <p className="text-4xl font-bold">Lv. {character.levelProgress.level}</p>
                <p className="text-xs text-muted-foreground">
                  Average of all domain levels
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-semibold">{character.levelProgress.totalXp}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {character.levelProgress.xpIntoLevel} /{" "}
                  {character.levelProgress.xpNeededForNextLevel}
                </span>
                <span>{levelProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              New cards reveal themselves when you hit hidden milestones.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Domain Stats</h2>
            {character.domainStats.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Domain stats appear as you earn domain-specific XP.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {character.domainStats.map((stat: any) => (
                  <div
                    key={stat._id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {normalizeCharacterDomainLabel(stat.domain.name)}
                      </p>
                      <Badge variant="outline">Lv. {stat.statLevel}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {stat.xp} XP
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Badges</h2>
        {character.badges.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Keep learning to earn milestone badges.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {character.badges.map((badge: any) => (
              <Badge key={badge._id} variant="outline" className="gap-2 py-1.5">
                <span>{badge.definition?.icon || "🏁"}</span>
                <span>{badge.definition?.name || badge.badgeCode}</span>
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Collection</h2>
        {character.collection.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No tarot cards are in the catalog yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {character.collection.map((card: any) => {
              const isEquipped = displayActiveCardId === card._id;
              const isLocked = !card.unlocked;
              return (
                <article
                  key={card._id}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="relative h-48 bg-muted">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    {isLocked ? (
                      <div className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-semibold uppercase tracking-wide text-white">
                        Locked
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{card.name}</p>
                      <Badge variant="outline" className={rarityTone(card.rarity)}>
                        {card.rarity}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {card.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {isLocked ? "Hidden requirement" : "Unlocked"}
                      </span>
                      {isEquipped ? (
                        <Badge>Equipped</Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isLocked || Boolean(equippingCardId)}
                          onClick={() => handleEquip(card._id)}
                        >
                          Equip
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Recent XP</h2>
        {character.recentXp.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Complete activities to start your XP timeline.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {character.recentXp.map((event: any) => (
              <div
                key={event._id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{event.sourceType.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.awardedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.domain?.name
                      ? normalizeCharacterDomainLabel(event.domain.name)
                      : "Unmapped domain"}
                  </p>
                </div>
                <Badge variant="outline">+{event.xpAwarded} XP</Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CharacterPage;
