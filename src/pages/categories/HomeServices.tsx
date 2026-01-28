import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const HomeServices = () => {
  const subCategories = [
    {
      title: "House Cleaning",
      description: "General, Deep Cleaning, Move-in/out",
      link: "/subcategory/house-cleaning",
    },
    {
      title: "Laundry Services",
      description: "Wash & Fold, Wash & Iron, Dry Clean",
      link: "/subcategory/laundry",
    },
    {
      title: "Carpet & Upholstery Cleaning",
      description: "Carpets, Sofas, Mattresses",
      link: "/subcategory/carpet-cleaning",
    },
    {
      title: "Airbnb Cleaning Services",
      description: "Turnover cleaning for hosts",
      link: "/subcategory/airbnb-cleaning",
    },
    {
      title: "Borehole & Water Solutions",
      description: "Drilling, Tank Cleaning, Plumbing",
      link: "/subcategory/borehole-water",
    },
    {
      title: "Jaba (Miraa/Khat)",
      description: "Fresh miraa delivery",
      link: "/subcategory/jaba",
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
          <div>
            <h1 className="text-3xl font-bold">🏠 Home Services</h1>
            <p className="text-muted-foreground">Cleaning, laundry, repairs & more</p>
          </div>
        </div>

        <div className="space-y-4">
          {subCategories.map((category) => (
            <Link key={category.title} to={category.link}>
              <Card className="p-6 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-muted-foreground mb-3">{category.description}</p>
                <div className="flex items-center text-sm font-medium text-primary">
                  Book service →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeServices;
