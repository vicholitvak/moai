
"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const businessModel = {
  chefCut: 0.70,  // 70% of the dish price
  appCut: 0.15,     // 15% commission
  driverCut: 0.10, // 10% for delivery
  taxes: 0.05,      // 5% for taxes/fees
};

// Sample data for a $20 dish
const dishPrice = 20.00;
const chartData = [
  { name: "Chef's Earnings", value: dishPrice * businessModel.chefCut, fill: "hsl(var(--chart-1))" },
  { name: "App Commission", value: dishPrice * businessModel.appCut, fill: "hsl(var(--chart-2))" },
  { name: "Delivery Fee", value: dishPrice * businessModel.driverCut, fill: "hsl(var(--chart-3))" },
  { name: "Taxes & Fees", value: dishPrice * businessModel.taxes, fill: "hsl(var(--chart-4))" },
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

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <h1 className="text-3xl font-headline">Earnings Dashboard</h1>
            <p className="text-muted-foreground">Understand how your earnings are calculated.</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Order Revenue Breakdown</CardTitle>
            <CardDescription>
              This chart shows how the total price paid by the customer for a ${dishPrice.toFixed(2)} dish is distributed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                 <Legend content={({ payload }) => {
                    return (
                        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm">
                        {payload?.map((entry, index) => (
                            <li key={`item-${index}`} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: entry.color}} />
                            <span className="text-muted-foreground">{entry.value}</span>
                            <span>
                                ${chartData[index].value.toFixed(2)}
                            </span>
                            </li>
                        ))}
                        </ul>
                    )
                    }} />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm border-t pt-6">
            <div className="flex w-full items-center justify-between font-medium">
              <span>Your Payout (70% of dish price)</span>
              <span>${(dishPrice * businessModel.chefCut).toFixed(2)}</span>
            </div>
            <div className="flex w-full items-center justify-between text-muted-foreground">
              <span>App Commission (15%)</span>
              <span>${(dishPrice * businessModel.appCut).toFixed(2)}</span>
            </div>
            <div className="flex w-full items-center justify-between text-muted-foreground">
              <span>Delivery Fee (10%)</span>
              <span>${(dishPrice * businessModel.driverCut).toFixed(2)}</span>
            </div>
            <div className="flex w-full items-center justify-between text-muted-foreground">
              <span>Taxes & Processing (5%)</span>
              <span>${(dishPrice * businessModel.taxes).toFixed(2)}</span>
            </div>
            <div className="flex w-full items-center justify-between font-bold text-lg mt-2 border-t pt-2">
              <span>Total Customer Price</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
