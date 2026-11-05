"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

// Password-style key input. Shows the masked saved value as a placeholder; saving sends only new input.
export function KeyField({
  masked,
  placeholder,
  onSave,
  saving,
}: {
  masked: string;
  placeholder: string;
  onSave: (v: string) => void;
  saving?: boolean;
}) {
  const [val, setVal] = useState("");
  const [show, setShow] = useState(false);

  const submit = () => {
    if (!val.trim()) return;
    onSave(val.trim());
    setVal("");
    setShow(false);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Input
          type={show ? "text" : "password"}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={masked ? `Saved ${masked} — paste to replace` : placeholder}
          autoComplete="off"
          spellCheck={false}
          className="pr-11 font-mono text-[13px]"
        />
        <button
          type="button"
          aria-label={show ? "Hide key" : "Show key"}
          onClick={() => setShow((s) => !s)}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-berry-faint transition-colors hover:bg-blush-50 hover:text-blush-600"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button onClick={submit} disabled={!val.trim()} loading={saving}>
        Save key
      </Button>
    </div>
  );
}

export function StatusPill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        ok ? "bg-mint text-mint-deep" : "bg-blush-50 text-berry-faint"
      }`}
    >
      <span className="relative flex size-2">
        {ok && <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint-deep opacity-60" />}
        <span className={`relative inline-flex size-2 rounded-full ${ok ? "bg-mint-deep" : "bg-berry-faint/60"}`} />
      </span>
      {children}
    </span>
  );
}
