import Link from "next/link";
import {
  Apple,
  ChevronRight,
  Dumbbell,
  Home,
  Package,
  Shirt,
  ShoppingBag,
  Smartphone,
} from "lucide-react";

const categoryIcons = [
  [/cloth|fashion|apparel|vetement|vêtement/i, Shirt],
  [/electronic|tech|computer|phone/i, Smartphone],
  [/food|grocery|fruit|aliment|épicerie/i, Apple],
  [/home|house|furniture|maison|meuble/i, Home],
  [/sport|fitness|outdoor|exercise/i, Dumbbell],
];

export default function CategoryCard({
  category,
  count,
  userId,
  primaryColor = "#3B82F6",
  textColor = "#1F2937",
  textSecondaryColor = "#6B7280",
}) {
  const categoryName =
    typeof category === "string" ? category : category.category;
  const productCount = count || category?.count || 0;
  const CategoryIcon =
    categoryIcons.find(([pattern]) => pattern.test(categoryName))?.[1] ||
    Package;

  return (
    <Link
      href={`/storefront/${userId}/products?category=${encodeURIComponent(categoryName)}`}
      className="card group flex h-full w-full flex-col items-center p-6 text-center transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderRadius: "0.75rem",
        borderColor: `${primaryColor}33`,
        color: textColor,
      }}
    >
      <div
        className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
      >
        <CategoryIcon size={30} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <h3 className="mb-1 font-semibold">{categoryName}</h3>
      <p className="text-sm" style={{ color: textSecondaryColor }}>
        {productCount} {productCount === 1 ? "product" : "products"}
      </p>
      <div
        className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium transition-all group-hover:gap-2"
        style={{ color: primaryColor }}
      >
        <ShoppingBag size={15} aria-hidden="true" />
        <span>View</span>
        <ChevronRight size={14} />
      </div>
    </Link>
  );
}
