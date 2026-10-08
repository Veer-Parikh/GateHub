"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Gift, Heart, MessageCircle, Package, Plus, RotateCcw, Search, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/page";
import { Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/hooks/use-now";
import { createListing, deleteListing, markSold, toggleLike } from "@/lib/actions";
import { flatLabel, initials, inr, timeAgo } from "@/lib/format";
import { pointsToast } from "@/lib/notify";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Listing, ListingCategory, ListingCondition, Resident } from "@/lib/types";

const CATEGORIES: ListingCategory[] = ["Furniture", "Electronics", "Kids", "Bicycles", "Appliances", "Books"];
const CONDITIONS: ListingCondition[] = ["Brand New", "Like New", "Gently Used"];

type Scope = "all" | "free" | "mine";
type Sort = "newest" | "price-asc" | "price-desc" | "liked";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "liked", label: "Most liked" },
];

const DIALOG_CLASS =
  "max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

const EMPTY_FORM = {
  title: "",
  price: "",
  free: false,
  category: "Furniture" as ListingCategory,
  condition: "Like New" as ListingCondition,
  description: "",
};

export default function MarketplacePage() {
  return (
    <AppShell>
      <Marketplace />
    </AppShell>
  );
}

function Marketplace() {
  const now = useNow(30_000);
  const state = useDemoState();
  const { resident } = state;
  const isMine = (l: Listing) => l.block === resident.block && l.flat === resident.flat;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ListingCategory | "all">("all");
  const [scope, setScope] = useState<Scope>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Listing | null>(null);

  const counts = {
    all: state.listings.length,
    free: state.listings.filter((l) => l.price === 0).length,
    mine: state.listings.filter(isMine).length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mine = (l: Listing) => l.block === resident.block && l.flat === resident.flat;
    const rows = state.listings.filter((l) => {
      if (category !== "all" && l.category !== category) return false;
      if (scope === "free" && l.price !== 0) return false;
      if (scope === "mine" && !mine(l)) return false;
      if (!q) return true;
      return [l.title, l.description, l.sellerName, flatLabel(l.block, l.flat), l.flat].some((s) => s.toLowerCase().includes(q));
    });
    const byKey = (a: Listing, b: Listing) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "liked":
          return b.likes - a.likes;
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    };
    // Sold items always sink below the ones still available.
    return [...rows].sort((a, b) => Number(!!a.soldAt) - Number(!!b.soldAt) || byKey(a, b) || b.createdAt.localeCompare(a.createdAt));
  }, [state.listings, query, category, scope, sort, resident.block, resident.flat]);

  const filtersActive = query.trim() !== "" || category !== "all" || scope !== "all";
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setScope("all");
  };

  const contact = (l: Listing) => {
    const phone = l.phone.replace(/\D/g, "").slice(-10);
    const priceText = l.price === 0 ? "free giveaway" : inr(l.price);
    const text = `Hi ${l.sellerName.split(" ")[0]}, I'm ${resident.name} from ${flatLabel(resident.block, resident.flat)}, ${resident.society}. Is your "${l.title}" (${priceText}) on the NexGate marketplace still available?`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const like = (l: Listing) => toggleLike(l.id);

  const toggleSold = (l: Listing) => {
    markSold(l.id);
    if (l.soldAt) toast.success(`“${l.title}” is back on the market`);
    else toast.success(`Marked “${l.title}” as sold`, { description: "Neighbours will see it as no longer available." });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteListing(toDelete.id);
    toast(`“${toDelete.title}” deleted`);
    setToDelete(null);
  };

  const scopes: { id: Scope; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "free", label: "Giveaways", count: counts.free },
    { id: "mine", label: "My listings", count: counts.mine },
  ];

  return (
    <>
      <PageHeader
        title="Marketplace"
        description="Buy, sell and give away pre-loved items — only verified residents of your society can see these listings."
        badge={<Pill tone="emerald">Verified residents</Pill>}
        actions={
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> List an item
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Label htmlFor="mk-search" className="sr-only">
              Search listings
            </Label>
            <Input
              id="mk-search"
              type="search"
              placeholder="Search items, sellers or flat (e.g. B-404)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900" role="group" aria-label="Show">
              {scopes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={scope === s.id}
                  onClick={() => setScope(s.id)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    scope === s.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  )}
                >
                  {s.label} <span className="tabular-nums opacity-70">{s.count}</span>
                </button>
              ))}
            </div>
            <Label htmlFor="mk-sort" className="sr-only">
              Sort listings
            </Label>
            <Select value={sort} onValueChange={(v: Sort) => setSort(v)}>
              <SelectTrigger id="mk-sort" className="h-8 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Category">
          <div className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
            {(["all", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  category === c
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700",
                )}
              >
                {c === "all" ? "All categories" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={filtersActive ? "No listings match your filters" : "Nothing listed yet"}
          description={
            filtersActive
              ? scope === "mine"
                ? "You haven't listed anything that matches. Try clearing the filters, or list something new."
                : "Try a different search term or category — or clear the filters to see everything."
              : "Be the first to list something. Giving an item away for free earns you bonus Good Neighbour points."
          }
          action={
            filtersActive ? (
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            ) : (
              <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> List an item
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              mine={isMine(l)}
              now={now}
              onLike={() => like(l)}
              onContact={() => contact(l)}
              onToggleSold={() => toggleSold(l)}
              onDelete={() => setToDelete(l)}
            />
          ))}
        </ul>
      )}

      <CreateListingDialog open={createOpen} onOpenChange={setCreateOpen} resident={resident} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className={DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle className="text-base">Delete this listing?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              “{toDelete?.title}” will be removed from the marketplace for everyone. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setToDelete(null)}>
              Keep listing
            </Button>
            <Button variant="destructive" size="sm" className="h-8 gap-1 text-xs" onClick={confirmDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ListingCard({
  listing: l,
  mine,
  now,
  onLike,
  onContact,
  onToggleSold,
  onDelete,
}: {
  listing: Listing;
  mine: boolean;
  now: number;
  onLike: () => void;
  onContact: () => void;
  onToggleSold: () => void;
  onDelete: () => void;
}) {
  const sold = !!l.soldAt;
  return (
    <li className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={cn("flex flex-1 flex-col gap-3 p-4", sold && "opacity-60")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Package className="h-3.5 w-3.5" /> {l.category}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {mine && <Pill tone="blue">Your listing</Pill>}
            <Pill>{l.condition}</Pill>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{l.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {l.price === 0 ? (
              <Pill tone="emerald">
                <Gift className="h-3 w-3" /> Free
              </Pill>
            ) : (
              <span className="text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">{inr(l.price)}</span>
            )}
            {sold && <Pill tone="red">Sold</Pill>}
          </div>
        </div>

        {l.description && <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{l.description}</p>}

        <div className="mt-auto flex items-center gap-2.5 pt-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {initials(l.sellerName)}
          </div>
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">{mine ? "You" : l.sellerName}</p>
            <p className="text-zinc-500 dark:text-zinc-400">
              {flatLabel(l.block, l.flat)} · {timeAgo(l.createdAt, now)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={l.liked}
          aria-label={`${l.liked ? "Unlike" : "Like"} ${l.title} (${l.likes} ${l.likes === 1 ? "like" : "likes"})`}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium tabular-nums transition-colors",
            l.liked
              ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600",
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", l.liked && "fill-current")} />
          {l.likes}
        </button>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {mine ? (
            <>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onToggleSold}>
                {sold ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Relist
                  </>
                ) : (
                  <>
                    <Tag className="h-3.5 w-3.5" /> Mark sold
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                aria-label={`Delete ${l.title}`}
                className="h-8 gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </>
          ) : sold ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">No longer available</span>
          ) : (
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={onContact}>
              <MessageCircle className="h-3.5 w-3.5" /> Contact on WhatsApp
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function CreateListingDialog({
  open,
  onOpenChange,
  resident,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const priceNum = form.free ? 0 : Number(form.price);
  const errors = {
    title: form.title.trim().length < 3 ? "Give your item a title (at least 3 characters)" : null,
    price: form.free
      ? null
      : form.price.trim() === ""
        ? "Enter a price, or give it away for free"
        : !Number.isFinite(priceNum) || priceNum < 0
          ? "Price must be ₹0 or more"
          : priceNum > 10_00_000
            ? "Keep it under ₹10,00,000"
            : null,
    description: form.description.length > 500 ? "Keep the description under 500 characters" : null,
  };
  const valid = !errors.title && !errors.price && !errors.description;
  const show = (k: keyof typeof errors) => touched[k] && errors[k];
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setTouched({});
    setSubmitting(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, price: true, description: true });
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const price = Math.round(priceNum);
      const points = createListing({
        title: form.title,
        price,
        category: form.category,
        condition: form.condition,
        description: form.description,
      });
      toast.success(price === 0 ? "Giveaway posted" : "Listing published", {
        description: `“${form.title.trim()}” is now visible to your neighbours.`,
      });
      pointsToast(points, price === 0 ? "Gave an item away for free" : "Listed an item on the marketplace");
      reset();
      onOpenChange(false);
    } catch (err) {
      setSubmitting(false);
      toast.error("Couldn't publish the listing", { description: err instanceof Error ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className={DIALOG_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-base">List an item</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Posted as {resident.name} · {flatLabel(resident.block, resident.flat)}. Only residents of {resident.society} can see it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="mk-title" className="text-xs">
              Title
            </Label>
            <Input
              id="mk-title"
              placeholder="e.g. Ergonomic office chair"
              value={form.title}
              maxLength={80}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={blur("title")}
              aria-invalid={!!show("title")}
              aria-describedby={show("title") ? "mk-title-err" : undefined}
            />
            {show("title") && (
              <p id="mk-title-err" className="text-xs text-red-600 dark:text-red-400">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mk-price" className="text-xs">
              Price (₹)
            </Label>
            <Input
              id="mk-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder={form.free ? "Free" : "e.g. 2500"}
              value={form.free ? "" : form.price}
              disabled={form.free}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              onBlur={blur("price")}
              aria-invalid={!!show("price")}
              aria-describedby={show("price") ? "mk-price-err" : undefined}
            />
            {show("price") && (
              <p id="mk-price-err" className="text-xs text-red-600 dark:text-red-400">
                {errors.price}
              </p>
            )}
            <label
              htmlFor="mk-free"
              className="flex cursor-pointer items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <input
                id="mk-free"
                type="checkbox"
                checked={form.free}
                onChange={(e) => setForm({ ...form, free: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Give it away for free</span>
                <span className="block text-zinc-500 dark:text-zinc-400">Giveaways earn +40 Good Neighbour points (listings earn +10).</span>
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mk-category" className="text-xs">
                Category
              </Label>
              <Select value={form.category} onValueChange={(v: ListingCategory) => setForm({ ...form, category: v })}>
                <SelectTrigger id="mk-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mk-condition" className="text-xs">
                Condition
              </Label>
              <Select value={form.condition} onValueChange={(v: ListingCondition) => setForm({ ...form, condition: v })}>
                <SelectTrigger id="mk-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mk-desc" className="text-xs">
              Description &amp; pickup details <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="mk-desc"
              rows={3}
              placeholder="Condition notes, dimensions, which floor to pick up from…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onBlur={blur("description")}
              aria-invalid={!!show("description")}
              aria-describedby="mk-desc-hint"
            />
            <p id="mk-desc-hint" className={cn("text-right text-[11px]", errors.description ? "text-red-600 dark:text-red-400" : "text-zinc-400")}>
              {form.description.length}/500
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? "Publishing…" : form.free ? "Post giveaway" : "Publish listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
