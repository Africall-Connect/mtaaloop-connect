import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SpecialOccasions = () => {
  const subCategories = [
    {
      title: "Gift Baskets & Hampers",
      description: "Curated gifts for any occasion",
      link: "/subcategory/gift-baskets",
    },
    {
      title: "Event Planning Services",
      description: "Weddings, Birthdays, Corporate Events",
      link: "/subcategory/event-planning",
    },
    {
      title: "Cake & Pastries",
      description: "Custom cakes, Wedding cakes, Cupcakes",
      link: "/subcategory/cakes",
    },
    {
      title: "Decorations & Party Supplies",
      description: "Balloons, Banners, Themed Decorations",
      link: "/subcategory/party-supplies",
    },
    {
      title: "Photography Services",
      description: "Weddings, Events, Portraits",
      link: "/subcategory/photography",
    },
    {
      title: "MC & Entertainment",
      description: "MCs, DJs, Live Bands",
      link: "/subcategory/entertainment",
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
            <h1 className="text-3xl font-bold">🎉 Special Occasions</h1>
            <p className="text-muted-foreground">Gifts, events, cakes & celebrations</p>
          </div>
        </div>

        <div className="space-y-4">
          {subCategories.map((category) => (
            <Link key={category.title} to={category.link}>
              <Card className="p-6 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-muted-foreground mb-3">{category.description}</p>
                <div className="flex items-center text-sm font-medium text-primary">
                  Browse options →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialOccasions;
