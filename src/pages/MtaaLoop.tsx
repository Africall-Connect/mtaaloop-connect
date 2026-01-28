import { Link } from "react-router-dom";
import { MapPin, Video, Shield, Users, Sparkles, Heart, ChevronLeft, ChevronRight, Quote, Play, UserPlus, Shuffle, MessageCircle, Bell, Star, Building2, Gift, ShieldCheck, Lock, Eye, MapPinOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect, useRef } from "react";

const MtaaLoop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [connectionsMade, setConnectionsMade] = useState(0);
  const [estatesCovered, setEstatesCovered] = useState(0);
  const [activeRooms, setActiveRooms] = useState(0);
  const observerRef = useRef(null);

  useEffect(() => {
    // Animate counters (2s duration, 60 steps)
    const animateCounter = (setter, target, duration = 2000, steps = 60) => {
      const increment = target / steps;
      const interval = duration / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, interval);
    };

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            animateCounter(setUserCount, 2847);
            animateCounter(setConnectionsMade, 15632);
            animateCounter(setEstatesCovered, 47);
            animateCounter(setActiveRooms, 127);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mtaaloop-coral to-mtaaloop-teal flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-primary">MtaaLoop</span>
                <div className="text-xs text-muted-foreground">
                  Connect • Hyperlocal • Safe
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <div className="container px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 py-16 bg-gradient-to-br from-mtaaloop-coral via-mtaaloop-teal to-mtaaloop-coral rounded-3xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-mtaaloop-coral/10 via-mtaaloop-teal/10 to-mtaaloop-coral/10"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              ✨ Now in Beta
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Meet Your Neighbors Before You Meet Them
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/95 max-w-3xl mx-auto">
              Random video chats with verified neighbors in your estate or within 2km. Build genuine connections in your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/mtaaloop/register">
                <Button size="lg" className="bg-white text-slate-800 hover:bg-white/90 animate-pulse-slow px-8 py-6 text-lg shadow-lg">
                  Get Started - It's Free
                </Button>
              </Link>
              <Button size="lg" className="bg-slate-700 text-white hover:bg-slate-600 px-8 py-6 text-lg shadow-lg">
                Watch Demo
              </Button>
            </div>
            <div className="mt-6">
              <Link to="/mtaaloop/login" className="text-white/80 hover:text-white underline text-sm">
                Already a member? Log in
              </Link>
            </div>
          </div>
        </div>

        {/* StatsBar Section */}
        <div ref={observerRef} className="mb-16 py-16 bg-gradient-to-br from-mtaaloop-coral/5 via-mtaaloop-teal/5 to-mtaaloop-coral/5 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Growing Community
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of neighbors already building stronger communities
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-mtaaloop-coral mb-2">
                  {isVisible ? userCount.toLocaleString() : '0'}+
                </div>
                <p className="text-muted-foreground font-medium">Active Users</p>
                <p className="text-sm text-muted-foreground mt-1">Verified neighbors</p>
              </div>

              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-mtaaloop-teal mb-2">
                  {isVisible ? connectionsMade.toLocaleString() : '0'}+
                </div>
                <p className="text-muted-foreground font-medium">Connections Made</p>
                <p className="text-sm text-muted-foreground mt-1">Successful matches</p>
              </div>

              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-mtaaloop-online mb-2">
                  {isVisible ? estatesCovered : '0'}+
                </div>
                <p className="text-muted-foreground font-medium">Estates Covered</p>
                <p className="text-sm text-muted-foreground mt-1">Nairobi neighborhoods</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-mtaaloop-coral/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-mtaaloop-coral">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Sign up with your location and interests. We verify your neighborhood residency for safety.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-mtaaloop-teal/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-mtaaloop-teal">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Get Matched with Neighbors</h3>
              <p className="text-muted-foreground">
                Our smart algorithm connects you with verified neighbors in your estate or within 2km radius.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-mtaaloop-online/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-mtaaloop-online">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Start Chatting & Building Community</h3>
              <p className="text-muted-foreground">
                Begin with random video chats, join interest-based rooms, and build lasting neighborhood connections.
              </p>
            </div>
          </div>
        </div>

        {/* App Preview Section */}
        <div className="mb-16 py-16 bg-gradient-to-br from-muted/50 to-background rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                See MtaaLoop in Action
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the future of neighborhood connections
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-4">Dashboard & Matching</h3>
                <p className="text-muted-foreground mb-6">
                  Browse nearby neighbors, see who's online, and start conversations instantly.
                  Join interest-based rooms for sports, parents, business, and more.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-mtaaloop-coral"></div>
                    <span className="text-sm">Real-time online status</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-mtaaloop-teal"></div>
                    <span className="text-sm">Interest-based room discovery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-mtaaloop-online"></div>
                    <span className="text-sm">Verified neighbor profiles</span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="relative mx-auto max-w-sm">
                  <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-slate-200">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-mtaaloop-coral/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-mtaaloop-coral">M</span>
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Sarah from Riverside</div>
                          <div className="text-xs text-muted-foreground">Online now • 0.8km away</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-mtaaloop-teal/10 rounded-lg p-3 text-center">
                          <Video className="w-6 h-6 text-mtaaloop-teal mx-auto mb-1" />
                          <div className="text-xs font-semibold">Video Chat</div>
                        </div>
                        <div className="bg-mtaaloop-coral/10 rounded-lg p-3 text-center">
                          <Users className="w-6 h-6 text-mtaaloop-coral mx-auto mb-1" />
                          <div className="text-xs font-semibold">Join Room</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs font-semibold mb-2">Active Rooms Nearby</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs">Parents of Toddlers (3 online)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs">Weekend Runners (7 online)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16 py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Key Features
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to connect with your community
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-coral/10 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-mtaaloop-coral" />
                </div>
                <h3 className="text-lg font-bold mb-2">Random Video Chats</h3>
                <p className="text-sm text-muted-foreground">
                  Connect instantly with verified neighbors through random video calls
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-teal/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-mtaaloop-teal" />
                </div>
                <h3 className="text-lg font-bold mb-2">Interest-Based Rooms</h3>
                <p className="text-sm text-muted-foreground">
                  Join rooms for parents, sports, business, and more shared interests
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-online/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-mtaaloop-online" />
                </div>
                <h3 className="text-lg font-bold mb-2">Verified Neighbors</h3>
                <p className="text-sm text-muted-foreground">
                  Every user is verified through location and identity checks
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-coral/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-mtaaloop-coral" />
                </div>
                <h3 className="text-lg font-bold mb-2">Location-Based Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with neighbors in your estate or within 2km radius
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TrustBadges Section */}
        <div className="mb-16 py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Safety & Privacy First
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built with security in mind from day one
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-coral/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-mtaaloop-coral" />
                </div>
                <h3 className="text-lg font-bold mb-2">Verified Neighbors Only</h3>
                <p className="text-sm text-muted-foreground">
                  Every user is verified through location and identity checks
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-teal/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-mtaaloop-teal" />
                </div>
                <h3 className="text-lg font-bold mb-2">Location Protected</h3>
                <p className="text-sm text-muted-foreground">
                  Precise location data is never shared with other users
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-online/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-mtaaloop-online" />
                </div>
                <h3 className="text-lg font-bold mb-2">24/7 Moderation</h3>
                <p className="text-sm text-muted-foreground">
                  Our team monitors all interactions to ensure safety
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-mtaaloop-coral/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-mtaaloop-coral" />
                </div>
                <h3 className="text-lg font-bold mb-2">End-to-End Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  Your conversations and data are fully encrypted and private
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mb-16 py-16 bg-muted/30 rounded-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect For
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're new to the area or looking to connect more deeply with your community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-2">New Residents</h3>
              <p className="text-muted-foreground">
                Meet neighbors without awkward encounters at the mailbox or elevator
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">👨‍👩‍👧</div>
              <h3 className="text-xl font-bold mb-2">Parents</h3>
              <p className="text-muted-foreground">
                Find other parents, arrange playdates, and build your family's support network
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">💼</div>
              <h3 className="text-xl font-bold mb-2">Remote Workers</h3>
              <p className="text-muted-foreground">
                Connect with local professionals and build your network in the real world
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Event Organizers</h3>
              <p className="text-muted-foreground">
                Promote events, meet attendees early, and build community engagement
              </p>
            </div>
          </div>
        </div>

        {/* EstatesCovered Section */}
        <div className="mb-16 py-16 bg-gradient-to-br from-mtaaloop-teal/5 via-mtaaloop-online/5 to-mtaaloop-teal/5 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Estates Covered
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Connecting neighbors across Nairobi's finest communities
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-3xl mb-3">🏡</div>
                <h3 className="text-lg font-bold mb-2">Karen</h3>
                <p className="text-sm text-muted-foreground">Luxury estates and family homes</p>
              </div>

              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-3xl mb-3">🏙️</div>
                <h3 className="text-lg font-bold mb-2">Westlands</h3>
                <p className="text-sm text-muted-foreground">Urban professionals and creatives</p>
              </div>

              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-3xl mb-3">🌳</div>
                <h3 className="text-lg font-bold mb-2">Kilimani</h3>
                <p className="text-sm text-muted-foreground">Green spaces and community vibes</p>
              </div>

              <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-3xl mb-3">🏘️</div>
                <h3 className="text-lg font-bold mb-2">Riverside</h3>
                <p className="text-sm text-muted-foreground">Riverside living and recreation</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground">
                And growing rapidly across Nairobi's neighborhoods
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16 py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Our Community Says
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Real stories from real neighbors building real connections
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <Quote className="w-8 h-8 text-mtaaloop-coral mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "I moved to Karen last month and was nervous about meeting people. MtaaLoop connected me with 3 amazing families in my estate. We now have weekly coffee meetups!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-mtaaloop-teal/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-mtaaloop-teal">A</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Anna M.</div>
                    <div className="text-xs text-muted-foreground">Karen Estate, Nairobi</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <Quote className="w-8 h-8 text-mtaaloop-teal mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "As a single dad, finding other parents nearby was tough. Through MtaaLoop's Parents room, I met 5 other dads. Our kids now play together every weekend!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-mtaaloop-coral/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-mtaaloop-coral">J</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">James K.</div>
                    <div className="text-xs text-muted-foreground">Westlands, Nairobi</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <Quote className="w-8 h-8 text-mtaaloop-online mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "Working remotely, I felt isolated. MtaaLoop helped me connect with local professionals. We've started a co-working group and even launched a business together!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-mtaaloop-online/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-mtaaloop-online">S</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah W.</div>
                    <div className="text-xs text-muted-foreground">Kilimani, Nairobi</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>



        {/* FAQ Section */}
        <div className="mb-16 py-16 bg-muted/30 rounded-3xl">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about getting started
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="bg-white rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">Is MtaaLoop really free?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! MtaaLoop is completely free for all residents. We believe in building community without barriers. There are no hidden fees, premium subscriptions, or in-app purchases.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-white rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">How do you verify neighbors?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We verify every user through multiple checks: location confirmation (you must be within our service areas), phone number verification, and community guidelines agreement. This ensures everyone is a genuine resident.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-white rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">What happens if I don't like a conversation?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Every chat has a "Skip" button for immediate exit. You can also report/block users if needed. Our 10-minute time limit ensures conversations stay comfortable and productive.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-white rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">Is my location data safe?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely. We use location data only to match you with nearby neighbors and verify residency. Precise coordinates are never shared with other users - only approximate distances (like "0.8km away").
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="bg-white rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">What areas do you serve?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Currently available in select Nairobi estates including Karen, Westlands, Kilimani, and Riverside. We're expanding rapidly - more estates and cities coming soon!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="bg-white rounded-lg px-6 shadow-sm">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">Can I use MtaaLoop on my phone?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! MtaaLoop works perfectly on both desktop and mobile browsers. We're also developing native mobile apps for iOS and Android, coming later this year.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-mtaaloop-coral/10 via-mtaaloop-teal/10 to-mtaaloop-coral/10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Neighbors Are Waiting
            </h2>
            <p className="text-xl mb-8 text-white/95">
              Free forever for residents • Join the beta today
            </p>
            <Link to="/mtaaloop/register">
              <Button size="lg" className="bg-white text-slate-800 hover:bg-white/90 animate-pulse-slow px-8 py-6 text-lg shadow-lg">
                Create Your Profile
              </Button>
            </Link>
            <p className="text-sm text-white/80 mt-4">
              Currently available in Nairobi estates • More cities coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MtaaLoop;
