import { DeliveryEstimationForm } from '@/components/delivery-estimation-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">AI Delivery Estimator</CardTitle>
            <CardDescription>
              Fill in the details below to get an AI-powered delivery time estimation for your order.
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
