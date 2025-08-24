import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { loginSchema, type LoginData } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SunflowerLogo } from "@/components/ui/sunflower-logo";

export default function Landing() {
  const { toast } = useToast();
  const [showLogin, setShowLogin] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-light to-gray-50 abstract-bg">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-secondary-green/20 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-accent-yellow/30 rounded-full"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-primary-green/15 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-light-yellow/25 rounded-full"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 px-8">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <SunflowerLogo className="w-16 h-16" />
              </div>
              <h1 className="text-2xl font-bold text-primary-green mb-2">RightHere</h1>
              <p className="text-neutral-medium">Your child's afterschool community</p>
            </div>

            {!showLogin ? (
              <>
                {/* Welcome Message */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-neutral-dark mb-4">
                    Welcome Parents!
                  </h2>
                  <p className="text-neutral-medium mb-6">
                    Discover amazing afterschool activities and manage your child's schedule with ease. 
                    Join our community of engaged parents today.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowLogin(true)}
                    className="w-full bg-primary-green hover:bg-primary-green/90 text-white py-3 text-base font-semibold"
                    data-testid="button-show-login"
                  >
                    Sign In
                  </Button>
                  
                  <Link href="/register">
                    <Button 
                      variant="outline"
                      className="w-full border-primary-green text-primary-green hover:bg-primary-green hover:text-white py-3 text-base font-semibold"
                      data-testid="button-register"
                    >
                      Create Account
                    </Button>
                  </Link>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                  <p className="text-sm text-neutral-medium">
                    Secure • Trusted • Community-Focused
                  </p>
                </div>
              </>
            ) : !showOAuth ? (
              <>
                {/* Login Form */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-dark mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-neutral-medium">
                    Sign in to your account
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
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

                <div className="relative mb-6">
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
                  className="w-full mb-4"
                  data-testid="button-show-oauth"
                >
                  Sign in with Replit
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-neutral-medium">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary-green hover:underline">
                      Sign up
                    </Link>
                  </p>
                  <Button
                    onClick={() => setShowLogin(false)}
                    variant="ghost"
                    className="text-sm"
                    data-testid="button-back-to-welcome"
                  >
                    ← Back
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* OAuth Login */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-dark mb-2">
                    Continue with Replit
                  </h2>
                  <p className="text-neutral-medium mb-6">
                    Sign in with your existing Replit account
                  </p>
                  
                  <Button
                    onClick={handleReplitLogin}
                    className="w-full bg-primary-green hover:bg-primary-green/90 mb-4"
                    data-testid="button-replit-login"
                  >
                    Continue with Replit
                  </Button>
                  
                  <Button
                    onClick={() => setShowOAuth(false)}
                    variant="ghost"
                    className="w-full"
                    data-testid="button-back-to-email"
                  >
                    ← Back to email login
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}