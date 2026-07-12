import type { Metadata } from "next";
import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Flame, Package, Scale, CheckCircle2, XCircle, Leaf, AlertTriangle } from "lucide-react";
import type { Product, Store } from "@/types";
import { productById, storeById, productsOf } from "@/mock";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/misc";
import { HScroll } from "@/components/ui/carousel";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetailActions } from "@/features/store/product-detail-actions";
import { discountPercent, formatRating } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { storeId: string; productId: string };
}): Promise<Metadata> {
  const product = productById(params.storeId, params.productId);
  const store = storeById(params.storeId);
  if (!product || !store) return { title: "Produit introuvable — NOVIGO" };
  return {
    title: `${product.name} — ${store.name} | NOVIGO`,
    description: product.description.slice(0, 155),
  };
}

export default function ProductPage({ params }: { params: { storeId: string; productId: string } }) {
  const product = productById(params.storeId, params.productId);
  const store = storeById(params.storeId);
  if (!product || !store) notFound();

  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const similar = productsOf(store).filter((p) => p.id !== product.id).slice(0, 12);
  const pct = product.oldPrice ? discountPercent(product.oldPrice, product.price) : 0;

  return (
    <div className="px-4 py-4">
      <Link
        href={`/store/${store.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4" /> Retour à {store.name}
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <ProductGallery product={product} gallery={gallery} />

        <div>
          <ProductSummary product={product} store={store} pct={pct} />
          <Divider className="my-5" />
          <ProductDetailActions product={product} store={store} />
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Produits similaires</h2>
          <HScroll>
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} store={store} className="w-[170px]" />
            ))}
          </HScroll>
        </section>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Galerie */

function ProductGallery({ product, gallery }: { product: Product; gallery: string[] }) {
  return (
    <div className="space-y-2.5">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-shell shadow-card">
        <MediaImage
          src={gallery[0]}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
        />
        {product.oldPrice && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[12px] font-bold text-white shadow">
            -{discountPercent(product.oldPrice, product.price)}%
          </span>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {gallery.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-shell">
              <MediaImage
                src={src}
                alt={`${product.name} — vue ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Résumé */

function ProductSummary({ product, store, pct }: { product: Product; store: Store; pct: number }) {
  const facts = [
    product.calories != null ? { icon: Flame, label: `${product.calories} kcal` } : null,
    product.weight ? { icon: Scale, label: product.weight } : null,
    product.unit ? { icon: Package, label: `À l'unité : ${product.unit}` } : null,
  ].filter(Boolean) as { icon: typeof Flame; label: string }[];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {product.isNew && <Badge tone="info">Nouveau</Badge>}
        {product.isBestSeller && <Badge tone="gold">Top vente</Badge>}
        {pct > 0 && <Badge tone="brand">Promo -{pct}%</Badge>}
      </div>

      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{product.name}</h1>

      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-muted">
        <Link href={`/store/${store.slug}`} className="font-medium text-brand hover:underline">
          {store.name}
        </Link>
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="font-semibold text-ink">{formatRating(product.rating)}</span>
          <span>({product.reviewCount} avis)</span>
        </span>
        {product.available ? (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> En stock ({product.stock})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-error">
            <XCircle className="h-3.5 w-3.5" /> Épuisé
          </span>
        )}
      </div>

      <div className="mt-4">
        <Price value={product.price} oldValue={product.oldPrice} size="lg" />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-muted">{product.description}</p>

      {facts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {facts.map((f) => (
            <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink shadow-card">
              <f.icon className="h-4 w-4 text-brand" /> {f.label}
            </span>
          ))}
        </div>
      )}

      {product.ingredients && product.ingredients.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Leaf className="h-4 w-4 text-success" /> Ingrédients
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{product.ingredients.join(", ")}</p>
        </div>
      )}

      {product.allergens && product.allergens.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <AlertTriangle className="h-4 w-4 text-warning" /> Allergènes
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {product.allergens.map((a) => (
              <Badge key={a} tone="warning">{a}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
