import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadDogPhoto } from "@/lib/dogs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setAge("");
    setBreed("");
    setSex("");
    setPhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Podaj imię psa");
      return;
    }
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadDogPhoto(photo);

      const { data, error } = await supabase
        .from("dogs")
        .insert({
          name: name.trim(),
          age: age.trim() || null,
          breed: breed.trim() || null,
          sex: sex || null,
          photo_url: photoUrl,
        })
        .select("id")
        .single();
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["dogs"] });
      toast.success(`${name.trim()} dodany do dziennika`);
      reset();
      onOpenChange(false);
      navigate({ to: "/pies/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać psa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Dodaj psa
          </DialogTitle>
          <DialogDescription>Podstawowe informacje o podopiecznym.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="dog-name">Imię</Label>
            <Input
              id="dog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Lucy"
              autoFocus
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
              <Label>Płeć</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger>
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
            <Label htmlFor="dog-photo">Zdjęcie (opcjonalnie)</Label>
            <Input
              id="dog-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
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
