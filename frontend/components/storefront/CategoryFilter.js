import { Filter } from 'lucide-react';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-gray-500" />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
