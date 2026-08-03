import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LogInPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="w-full max-w-xl rounded-lg border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:p-10 xl:p-12">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Sign in to continue</h1>
      </div>

      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoComplete="email"
              className="min-h-12 rounded-lg border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 focus:border-slate-900 focus:ring-0! focus:outline-0!"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 block" htmlFor="password">
              Password
            </label>
            <button className="text-xs font-medium text-slate-600 transition hover:text-slate-950 cursor-pointer" type="button">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              autoComplete="current-password"
              className="min-h-12 rounded-lg border-slate-300 bg-white px-10 text-sm text-slate-950 focus:border-slate-900 focus:ring-slate-900/10"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button">
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer selection:bg-transparent">
          <input className="size-4 rounded border-slate-300 accent-slate-900 cursor-pointer" type="checkbox" />
          Keep me signed in
        </label>

        <Button className="h-12 w-full rounded-lg text-sm cursor-pointer" size="lg" type="submit">
          Sign in
        </Button>
      </form>
    </section>
  );
}

export default LogInPage;
