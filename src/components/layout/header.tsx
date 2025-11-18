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

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 w-full">
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden">
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

      {/* Search Bar */}
      {/* UPDATED: Removed 'flex-1' and added 'md:w-1/3' to control size */}
      <div className="relative w-full md:w-1/5">
        {/* UPDATED: Fixed typo 'w-' to 'w-4' */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          // UPDATED: Removed typo 'W-1/2' and added 'w-full' to fill the container
          className="pl-9 bg-background focus:bg-card w-full"
        />
      </div>
    </header>
  );
}
