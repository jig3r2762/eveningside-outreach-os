"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowRight, ShieldCheck, Sparkles, Check } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SALES");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Fallback to login
        router.push("/login?registered=true");
      } else {
        // Proceed to interactive onboarding
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b10] px-4 py-12 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Join Evening Side Labs</h1>
          <p className="text-xs text-slate-400">
            High-velocity sales operating system for automated manufacturing outreach.
          </p>
        </div>

        {/* Card */}
        <Card className="border-[#1e2330] bg-[#0f121a]/90 backdrop-blur-xl shadow-2xl text-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-white">Create your account</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Set up your sales representative or admin profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-slate-300">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jigar Shankhpal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#151923] border-[#262c3d] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-300">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@eveningsidelabs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#151923] border-[#262c3d] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#151923] border-[#262c3d] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9 text-xs"
                  required
                  minLength={6}
                />
                <span className="text-[10px] text-slate-500">Minimum 6 characters</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Account Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("SALES")}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                      role === "SALES"
                        ? "border-indigo-500 bg-indigo-950/40 text-white font-medium"
                        : "border-[#262c3d] bg-[#151923] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">Sales Rep</div>
                      <div className="text-[10px] text-slate-500">Outreach & Deals</div>
                    </div>
                    {role === "SALES" && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                      role === "ADMIN"
                        ? "border-indigo-500 bg-indigo-950/40 text-white font-medium"
                        : "border-[#262c3d] bg-[#151923] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">Admin</div>
                      <div className="text-[10px] text-slate-500">Full Master Ops</div>
                    </div>
                    {role === "ADMIN" && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                </div>
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
                {loading ? "Creating account..." : (
                  <>
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
