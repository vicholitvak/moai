import { DeliveryEstimationForm } from "@/components/delivery-estimation-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DeliveryEstimatorPage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-headline mb-6">Delivery Time Estimator</h1>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Estimate Delivery Time</CardTitle>
            <CardDescription>
              Fill in the details below to get an AI-powered delivery time
              estimate for your order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryEstimationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
