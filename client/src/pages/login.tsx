import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { loginSchema, type LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Login() {
  const { toast } = useToast();
  const [showOAuth, setShowOAuth] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("/api/auth/login", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful!",
        description: "Welcome back to RightHere.",
      });
      // Reload to trigger auth state update
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your email and password.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">
            Welcome Back
          </h1>
          <p className="text-neutral-medium mb-8">
            Sign in to your RightHere account
          </p>
        </div>

        {!showOAuth ? (
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field} 
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary-green hover:bg-primary-green/90"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-medium">Or</span>
              </div>
            </div>

            <Button
              onClick={() => setShowOAuth(true)}
              variant="outline"
              className="w-full"
              data-testid="button-show-oauth"
            >
              Sign in with Replit
            </Button>

            <div className="text-center">
              <p className="text-sm text-neutral-medium">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary-green hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-neutral-medium mb-6">
                Sign in with your existing Replit account
              </p>
              
              <Button
                onClick={handleReplitLogin}
                className="w-full bg-primary-green hover:bg-primary-green/90"
                data-testid="button-replit-login"
              >
                Continue with Replit
              </Button>
              
              <Button
                onClick={() => setShowOAuth(false)}
                variant="ghost"
                className="w-full mt-4"
                data-testid="button-back-to-email"
              >
                ← Back to email login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}