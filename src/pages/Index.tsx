import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Wrench, Users, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import CategoryCard from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { categories, mockListings } from '@/lib/mockData';

const Index = () => {
  const featuredListings = mockListings.filter((l) => l.isFeatured);
  const productCategories = categories.filter((c) => c.type === 'product');
  const serviceCategories = categories.filter((c) => c.type === 'service');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="container px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Buy, Sell & Connect in Your{' '}
                <span className="gradient-text">Community</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                MTAA Loop Connect is your local marketplace for products and services. 
                Find what you need, offer what you have, and build connections in your neighborhood.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/browse">
                    Explore Marketplace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/signup">Start Selling</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">1,200+</div>
                <div className="text-sm text-muted-foreground mt-1">Active Listings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">500+</div>
                <div className="text-sm text-muted-foreground mt-1">Verified Sellers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">50+</div>
                <div className="text-sm text-muted-foreground mt-1">Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-text">10K+</div>
                <div className="text-sm text-muted-foreground mt-1">Happy Users</div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-16">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Shop Products
                </h2>
                <p className="text-muted-foreground mt-1">Find great deals on items near you</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/browse?type=product">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {productCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Service Categories */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-secondary" />
                  Find Services
                </h2>
                <p className="text-muted-foreground mt-1">Connect with skilled service providers</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/browse?type=service">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {serviceCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-16">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Featured Listings</h2>
                <p className="text-muted-foreground mt-1">Hand-picked offers from our community</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/browse">
                  Browse All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <h2 className="text-2xl font-bold text-center mb-12">Why Choose MTAA Loop?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with real people in your neighborhood. Build trust through local transactions.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Products & Services</h3>
                <p className="text-sm text-muted-foreground">
                  One platform for everything. Buy products, hire services, or offer your own skills.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Safe & Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Verified sellers, real reviews, and secure messaging. Your safety is our priority.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container px-4">
            <div className="rounded-2xl gradient-primary p-8 md:p-12 text-center text-primary-foreground">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Start Selling?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                Join thousands of sellers already earning on MTAA Loop. List your products or services today!
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
