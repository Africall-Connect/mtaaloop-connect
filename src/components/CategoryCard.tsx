import { Link } from 'react-router-dom';
import type { Category } from '@/lib/mockData';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link
      to={`/browse?category=${category.id}`}
      className="group flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200 hover:bg-muted"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-transform duration-200 group-hover:scale-110 ${
          category.type === 'product'
            ? 'bg-primary/10'
            : 'bg-secondary/10'
        }`}
      >
        {category.icon}
      </div>
      <span className="text-sm font-medium text-center text-foreground">{category.name}</span>
      <span
        className={`text-xs ${
          category.type === 'product' ? 'text-primary' : 'text-secondary'
        }`}
      >
        {category.type === 'product' ? 'Products' : 'Services'}
      </span>
    </Link>
  );
};

export default CategoryCard;
