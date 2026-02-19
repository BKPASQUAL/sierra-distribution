// src/components/layout/header.tsx
"use client";

import React from "react";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { SierraLogo } from "@/components/ui/logo";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-card px-3 md:px-6 w-full">
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden flex-shrink-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 h-full">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Logo */}
      <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
        <SierraLogo className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">Sierra</span>
      </div>

      {/* Spacer - pushes search to the right on mobile */}
      <div className="flex-1 lg:flex-none"></div>

      {/* Search Bar - hidden on xs (phone), visible from sm+ */}
      <div className="relative hidden sm:block sm:w-48 md:w-64 lg:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-9 bg-background focus:bg-card w-full"
        />
      </div>
    </header>
  );
}
