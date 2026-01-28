import { Coffee, ShoppingBag, Car, UtensilsCrossed, Sparkles, Heart } from "lucide-react";

export const FloatingIcons = () => {
  const icons = [
    { Icon: Coffee, delay: "0s", top: "20%", left: "10%" },
    { Icon: ShoppingBag, delay: "1s", top: "60%", left: "15%" },
    { Icon: Car, delay: "2s", top: "40%", left: "85%" },
    { Icon: UtensilsCrossed, delay: "0.5s", top: "70%", left: "80%" },
    { Icon: Sparkles, delay: "1.5s", top: "30%", left: "20%" },
    { Icon: Heart, delay: "2.5s", top: "50%", left: "90%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, delay, top, left }, index) => (
        <div
          key={index}
          className="absolute animate-float opacity-10"
          style={{
            top,
            left,
            animationDelay: delay,
          }}
        >
          <Icon className="w-16 h-16 text-primary" />
        </div>
      ))}
    </div>
  );
};
