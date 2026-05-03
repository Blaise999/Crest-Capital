import { ShieldAlert } from "lucide-react";

export function BlockedBanner() {
  return (
    <div className="mx-5 sm:mx-8 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-red-100 text-red-700 grid place-items-center shrink-0">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-red-900">
          Your account is currently suspended.
        </div>
        <p className="text-[13.5px] text-red-700 mt-0.5">
          You can still view your balance and past transactions, but you cannot send money or initiate transfers.
          Please contact support to resolve this.
        </p>
      </div>
    </div>
  );
}
