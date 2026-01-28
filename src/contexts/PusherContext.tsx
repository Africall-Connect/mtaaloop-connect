import Pusher from 'pusher-js';
import { createContext, useContext, useEffect, useState } from 'react';

interface PusherMessage {
  message: string;
  sender: string;
  timestamp: string;
  // Add other fields as needed
}

const PusherContext = createContext<Pusher | null>(null);

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const [pusher, setPusher] = useState<Pusher | null>(null);

  useEffect(() => {
    const pusherKey = '92acec48c588575d855e';
    const pusherCluster = 'eu';

    try {
      const pusherInstance = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });

      const channel = pusherInstance.subscribe('support-chat');
      channel.bind('new-message', (data: PusherMessage) => {
        window.dispatchEvent(new CustomEvent('pusher-message', { detail: data }));
      });

      setPusher(pusherInstance);

      return () => pusherInstance.disconnect();
    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
    }
  }, []);

  return <PusherContext.Provider value={pusher}>{children}</PusherContext.Provider>;
}