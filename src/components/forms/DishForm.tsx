"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { firestore, storage } from "@/lib/firebaseConfig";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

const dishFormSchema = z.object({
  name: z.string().min(3, "Dish name must be at least 3 characters."),
  description: z.string().max(500, "Description is too long.").optional(),
  price: z.coerce.number().positive("Price must be a positive number."),
  prepTime: z.coerce.number().int().positive("Preparation time must be a positive number."),
  isActive: z.boolean().default(true),
  image: z.any().refine(files => files?.length === 1 || typeof files === 'string', "Image is required."),
});

type DishFormValues = z.infer<typeof dishFormSchema>;

interface DishFormProps {
  onFinished: () => void;
  initialData?: any; // Pass existing dish data for editing
}

export function DishForm({ onFinished, initialData }: DishFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      price: 0,
      prepTime: 15,
      isActive: true,
    },
  });

  async function onSubmit(data: DishFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl = initialData?.imageUrl || "";
      const imageFile = data.image?.[0];

      // If a new image is provided, upload it
      if (imageFile) {
        const dishId = initialData?.id || doc(collection(firestore, "dishes")).id;
        const imageRef = ref(storage, `dishes/${user.uid}/${dishId}/${imageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      if (!imageUrl) {
        throw new Error("Image is required to create or update a dish.");
      }

      const dishId = initialData?.id || doc(collection(firestore, "dishes")).id;
      const dishDocRef = doc(firestore, "dishes", dishId);

      await setDoc(dishDocRef, {
        ...initialData,
        name: data.name,
        description: data.description,
        price: data.price,
        prepTime: data.prepTime,
        isActive: data.isActive,
        imageUrl: imageUrl,
        cookerId: user.uid,
        updatedAt: serverTimestamp(),
        createdAt: initialData?.createdAt || serverTimestamp(),
      }, { merge: true });

      toast({
        title: `Dish ${initialData ? 'updated' : 'created'} successfully!`,
      });
      onFinished();
    } catch (error) {
      console.error("Error saving dish:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not save the dish. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Dish Name</FormLabel><FormControl><Input placeholder="Margherita Pizza" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Classic pizza with fresh tomatoes and basil..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="prepTime" render={({ field }) => (
            <FormItem><FormLabel>Prep Time (minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="image" render={({ field }) => (
          <FormItem><FormLabel>Dish Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5"><FormLabel>Available for Ordering</FormLabel></div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Dish"}</Button>
      </form>
    </Form>
  );
}