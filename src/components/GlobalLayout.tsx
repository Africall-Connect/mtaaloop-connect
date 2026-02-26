import { CartoonIllustrations } from "./landing/CartoonIllustrations";
import { BottomNavigation } from "./BottomNavigation";

type GlobalLayoutProps = {
  children: React.ReactNode;
};

export const GlobalLayout = ({ children }: GlobalLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <CartoonIllustrations />
      <main className="relative z-10 pb-16 md:pb-0">{children}</main>
      <BottomNavigation />
    </div>
  );
};
