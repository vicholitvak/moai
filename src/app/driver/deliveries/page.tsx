import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default function FindDeliveriesPage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-headline mb-6">Available Deliveries</h1>
        <Card className="shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Nearby Delivery Jobs</CardTitle>
            <CardDescription>
              This map shows available deliveries. Click on a pin to see pickup and dropoff details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[600px] rounded-md overflow-hidden border-2 border-dashed flex items-center justify-center bg-muted">
                <Image 
                    src="https://placehold.co/1200x800.png" 
                    alt="Map placeholder of delivery routes"
                    width={1200}
                    height={800}
                    data-ai-hint="map city routes"
                    className="w-full h-full object-cover"
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
