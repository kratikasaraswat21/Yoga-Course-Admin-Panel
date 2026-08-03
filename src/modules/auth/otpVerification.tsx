import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function OTPVerificationPage() {
  return (
    <section className="w-full max-w-xl rounded-lg border border-white/60 bg-white/95 p-6 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:p-10 xl:p-12">
      <div className="mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
        <ShieldCheck aria-hidden="true" className="size-7" />
      </div>

      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Verification</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Enter verification code</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Enter the six-digit code sent to your email address.
        </p>
      </div>

      <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
        <InputOTP aria-label="Verification code" maxLength={6}>
          <InputOTPGroup className="mx-auto gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot
                className="size-12 rounded-lg border border-slate-300 text-base text-slate-950 shadow-none first:rounded-lg last:rounded-lg data-[active=true]:border-slate-900 data-[active=true]:ring-0"
                index={index}
                key={index}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button className="h-12 w-full rounded-lg text-sm cursor-pointer" size="lg" type="submit">Verify code</Button>
      </form>
    </section>
  );
}

export default OTPVerificationPage;
