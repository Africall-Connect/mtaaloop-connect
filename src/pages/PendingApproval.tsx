import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Application Submitted Successfully!</CardTitle>
          <CardDescription>Thank you for your interest in joining MtaaLoop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">What happens next?</h4>
                <p className="text-sm text-muted-foreground">
                  Our team will review your application within 2-3 business days. We'll contact you via email with the next steps.
                </p>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Application Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Application received</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Under review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Approval decision</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Need help?</p>
              <p>Contact our support team at support@mtaaloop.com</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
