import { Filter } from 'lucide-react';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory, primaryColor = '#3B82F6' }) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted" style={{ color: primaryColor }} />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedCategory === null
              ? 'text-white'
              : 'text-ink-secondary border hover:bg-ground/50'
          }`}
          style={{
            backgroundColor: selectedCategory === null ? primaryColor : 'transparent',
            borderColor: selectedCategory === null ? primaryColor : primaryColor,
          }}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedCategory === category
                ? 'text-white'
                : 'text-ink-secondary border hover:bg-ground/50'
            }`}
            style={{
              backgroundColor: selectedCategory === category ? primaryColor : 'transparent',
              borderColor: selectedCategory === category ? primaryColor : primaryColor,
            }}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}