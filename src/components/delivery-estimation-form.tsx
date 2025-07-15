"use client";

import { useFormState, useFormStatus } from "react-dom";
import { getDeliveryTimeEstimate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";

const initialState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Estimating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" /> Get Estimate
        </>
      )}
    </Button>
  );
}

export function DeliveryEstimationForm() {
  const [state, formAction] = useFormState(getDeliveryTimeEstimate, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && state.message !== "Estimation successful.") {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
    if(state.message === "Estimation successful.") {
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div>
      <form ref={formRef} action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cookAvailability">Cook Availability</Label>
            <Input id="cookAvailability" name="cookAvailability" placeholder="e.g., Mon-Fri 5pm-10pm" required />
            {state.errors?.cookAvailability && <p className="text-sm text-destructive">{state.errors.cookAvailability[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cookSpecialties">Cook Specialties</Label>
            <Input id="cookSpecialties" name="cookSpecialties" placeholder="e.g., Italian, Mexican" required />
            {state.errors?.cookSpecialties && <p className="text-sm text-destructive">{state.errors.cookSpecialties[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="preparationTime">Preparation Time (minutes)</Label>
            <Input id="preparationTime" name="preparationTime" type="number" placeholder="30" required />
            {state.errors?.preparationTime && <p className="text-sm text-destructive">{state.errors.preparationTime[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDistance">Delivery Distance (km)</Label>
            <Input id="deliveryDistance" name="deliveryDistance" type="number" step="0.1" placeholder="5" required />
            {state.errors?.deliveryDistance && <p className="text-sm text-destructive">{state.errors.deliveryDistance[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentOrders">Current Active Orders</Label>
            <Input id="currentOrders" name="currentOrders" type="number" placeholder="2" required />
            {state.errors?.currentOrders && <p className="text-sm text-destructive">{state.errors.currentOrders[0]}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="timeOfOrder">Time of Order</Label>
            <Input id="timeOfOrder" name="timeOfOrder" type="datetime-local" required />
            {state.errors?.timeOfOrder && <p className="text-sm text-destructive">{state.errors.timeOfOrder[0]}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea id="customerAddress" name="customerAddress" placeholder="123 Main St, Anytown, USA" required />
            {state.errors?.customerAddress && <p className="text-sm text-destructive">{state.errors.customerAddress[0]}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <SubmitButton />
        </div>
      </form>

      {state.data && (
        <Card className="mt-8 bg-secondary/50 animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Estimation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Estimated Delivery Time</Label>
              <p className="text-lg font-semibold text-primary">{state.data.estimatedDeliveryTime}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Reasoning</Label>
              <p className="text-sm">{state.data.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
