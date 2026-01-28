import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <span className="text-sm font-bold text-primary-foreground">M</span>
              </div>
              <span className="font-bold">
                <span className="gradient-text">MTAA</span> Loop
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your community marketplace for products and services. Buy, sell, and connect locally.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="font-semibold mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/browse" className="hover:text-foreground transition-colors">
                  Browse All
                </Link>
              </li>
              <li>
                <Link to="/browse?type=product" className="hover:text-foreground transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/browse?type=service" className="hover:text-foreground transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/create-listing" className="hover:text-foreground transition-colors">
                  Post a Listing
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-foreground transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-foreground transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/my-listings" className="hover:text-foreground transition-colors">
                  My Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/help" className="hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-foreground transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MTAA Loop Connect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
