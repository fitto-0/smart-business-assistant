import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function CategoryCard({ category, count, userId, primaryColor = '#3B82F6' }) {
  const categoryName = typeof category === 'string' ? category : category.category;
  const productCount = count || (category?.count || 0);

  return (
    <Link
      href={`/storefront/${userId}/products?category=${encodeURIComponent(categoryName)}`}
      className="card p-6 text-center hover:transform hover:-translate-y-1 transition-all duration-300 group"
      style={{ borderRadius: '0.75rem', borderColor: primaryColor + '33' }}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: primaryColor + '15' }}>
        <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="font-semibold mb-1" style={{ color: '#1F2937' }}>{categoryName}</h3>
      <p className="text-sm" style={{ color: '#6B7280' }}>
        {productCount} {productCount === 1 ? 'product' : 'products'}
      </p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: primaryColor }}>
        <span>View</span>
        <ChevronRight size={14} />
      </div>
    </Link>
  );
}