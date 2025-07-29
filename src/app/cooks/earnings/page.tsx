"use client";

import { useState, useEffect } from "react";
import { Pie, PieChart, Cell, Legend, Tooltip } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

const businessModel = {
  chefCut: 0.70,
  appCut: 0.15,
  driverCut: 0.10,
  taxes: 0.05,
};

// Sample data for a $20 dish
const dishPrice = 20.00;
const chartData = [
  {
    name: "Chef's Earnings",
    value: dishPrice * businessModel.chefCut,
    fill: "hsl(var(--chart-1))",
  },
  {
    name: "App Commission",
    value: dishPrice * businessModel.appCut,
    fill: "hsl(var(--chart-2))",
  },
  {
    name: "Delivery Fee",
    value: dishPrice * businessModel.driverCut,
    fill: "hsl(var(--chart-3))",
  },
  {
    name: "Taxes & Fees",
    value: dishPrice * businessModel.taxes,
    fill: "hsl(var(--chart-4))",
  },
];

const chartConfig = {
  value: {
    label: "Value",
  },
  "Chef's Earnings": {
    label: "Chef's Earnings",
    color: "hsl(var(--chart-1))",
  },
  "App Commission": {
    label: "App Commission",
    color: "hsl(var(--chart-2))",
  },
  "Delivery Fee": {
    label: "Delivery Fee",
    color: "hsl(var(--chart-3))",
  },
  "Taxes & Fees": {
    label: "Taxes & Fees",
    color: "hsl(var(--chart-4))",
  },
};

export default function CookEarningsPage() {
  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const { user } = useAuth();
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [cookName, setCookName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // User not logged in, maybe show a message or wait.
      // For now, we'll just stop loading and show nothing.
      setIsLoading(false);
      return;
    }

    const fetchCookerInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setTotalEarnings(data.earnings || 0);
          setCookName(data.name || user.displayName || "Cook");
        } else {
          setError("Could not find user data.");
        }
      } catch (e) {
        console.error("Error fetching cooker info:", e);
        setError("Failed to fetch earnings data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCookerInfo();
  }, [user]);

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="grid gap-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-headline">
            {cookName ? `${cookName}'s ` : ""}Earnings Dashboard
          </h1>
          <p className="text-muted-foreground">
            Understand how your earnings are calculated.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Total Payout Balance</CardTitle>
            <CardDescription>This is your current available balance from all completed orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading earnings...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : totalEarnings !== null ? (
              <p className="text-4xl font-bold">${totalEarnings.toFixed(2)}</p>
            ) : (
              <p className="text-muted-foreground">No earnings data available.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">

          <CardHeader>
            <CardTitle>Example: Order Revenue Breakdown</CardTitle>
            <CardDescription>
              This chart shows how the price of a sample ${dishPrice.toFixed(2)} dish is distributed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[250px]"
            >
              <PieChart>
                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={450}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Total dish price: ${total.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              This breakdown is for illustrative purposes based on a sample dish.
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>)}