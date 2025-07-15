
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
import { Separator } from "@/components/ui/separator";
import { CreditCard, Home, Trash2 } from "lucide-react";

export default function UserProfilePage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-headline mb-6">User Profile</h1>

        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Alex Johnson" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="alex.j@example.com" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="picture">Profile Picture</Label>
                <Input id="picture" type="file" />
             </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save Profile</Button>
          </CardFooter>
        </Card>

        <Separator className="my-8" />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Delivery Addresses</CardTitle>
            <CardDescription>
              Manage your saved addresses for faster checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div className="flex items-center gap-4">
                <Home className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium">Home</p>
                  <p className="text-sm text-muted-foreground">
                    123 Sunny Lane, Apt 4B, Flavor Town, USA 12345
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline">Add New Address</Button>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Add and manage your payment options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border p-4">
                <div className="flex items-center gap-4">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Visa ending in 4242</p>
                        <p className="text-sm text-muted-foreground">
                            Expires 12/2026
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <Button variant="outline">Add New Payment Method</Button>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-3">
            <p className="text-xs text-muted-foreground">
                Your payment information is stored securely.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

