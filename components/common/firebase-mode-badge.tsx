import { CloudCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { isFirebaseConfigured } from "@/firebase/config";

export function FirebaseModeBadge() {
  if (isFirebaseConfigured) {
    return (
      <Badge variant="success" className="gap-1">
        <CloudCog className="h-3 w-3" />
        Firebase Connected
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="gap-1">
      <CloudCog className="h-3 w-3" />
      Demo Mode (Local Data)
    </Badge>
  );
}
