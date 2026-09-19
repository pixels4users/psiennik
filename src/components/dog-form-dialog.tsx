import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteDogPhoto, uploadDogPhoto, useDogPhotoUrl, type Dog } from "@/lib/dogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DogFormDialog({
  open,
  onOpenChange,
  dog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog?: Dog;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: currentPhotoUrl } = useDogPhotoUrl(dog?.photo_url ?? null);
  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => {
    if (!open) return;
    setName(dog?.name ?? "");
    setAge(dog?.age ?? "");
    setBreed(dog?.breed ?? "");
    setSex(dog?.sex ?? "");
    setPhoto(null);
    setRemovePhoto(false);
  }, [dog, open]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const reset = () => {
    setName("");
    setAge("");
    setBreed("");
    setSex("");
    setPhoto(null);
    setRemovePhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Podaj imię psa");
      return;
    }
    setSaving(true);
    try {
      const values = {
        name: name.trim(),
        age: age.trim() || null,
        breed: breed.trim() || null,
        sex: sex || null,
      };

      // Rekord psa powstaje najpierw — ścieżka zdjęcia zawiera jego identyfikator.
      const { data, error } = await (dog
        ? supabase.from("dogs").update(values).eq("id", dog.id).select("id").single()
        : supabase.from("dogs").insert(values).select("id").single());
      if (error) throw error;

      const dogId = data.id;
      let photoUrl = dog?.photo_url ?? null;
      if (photo) photoUrl = await uploadDogPhoto(photo, dogId);
      else if (removePhoto) photoUrl = null;

      if (photoUrl !== (dog?.photo_url ?? null)) {
        const { error: photoError } = await supabase
          .from("dogs")
          .update({ photo_url: photoUrl })
          .eq("id", dogId);
        if (photoError) throw photoError;

        if (dog?.photo_url) {
          try {
            await deleteDogPhoto(dog.photo_url);
          } catch {
            toast.warning("Dane zapisano, ale nie udało się usunąć poprzedniego zdjęcia");
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["dogs"] });
      await queryClient.invalidateQueries({ queryKey: ["dogs", dogId] });
      if (dog?.photo_url) {
        await queryClient.invalidateQueries({ queryKey: ["dog-photo", dog.photo_url] });
      }
      toast.success(dog ? "Dane psa zostały zapisane" : `Dodano psa: ${name.trim()}`);
      reset();
      onOpenChange(false);
      if (!dog) navigate({ to: "/pies/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać psa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            {dog ? "Edytuj psa" : "Dodaj psa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="dog-name">Imię</Label>
            <Input
              id="dog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Lucy"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dog-age">Wiek</Label>
              <Input
                id="dog-age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="np. 3 lata"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dog-sex">Płeć</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger id="dog-sex">
                  <SelectValue placeholder="Wybierz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suka">Suka</SelectItem>
                  <SelectItem value="pies">Pies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dog-breed">Rasa</Label>
            <Input
              id="dog-breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="np. mieszaniec"
            />
          </div>
          <div className="grid gap-2">
            <Label id="dog-photo-label" htmlFor="dog-photo">
              Zdjęcie (opcjonalnie)
            </Label>
            <div className="flex flex-col items-start gap-3 rounded-xl border border-primary/15 p-3 sm:flex-row sm:items-center">
              {photoPreview || (!removePhoto && currentPhotoUrl) ? (
                <img
                  src={photoPreview ?? currentPhotoUrl}
                  alt="Podgląd zdjęcia psa"
                  className="size-20 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-sage">
                  <ImagePlus className="size-7 text-primary" />
                </div>
              )}
              <div className="grid w-full min-w-0 flex-1 gap-2">
                <input
                  ref={photoInputRef}
                  id="dog-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (!file) return;
                    if (!file.type.startsWith("image/")) {
                      toast.error("Wybierz plik graficzny");
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("Zdjęcie może mieć maksymalnie 10 MB");
                      return;
                    }
                    setPhoto(file);
                    setRemovePhoto(false);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  aria-describedby="dog-photo-label"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Wybierz plik
                </Button>
                {photo && (
                  <p className="break-all px-4 text-xs text-muted-foreground" role="status">
                    {photo.name}
                  </p>
                )}
                {(photo || (!removePhoto && dog?.photo_url)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit"
                    onClick={() => {
                      setPhoto(null);
                      setRemovePhoto(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                    Usuń zdjęcie
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
