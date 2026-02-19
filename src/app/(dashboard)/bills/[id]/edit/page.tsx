// src/app/(dashboard)/bills/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Types
interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
  unit_price: number;
  cost_price: number | null;
  stock_quantity: number;
  mrp: number;
  selling_price: number;
}

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  mrp: number;
  discount: number;
  additionalDiscount: number;
  sellingPrice: number;
  finalPrice: number;
  total: number;
  costPrice: number;
  profit: number;
}

export default function EditBillPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [billDate, setBillDate] = useState("");
  const [billNo, setBillNo] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("credit");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // UI State
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: "",
    discount: "",
    additionalDiscount: "",
    sellingPrice: "",
  });

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch Customers & Products in parallel
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        if (customersData.customers) setCustomers(customersData.customers);
        if (productsData.products) setProducts(productsData.products);

        // 2. Fetch Order Details
        if (orderId) {
          const orderRes = await fetch(`/api/orders/${orderId}`);
          const orderData = await orderRes.json();

          if (!orderRes.ok) throw new Error(orderData.error);

          const order = orderData.order;

          // Populate Form
          setCustomerId(
            order.customerName
              ? customersData.customers.find(
                  (c: Customer) => c.name === order.customerName,
                )?.id || ""
              : "",
          );
          setBillNo(order.billNo);
          setBillDate(order.date.split("T")[0]);
          setPaymentType(order.paymentType.toLowerCase());
          setNotes(order.notes || "");

          // Calculate Bill Discount %
          if (order.subtotal > 0 && order.discountAmount > 0) {
            const discountPercent =
              (order.discountAmount / order.subtotal) * 100;
            setBillDiscount(parseFloat(discountPercent.toFixed(2)));
          }

          // Map Order Items to Bill Items
          if (order.items && productsData.products) {
            const mappedItems: BillItem[] = order.items.map((item: any) => {
              const product = productsData.products.find(
                (p: Product) => p.id === item.productId,
              );
              const mrp = product?.mrp || item.unitPrice;
              const costPrice = product?.cost_price || 0;
              const discount = item.discount || 0;

              // Recalculate selling price based on discount
              const sellingPrice = mrp - (mrp * discount) / 100;

              return {
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                mrp: mrp,
                discount: discount,
                additionalDiscount: 0,
                sellingPrice: sellingPrice,
                finalPrice: item.unitPrice,
                // FIX: Recalculate total to ensure accuracy (Unit Price * Qty)
                // This fixes issues where DB line_total might be wrong due to double discounting
                total: item.unitPrice * item.quantity,
                costPrice: costPrice,
                profit: (item.unitPrice - costPrice) * item.quantity,
              };
            });
            setItems(mappedItems);
          }

          // Set paid amount from API (calculated from payments)
          if (typeof order.paidAmount === "number") {
            setPaidAmount(order.paidAmount);
          } else if (order.paymentStatus === "paid") {
            setPaidAmount(order.total);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load bill data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // --- REUSED LOGIC START ---

  // Auto-populate selling price and calculate discount
  useEffect(() => {
    if (currentItem.productId) {
      const product = products.find((p) => p.id === currentItem.productId);
      if (product) {
        const productSellingPrice = product.selling_price;
        const calculatedDiscount =
          product.mrp > 0
            ? ((product.mrp - productSellingPrice) / product.mrp) * 100
            : 0;

        setCurrentItem((prev) => ({
          ...prev,
          sellingPrice: productSellingPrice.toString(),
          discount: calculatedDiscount.toFixed(2),
        }));
      }
    }
  }, [currentItem.productId, products]);

  const handleDiscountChange = (value: string) => {
    const discount = parseFloat(value) || 0;
    const product = products.find((p) => p.id === currentItem.productId);
    if (product) {
      const newSellingPrice = product.mrp - (product.mrp * discount) / 100;
      setCurrentItem({
        ...currentItem,
        discount: value,
        sellingPrice: newSellingPrice.toFixed(2),
      });
    } else {
      setCurrentItem({ ...currentItem, discount: value });
    }
  };

  const handleSellingPriceChange = (value: string) => {
    const sellingPrice = parseFloat(value) || 0;
    const product = products.find((p) => p.id === currentItem.productId);
    if (product && product.mrp > 0) {
      const newDiscount = ((product.mrp - sellingPrice) / product.mrp) * 100;
      const clampedDiscount = Math.max(0, Math.min(100, newDiscount));
      setCurrentItem({
        ...currentItem,
        sellingPrice: value,
        discount: clampedDiscount.toFixed(2),
      });
    } else {
      setCurrentItem({ ...currentItem, sellingPrice: value });
    }
  };

  const calculateFinalPrice = (
    sellingPrice: number,
    additionalDiscount: number,
  ) => {
    return sellingPrice - (sellingPrice * additionalDiscount) / 100;
  };

  const handleAddItem = () => {
    const quantity = parseInt(currentItem.quantity) || 0;
    if (!currentItem.productId || quantity <= 0) {
      alert("Please select product and enter quantity");
      return;
    }

    const product = products.find((p) => p.id === currentItem.productId);
    if (!product) return;

    const discount = parseFloat(currentItem.discount) || 0;
    const additionalDiscount = parseFloat(currentItem.additionalDiscount) || 0;
    const sellingPrice = parseFloat(currentItem.sellingPrice) || 0;

    const finalPrice = calculateFinalPrice(sellingPrice, additionalDiscount);
    const costPrice = product.cost_price || 0;
    const itemProfit = (finalPrice - costPrice) * quantity;

    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: currentItem.productId,
      productName: product.name,
      quantity: quantity,
      unit: product.unit_of_measure,
      mrp: product.mrp,
      discount: discount,
      additionalDiscount: additionalDiscount,
      sellingPrice: sellingPrice,
      finalPrice: finalPrice,
      total: finalPrice * quantity,
      costPrice: costPrice,
      profit: itemProfit,
    };

    setItems([...items, newItem]);
    setCurrentItem({
      productId: "",
      quantity: "",
      discount: "",
      additionalDiscount: "",
      sellingPrice: "",
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const billDiscountAmount = (subtotal * billDiscount) / 100;
  const finalTotal = subtotal - billDiscountAmount;

  // Balance calculation (use Math.max to avoid negative zero issues)
  const balance = Math.max(0, finalTotal - paidAmount);

  // --- UPDATE HANDLER ---

  const handleUpdateBill = async () => {
    if (!customerId || !billNo.trim() || items.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const orderItems = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.finalPrice,
        discount_percent: item.discount + item.additionalDiscount,
      }));

      const orderData = {
        order_number: billNo,
        customer_id: customerId,
        order_date: billDate,
        items: orderItems,
        subtotal: subtotal,
        discount_amount: billDiscountAmount,
        total_amount: finalTotal,
        payment_method: paymentType,
        // Keep paid status logic consistent with amount paid
        payment_status:
          paidAmount >= finalTotal
            ? "paid"
            : paidAmount > 0
              ? "partial"
              : "unpaid",
        notes: notes,
      };

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update bill");
      }

      alert("✅ Bill Updated Successfully!");
      router.push("/bills");
    } catch (error) {
      console.error("Error updating bill:", error);
      alert(`❌ Error updating bill: ${(error as Error).message}`);
    }
  };

  // --- RENDER HELPERS ---

  const getCurrentMRP = () => {
    if (currentItem.productId) {
      const product = products.find((p) => p.id === currentItem.productId);
      return product?.mrp || 0;
    }
    return 0;
  };

  const getSelectedProductName = () => {
    const product = products.find((p) => p.id === currentItem.productId);
    return product ? `${product.name} - ${product.sku}` : "Select product";
  };

  const availableProducts = products
    .filter((product) => product.stock_quantity > 0)
    .filter((product) => !items.some((item) => item.productId === product.id));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading Bill Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/bills")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Bill</h1>
          <p className="text-muted-foreground mt-1">
            Update invoice details and items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleUpdateBill}>
            <Save className="w-4 h-4 mr-2" />
            Update Bill
          </Button>
        </div>
      </div>

      {/* Bill Header Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
          <CardDescription>Customer and invoice information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Popover
                open={customerSearchOpen}
                onOpenChange={setCustomerSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className="w-full h-10 justify-between"
                  >
                    <span className="truncate">
                      {customerId
                        ? customers.find((c) => c.id === customerId)?.name ||
                          "Select customer"
                        : "Select customer"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.phone}`}
                            onSelect={() => {
                              setCustomerId(customer.id);
                              setCustomerSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                customerId === customer.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {customer.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {customer.phone}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date *</Label>
              <Input
                id="date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billNo">Invoice No *</Label>
              <Input
                id="billNo"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="w-full h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items</CardTitle>
          <CardDescription>Select products and quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-7">
            <div className="space-y-2">
              <Label>Product</Label>
              <Popover
                open={productSearchOpen}
                onOpenChange={setProductSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchOpen}
                    className="w-full h-10 justify-between"
                  >
                    <span className="truncate">
                      {currentItem.productId
                        ? getSelectedProductName()
                        : "Select product"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search product..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {availableProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.name} ${product.sku}`}
                            onSelect={() => {
                              setCurrentItem({
                                ...currentItem,
                                productId: product.id,
                              });
                              setProductSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentItem.productId === product.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {product.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Stock: {product.stock_quantity}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                placeholder="Qty"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, quantity: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>MRP</Label>
              <Input disabled value={getCurrentMRP()} className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Disc (%)</Label>
              <Input
                value={currentItem.discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sell Price</Label>
              <Input
                value={currentItem.sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Add. Disc</Label>
              <Input
                value={currentItem.additionalDiscount}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    additionalDiscount: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="invisible">Add</Label>
              <Button onClick={handleAddItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead className="text-right">Disc %</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">{item.mrp}</TableCell>
                  <TableCell className="text-right">
                    {item.discount + item.additionalDiscount}%
                  </TableCell>
                  <TableCell className="text-right">
                    {item.finalPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {item.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-6 border-t pt-6 flex justify-end">
            <div className="w-full max-w-md space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  LKR {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bill Discount:</span>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-20 text-right h-8"
                    value={billDiscount}
                    onChange={(e) =>
                      setBillDiscount(parseFloat(e.target.value) || 0)
                    }
                  />
                  <span>%</span>
                  <span className="text-green-600 font-medium">
                    - {billDiscountAmount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Final Total:</span>
                <span>LKR {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Payment & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={setPaymentType}
              className="flex gap-4"
            >
              {["cash", "credit", "bank", "cheque"].map((m) => (
                <div key={m} className="flex items-center space-x-2">
                  <RadioGroupItem value={m} id={m} />
                  <Label htmlFor={m} className="capitalize">
                    {m}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Paid Amount (Read Only)</Label>
            <div className="flex items-center gap-2">
              <Input value={paidAmount} disabled className="bg-muted" />
              <div className="whitespace-nowrap font-medium">
                Balance:{" "}
                <span
                  className={balance > 0 ? "text-red-600" : "text-green-600"}
                >
                  LKR {balance.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              To add payments, please use the main bill details page.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes here..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
