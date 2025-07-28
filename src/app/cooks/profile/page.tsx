
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { allCooks } from "@/lib/data";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const CURRENT_COOK_ID = 'cook-isabella';

export default function CookProfilePage() {
  const { toast } = useToast();
  // Find the cook's data. In a real app, this would come from an auth context.
  const [cook, setCook] = useState(() => allCooks.find(c => c.id === CURRENT_COOK_ID));

  if (!cook) {
    return <main className="flex-1 p-4 md:p-8"><p>Cook not found.</p></main>;
  }

  const handleAvailabilityChange = (checked: boolean) => {
    // Update the central data source
    const cookIndex = allCooks.findIndex(c => c.id === CURRENT_COOK_ID);
    if (cookIndex !== -1) {
      allCooks[cookIndex].isAvailable = checked;
      // Update local state to trigger a re-render
      setCook({ ...allCooks[cookIndex] });
       toast({
        title: "Availability Updated",
        description: `You are now ${checked ? "available" : "unavailable"} for orders.`,
      });
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     toast({
        title: "Profile Saved!",
        description: "Your information has been updated.",
      });
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-headline mb-6">Cook Profile</h1>
        
        <Card className="shadow-lg mb-8">
            <CardHeader>
                <CardTitle>Availability Status</CardTitle>
                <CardDescription>
                Use this toggle to start or stop receiving new orders.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                        Ready to Cook
                        </p>
                        <p className="text-sm text-muted-foreground">
                         {cook.isAvailable ? "You are currently available to take new orders." : "You are not taking new orders."}
                        </p>
                    </div>
                    <Switch
                        checked={cook.isAvailable}
                        onCheckedChange={handleAvailabilityChange}
                        aria-label="Toggle cooking availability"
                    />
                </div>
            </CardContent>
        </Card>


        <form onSubmit={handleSave}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your photo and personal details here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={cook.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="isabella.rossi@example.com" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="picture">Profile Picture</Label>
                  <Input id="picture" type="file" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Save</Button>
            </CardFooter>
          </Card>
        </form>

        <Separator className="my-8" />

        <form onSubmit={handleSave}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Culinary Details</CardTitle>
              <CardDescription>
                Showcase your expertise and what makes your food special.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Input id="specialties" defaultValue={cook.specialties.join(', ')} />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of your culinary specialties.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Your Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a little bit about yourself and your cooking passion."
                  className="min-h-[120px]"
                  defaultValue={cook.bio}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input id="availability" defaultValue={cook.availability} />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Save Culinary Details</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}
