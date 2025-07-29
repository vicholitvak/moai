"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function ShoppingCart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    // Close the sheet and navigate to checkout
    const closeButton = document.querySelector('[data-radix-dialog-close]');
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
    }
    router.push('/checkout');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          {cartItems.length > 0 ? (
            <>
              <div className="flex-1 overflow-y-auto pr-4 -mr-4 mt-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 mb-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover aspect-square"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                        <span>{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              <SheetFooter className="mt-auto border-t pt-4">
                <div className="w-full space-y-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add some delicious dishes to get started!</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}