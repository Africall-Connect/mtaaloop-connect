import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageGenerator } from '@/components/ImageGenerator';

export default function ImageGeneratorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-500/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="text-xl font-bold">AI Image Generator</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Create <span className="text-purple-500">Amazing Images</span> with AI
          </h2>
          <p className="text-muted-foreground">
            Describe what you want to see, and our AI will generate it for you
          </p>
        </div>

        {/* Image Generator Component */}
        <ImageGenerator />

        {/* Tips Section */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-3">Tips for better results:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Be specific about what you want (colors, style, mood)</li>
            <li>• Include details like "high quality", "professional", "detailed"</li>
            <li>• Try adding an art style like "watercolor", "photorealistic", "cartoon"</li>
            <li>• Describe the lighting: "sunset lighting", "studio lighting"</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
