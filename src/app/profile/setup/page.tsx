"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import withRoleAuth from "@/components/auth/withRoleAuth";

const profileSetupSchema = z.object({
  phone: z.string().min(8, "Please enter a valid phone number."),
  address: z.object({
    fullAddress: z.string().min(1, "Address is required."),
    lat: z.number(),
    lng: z.number(),
  }),
});

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;

function ProfileSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
  });

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location && place.formatted_address) {
      form.setValue("address", {
        fullAddress: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
      form.clearErrors("address");
    }
  };

  async function onSubmit(data: ProfileSetupFormValues) {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        phone: data.phone,
        address: data.address,
      });

      toast({ title: "Profile updated successfully!" });
      router.push("/dashboard"); // Redirect to dashboard to be routed correctly
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Failed to update profile." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription>
            We need a bit more information before you can start browsing dishes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+56 9 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <AddressAutocomplete onPlaceSelect={handlePlaceSelect} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save and Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withRoleAuth(ProfileSetupPage, ['client', 'cooker', 'delivery', 'admin']);