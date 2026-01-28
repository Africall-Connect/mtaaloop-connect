import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Health = () => {
  const subCategories = [
    {
      title: "Pharmacy & Chemist",
      description: "Medicine, First Aid, Supplements",
      link: "/subcategory/pharmacy",
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
            <h1 className="text-3xl font-bold">💊 Health & Wellness</h1>
            <p className="text-muted-foreground">Pharmacy, medicine & health products</p>
          </div>
        </div>

        <div className="space-y-4">
          {subCategories.map((category) => (
            <Link key={category.title} to={category.link}>
              <Card className="p-6 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-muted-foreground mb-3">{category.description}</p>
                <div className="flex items-center text-sm font-medium text-primary">
                  View options →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Health;
