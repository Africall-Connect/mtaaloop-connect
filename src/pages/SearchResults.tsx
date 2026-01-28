import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorListingGrid } from "@/components/VendorListingGrid";
import { searchVendors } from "@/data/vendors";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const results = searchVendors(query);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">Search Results</h1>
            </div>
            <p className="text-muted-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
        </div>

        <VendorListingGrid 
          vendors={results} 
          emptyMessage={`No vendors found for "${query}". Try searching for food, pharmacy, cleaning, etc.`}
        />
      </div>
    </div>
  );
};

export default SearchResults;
