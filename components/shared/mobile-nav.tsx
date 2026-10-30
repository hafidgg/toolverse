"use client";
import { useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "./nav-links";

// Slide-in navigation for < md screens. Radix Dialog provides focus trapping,
// Escape-to-close, aria-modal and focus return to the trigger.
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l bg-background p-6 shadow-lg focus:outline-none md:hidden">
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-lg font-semibold">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Site navigation</DialogPrimitive.Description>
          <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent"
            >
              <Search className="h-4 w-4" aria-hidden="true" /> Search
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
