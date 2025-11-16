// src/components/layout/header.tsx
"use client";

import React from "react";
import { Search, Menu } from "lucide-react"; // Import Menu icon
import { Input } from "@/components/ui/input";
// --- START OF FIX ---
// Import Sheet components, SheetTitle, and the Sidebar
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle, // 1. Import SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar"; // Import the sidebar
// --- END OF FIX ---

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      {/* --- START OF CHANGE --- */}
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            {/* 2. Add a hidden title for accessibility */}
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

            {/* Use the existing Sidebar component inside the sheet */}
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>
      {/* --- END OF CHANGE --- */}

      {/* Original Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-9 bg-background focus:bg-card"
        />
      </div>
    </header>
  );
}
