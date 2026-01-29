import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Shopping = () => {
  const subCategories = [
    {
      title: "Minimart & Groceries",
      description: "Rice, Flour, Sugar, Oil, Snacks",
      link: "/subcategory/minimart",
    },
    {
      title: "Fresh Produce",
      description: "Vegetables, Fruits, Sukuma, Tomatoes",
      link: "/subcategory/fresh-produce",
    },
    {
      title: "Liquor & Wines",
      description: "Beer, Wine, Spirits (18+)",
      link: "/subcategory/liquor-wines",
    },
    {
      title: "Fashion & Clothing",
      description: "Mitumba, Clothes, Shoes",
      link: "/subcategory/fashion",
    },
    {
      title: "Eggs",
      description: "Farm fresh eggs delivered",
      link: "/subcategory/eggs",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Shopping</h1>
              <p className="text-muted-foreground">Groceries, liquor, fashion & more</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {subCategories.map((category) => (
            <Link key={category.title} to={category.link}>
              <Card className="p-6 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-muted-foreground mb-3">{category.description}</p>
                <div className="flex items-center text-sm font-medium text-primary">
                  Browse shops →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shopping;
