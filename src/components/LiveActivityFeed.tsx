import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Flame } from "lucide-react";

interface Activity {
  id: number;
  name: string;
  item: string;
  distance: string;
  time: string;
}

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, name: "Sarah", item: "ordered Githeri", distance: "500m", time: "2 seconds ago" },
    { id: 2, name: "John", item: "booked Car Wash", distance: "1.2km", time: "8 seconds ago" },
  ]);

  useEffect(() => {
    const sampleActivities = [
      { name: "Grace", item: "ordered Samosas", distance: "800m" },
      { name: "Peter", item: "booked Hair Salon", distance: "1.5km" },
      { name: "Mary", item: "ordered Fresh Juice", distance: "600m" },
      { name: "David", item: "ordered Nyama Choma", distance: "2km" },
    ];

    const interval = setInterval(() => {
      const randomActivity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
      const newActivity = {
        id: Date.now(),
        ...randomActivity,
        time: "just now",
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 1)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 space-y-3 shadow-glow z-50 border-primary/20">
      <div className="flex items-center gap-2 font-semibold">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-live animate-pulse" />
          <span className="text-live">LIVE</span>
        </div>
      </div>

      <div className="space-y-2 max-h-40 overflow-hidden">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="text-sm py-2 border-b border-border last:border-0 animate-fade-in"
            style={{ opacity: index === 0 ? 1 : 0.7 }}
          >
            <div className="font-medium">{activity.name} {activity.item}</div>
            <div className="text-muted-foreground text-xs flex items-center gap-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {activity.distance} away
              </span>
              <span>• {activity.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t flex items-center gap-2 text-sm font-medium text-primary">
        <Flame className="w-4 h-4" />
        <span>127 orders in your area in the last hour</span>
      </div>
    </Card>
  );
};
