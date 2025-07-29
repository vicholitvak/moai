"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const signupFormSchema = z.object({
  name: z.string().min(2, "Name is too short."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["client", "cooker", "delivery"]),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const [signupError, setSignupError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "client" },
  });

  async function onSubmit(data: SignupFormValues) {
    setSignupError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: data.name });

      // Create user document in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        name: data.name,
        email: data.email,
        role: data.role,
      });

      // Redirect to the dashboard, which will handle the next step
      router.push("/dashboard");

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setSignupError("This email is already registered. Please log in.");
      } else {
        console.error("Signup failed:", error);
        setSignupError("An unexpected error occurred. Please try again.");
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join our community of food lovers and cooks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>I am a...</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger></FormControl><SelectContent><SelectItem value="client">Client</SelectItem><SelectItem value="cooker">Cook</SelectItem><SelectItem value="delivery">Driver</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              {signupError && <p className="text-sm font-medium text-destructive">{signupError}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creating Account..." : "Sign Up"}</Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">Log in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}