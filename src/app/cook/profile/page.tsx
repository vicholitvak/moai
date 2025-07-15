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

export default function CookProfilePage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-headline mb-6">Cook Profile</h1>
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
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save</Button>
          </CardFooter>
        </Card>

        <Separator className="my-8" />

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
              <Input id="specialties" defaultValue="Authentic Italian, Handmade Pasta" />
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
                defaultValue="With over 15 years of experience in traditional Italian kitchens, I bring the taste of Italy to your home. My passion is fresh, locally-sourced ingredients and classic recipes passed down through generations."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Input id="availability" defaultValue="Weekdays 6 PM - 10 PM, Weekends 12 PM - 11 PM" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save Culinary Details</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
