import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface VendorStoryProps {
  description: string;
  categories: string[];
  yearsInBusiness?: number;
  certifications: string[];
}

export const VendorStory = ({
  description,
  categories,
  yearsInBusiness,
  certifications,
}: VendorStoryProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">📖 About This Vendor</h2>

      <p className="text-foreground mb-4">{description}</p>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <span className="font-semibold min-w-[140px]">Specialties:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="outline">
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {yearsInBusiness && (
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[140px]">Years in business:</span>
            <span>{yearsInBusiness} years</span>
          </div>
        )}

        <div className="flex items-start gap-2">
          <span className="font-semibold min-w-[140px]">Chef trained:</span>
          <span>Traditional home cooking</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        {certifications.map((cert) => (
          <Badge key={cert} variant="secondary" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            {cert}
          </Badge>
        ))}
      </div>
    </Card>
  );
};
