"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b10] px-4 py-12 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Outreach OS v2</h1>
          <p className="text-xs text-slate-400">
            Evening Side Labs • Sales Operating & Outreach Engine
          </p>
        </div>

        {/* Card */}
        <Card className="border-[#1e2330] bg-[#0f121a]/90 backdrop-blur-xl shadow-2xl text-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-white">Sign in to your account</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your credentials to access your pipeline and tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jigar@eveningsidelabs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#151923] border-[#262c3d] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs text-slate-300">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#151923] border-[#262c3d] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9 text-xs"
                  required
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-9 text-xs gap-1.5 shadow-md shadow-indigo-600/30"
              >
                {loading ? "Signing in..." : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 space-y-2">
          <div>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-indigo-400 hover:underline">
              Sign up
            </Link>
          </div>
          <div className="text-[10px] text-slate-500">
            Internal Platform • Powered by Supabase PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
}
