import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ImageIcon, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkClientRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
  defaultPrompt?: string;
  showCard?: boolean;
}

export function ImageGenerator({ 
  onImageGenerated, 
  defaultPrompt = '',
  showCard = true 
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: prompt.trim() },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        onImageGenerated?.(data.imageUrl);
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const content = (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && generateImage()}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={generateImage} disabled={loading || !prompt.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Generate</span>
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 bg-muted/50 rounded-lg">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Generating your image...</p>
          </div>
        </div>
      )}

      {imageUrl && !loading && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <img 
              src={imageUrl} 
              alt="Generated" 
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadImage} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={generateImage} disabled={loading} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
