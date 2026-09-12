import { PawPrint } from "lucide-react";
import { useDogPhotoUrl, type Dog } from "@/lib/dogs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function DogAvatar({ dog, className }: { dog: Dog; className?: string }) {
  const { data: url } = useDogPhotoUrl(dog.photo_url);
  const classes = cn("size-16 shrink-0 rounded-full", className);

  if (!dog.photo_url) {
    return (
      <div className={cn(classes, "flex items-center justify-center bg-sage")}>
        <PawPrint className="size-2/5 text-primary" />
      </div>
    );
  }

  if (!url) return <Skeleton className={classes} />;

  return <img src={url} alt={`Zdjęcie psa ${dog.name}`} className={cn(classes, "object-cover")} />;
}