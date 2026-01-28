import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-2xl font-semibold">Oops! Page not found</p>
        <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/home">
          <Button size="lg" className="mt-4">
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
