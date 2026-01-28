import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Repairs = () => {
  const subCategories = [
    {
      title: "Phone & Computer Repairs",
      description: "Screen replacement, software fixes, data recovery",
      link: "/subcategory/phone-computer-repairs",
    },
    {
      title: "Appliance Repairs",
      description: "Fridges, TVs, microwaves, washing machines",
      link: "/subcategory/appliance-repairs",
    },
    {
      title: "Plumbing Repairs",
      description: "Leaks, blockages, pipe repairs, installations",
      link: "/subcategory/plumbing-repairs",
    },
    {
      title: "Electrical Repairs",
      description: "Wiring, outlets, switches, lighting fixtures",
      link: "/subcategory/electrical-repairs",
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
            <h1 className="text-3xl font-bold">🔧 Repairs</h1>
            <p className="text-muted-foreground">Phone, computer, appliances & more</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subCategories.map((category) => (
            <Link key={category.title} to={category.link}>
              <Card className="p-6 hover:border-primary transition-all hover:shadow-md cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">
                      {category.title.includes("Phone") ? "📱" :
                       category.title.includes("Appliance") ? "🔌" :
                       category.title.includes("Plumbing") ? "🔧" :
                       category.title.includes("Electrical") ? "⚡" : "🔧"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                    <p className="text-muted-foreground mb-3">{category.description}</p>
                    <div className="flex items-center text-sm font-medium text-primary">
                      Book service →
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Repairs;
