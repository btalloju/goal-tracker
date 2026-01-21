import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivacySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Privacy & Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="space-y-3">
            <p className="font-medium text-green-600">Your data is secure</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                Stored in encrypted PostgreSQL database
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                Only you can access your goals and milestones
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                We never share your data with third parties
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                Authentication secured via Google OAuth
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
