"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import withRoleAuth from "@/components/auth/withRoleAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
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
import { useToast } from "@/components/ui/use-toast";
import { firestore } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

const addressFormSchema = z.object({
  street: z.string().min(5, "Street address is too short."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(4, "Postal code is required."),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Define the tax rate for IVA in Chile
  const TAX_RATE = 0.19;
  const taxAmount = cartTotal * TAX_RATE;
  const finalTotal = cartTotal + taxAmount;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      street: "",
      city: "",
      postalCode: "",
    },
  });

  async function handlePlaceOrder(addressData: AddressFormValues) {
    if (!user || cartItems.length === 0) {
      toast({ variant: "destructive", title: "Cannot place order.", description: "Your cart is empty or you are not logged in." });
      return;
    }
    setIsProcessing(true);

    try {
      // In a real app, you would integrate with a payment gateway here.
      // For now, we'll simulate a successful payment.
      console.log("Simulating payment processing...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      console.log("Payment successful!");

      // Create the order document in Firestore
      await addDoc(collection(firestore, "orders"), {
        clientId: user.uid,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        address: addressData,
        subtotal: cartTotal,
        tax: taxAmount,
        total: finalTotal,
        status: "paid", // Initial status after payment
        createdAt: serverTimestamp(),
      });

      toast({ title: "Order placed successfully!", description: "Your order is being prepared." });
      clearCart();
      router.push("/user/orders"); // Redirect to their orders page

    } catch (error) {
      console.error("Error placing order:", error);
      toast({ variant: "destructive", title: "Order failed", description: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-headline">Checkout</h1>
          <p className="text-muted-foreground">
            Review your order and proceed to payment.
          </p>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="Av. Providencia 123" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Santiago" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="7500000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ${(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (19%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          className="w-full mt-8"
          size="lg"
          onClick={form.handleSubmit(handlePlaceOrder)}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Place Order & Pay"}
        </Button>
      </div>
    </main>
  );
}

export default withRoleAuth(CheckoutPage, ['client']);