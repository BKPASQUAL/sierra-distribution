// src/app/(dashboard)/bills/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Printer,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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

// Types for API data
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

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [billDate, setBillDate] = useState("");
  const [billNo, setBillNo] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("credit");
  const [paidAmount, setPaidAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Search dropdown states
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: "",
    discount: "",
    additionalDiscount: "",
    sellingPrice: "",
  });

  // Initial Fetch: Order, Customers, Products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        if (customersData.customers) setCustomers(customersData.customers);
        if (productsData.products) setProducts(productsData.products);

        if (orderId) {
          const orderRes = await fetch(`/api/orders/${orderId}`);
          const orderData = await orderRes.json();

          if (!orderRes.ok) throw new Error(orderData.error);

          const order = orderData.order;

          // Populate Form
          setCustomerId(
            order.customerName
              ? customersData.customers?.find(
                  (c: Customer) => c.name === order.customerName
                )?.id || ""
              : ""
          );
          setBillNo(order.billNo);
          setBillDate(order.date ? order.date.split("T")[0] : "");
          setPaymentType(
            order.paymentType ? order.paymentType.toLowerCase() : "credit"
          );

          if (order.subtotal > 0 && order.discountAmount > 0) {
            setBillDiscount(
              parseFloat(((order.discountAmount / order.subtotal) * 100).toFixed(2))
            );
          }

          if (order.items && productsData.products) {
            const mappedItems: BillItem[] = order.items.map((item: any) => {
              const product = productsData.products.find(
                (p: Product) => p.id === item.productId
              );
              
              // The database unit_price holds the Gross Price (MRP)
              const mrp = product?.mrp > 0 ? product.mrp : (item.unitPrice || 0);
              const costPrice = product?.cost_price || 0;
              
              // If the product has a standard selling_price, use it to calculate the standard discount
              const defaultSellingPrice = product?.selling_price || mrp;
              const standardDiscount = mrp > 0 ? parseFloat((((mrp - defaultSellingPrice) / mrp) * 100).toFixed(2)) : 0;
              
              // The database has the TOTAL discount percent applied to the Gross Price
              const totalDiscount = item.discount || 0;
              
              // We separate it back out for the UI
              let baseDiscount = standardDiscount;
              let addDiscount = totalDiscount - standardDiscount;
              
              // If the item was sold at a lesser discount than standard, or some weird anomaly
              if (addDiscount < 0) {
                 baseDiscount = totalDiscount;
                 addDiscount = 0;
              }
              
              // Reconstruct the selling price and final price
              const sellingPrice = mrp - (mrp * baseDiscount) / 100;
              const finalPrice = sellingPrice - (sellingPrice * addDiscount) / 100;

              return {
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                mrp: mrp,
                discount: baseDiscount,
                additionalDiscount: addDiscount,
                sellingPrice: sellingPrice,
                finalPrice: finalPrice,
                total: finalPrice * item.quantity,
                costPrice: costPrice,
                profit: (finalPrice - costPrice) * item.quantity,
              };
            });
            setItems(mappedItems);
          }

          if (typeof order.paidAmount === "number") {
            setPaidAmount(order.paidAmount);
          } else if (order.paymentStatus === "paid") {
            setPaidAmount(order.total);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load bill data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Auto-populate selling price and calculate discount when product is selected
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

  // Handler for discount change
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
      setCurrentItem({
        ...currentItem,
        discount: value,
      });
    }
  };

  // Handler for selling price change
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
      setCurrentItem({
        ...currentItem,
        sellingPrice: value,
      });
    }
  };

  // Calculate final price after additional discount
  const calculateFinalPrice = (
    sellingPrice: number,
    additionalDiscount: number
  ) => {
    return sellingPrice - (sellingPrice * additionalDiscount) / 100;
  };

  // Add item to bill
  const handleAddItem = () => {
    const quantity = parseInt(currentItem.quantity) || 0;

    if (!currentItem.productId || quantity <= 0) {
      toast.error("Please select product and enter quantity");
      return;
    }

    const product = products.find((p) => p.id === currentItem.productId);
    if (!product) return;

    if (quantity > product.stock_quantity) {
      toast.warning(
        `Only ${product.stock_quantity} ${product.unit_of_measure}s available in stock`
      );
      // Wait, we should allow adding if they are editing, but let's just warn instead of block?
      // Actually keeping the block from new/page is safer, but wait, if stock is 0 they can't add MORE.
      // We will allow it for Edit Page just warn:
      // return; 
    }

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

  // Remove item from bill
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const billDiscountAmount = (subtotal * billDiscount) / 100;
  const finalTotal = subtotal - billDiscountAmount;
  const balance = Math.max(0, finalTotal - paidAmount);

  // Update bill
  const handleUpdateBill = async () => {
    if (isSubmitting) return;

    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!billNo.trim()) {
      toast.error("Please enter an invoice number");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare order items data - using mrp as unit_price to prevent double discounting in DB
      const orderItems = items.map((item) => {
        // Calculate the true overall discount percentage based on MRP and final price
        // This ensures the DB generated line_total accurately matches finalPrice * quantity
        const totalDiscountPercent = item.mrp > 0 
          ? parseFloat((((item.mrp - item.finalPrice) / item.mrp) * 100).toFixed(4))
          : 0;

        return {
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.mrp, // Must send gross price to DB
          discount_percent: totalDiscountPercent,
        };
      });

      const orderData = {
        order_number: billNo,
        customer_id: customerId,
        order_date: billDate,
        items: orderItems,
        subtotal: subtotal,
        discount_amount: billDiscountAmount,
        total_amount: finalTotal,
        payment_method: paymentType,
        payment_status:
          paidAmount >= finalTotal
            ? "paid"
            : paidAmount > 0
            ? "partial"
            : "unpaid",
        notes: `Bill updated via Edit. Balance: LKR ${balance.toLocaleString()}`,
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

      toast.success(`Bill Updated Successfully!`);
      router.push("/bills");
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error(`Error updating bill: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAndPrint = async () => {
    await handleUpdateBill();
    // In a real scenario we'd want to wait for router push before print,
    // but window.print() is acceptable if they stay on page or before navigating.
    window.print();
  };

  // Get current MRP for display
  const getCurrentMRP = () => {
    if (currentItem.productId) {
      const product = products.find((p) => p.id === currentItem.productId);
      return product?.mrp || 0;
    }
    return 0;
  };

  // Get available products (not already added to bill and in stock)
  // For Edit Page, we might not want to strictly filter out `items` if they want to add same item twice,
  // but let's stick to the same logic as new/page.tsx
  const availableProducts = products
    // .filter((product) => product.stock_quantity > 0)
    .filter((product) => !items.some((item) => item.productId === product.id));

  // Get selected product name for display
  const getSelectedProductName = () => {
    const product = products.find((p) => p.id === currentItem.productId);
    return product ? `${product.name} - ${product.sku}` : "Select product";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="text-lg">Loading Bill Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-row items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/bills")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Edit Bill</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-1">
              Update invoice details and items
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={handleUpdateBill}
            disabled={items.length === 0 || !customerId || !billNo.trim() || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? "Updating..." : "Update Bill"}
          </Button>
          <Button
            onClick={handleUpdateAndPrint}
            disabled={items.length === 0 || !customerId || !billNo.trim() || isSubmitting}
            className="w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 mr-2" />
            Update & Print
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
                    <CommandInput placeholder="Search customer by name, phone, or city..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.phone || ""} ${
                              customer.city || ""
                            } ${customer.id}`}
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
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {customer.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {customer.phone && `Phone: ${customer.phone}`}
                                {customer.phone && customer.city && " | "}
                                {customer.city && `City: ${customer.city}`}
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
                placeholder="YYYY-MM-DD"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billNo">Invoice No *</Label>
              <Input
                id="billNo"
                placeholder="INV-001"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-4 lg:col-span-1">
              <Label>Product *</Label>
              <Popover
                open={productSearchOpen}
                onOpenChange={setProductSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchOpen}
                    className="w-full h-10 justify-between text-left"
                  >
                    <span className="truncate block flex-1 mr-2">
                      {currentItem.productId
                        ? getSelectedProductName()
                        : "Select product"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search product by name or SKU..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {availableProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.name} ${product.sku} ${product.id}`}
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
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {product.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                SKU: {product.sku} | Stock:{" "}
                                {product.stock_quantity}{" "}
                                {product.unit_of_measure}
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
              <Label>Quantity *</Label>
              <Input
                placeholder="Enter quantity"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    quantity: e.target.value,
                  })
                }
                className="w-full h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>MRP (LKR)</Label>
              <Input
                disabled
                value={getCurrentMRP() || ""}
                placeholder="MRP"
                className="w-full h-10 bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                placeholder="Enter discount"
                value={currentItem.discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-full h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Selling Price (LKR)</Label>
              <Input
                placeholder="Enter selling price"
                value={currentItem.sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                className="w-full h-10 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label>Add. Discount (%)</Label>
              <Input
                placeholder="Enter additional discount"
                value={currentItem.additionalDiscount}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    additionalDiscount: e.target.value,
                  })
                }
                className="w-full h-10"
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-4 lg:col-span-1">
              <Label className="invisible hidden lg:block">Add</Label>
              <Button onClick={handleAddItem} className="w-full h-10 mt-0 lg:mt-8">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Items ({items.length})</CardTitle>
          <CardDescription>Review items and totals</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items added yet</p>
              <p className="text-sm mt-1">
                Add products above to create invoice
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-card relative">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    
                    <div className="font-medium pr-8">{item.productName}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Qty:</div>
                      <div className="text-right font-medium">{item.quantity} {item.unit}s</div>
                      
                      <div className="text-muted-foreground">MRP:</div>
                      <div className="text-right">LKR {item.mrp.toLocaleString()}</div>
                      
                      <div className="text-muted-foreground">Discount ({item.discount}%):</div>
                      <div className="text-right text-green-600 font-medium">LKR {item.sellingPrice.toLocaleString()}</div>
                      
                      {item.additionalDiscount > 0 && (
                        <>
                          <div className="text-muted-foreground">Add. Disc ({item.additionalDiscount}%):</div>
                          <div className="text-right text-orange-600 font-medium">LKR {item.finalPrice.toLocaleString()}</div>
                        </>
                      )}
                      
                      <div className="text-muted-foreground font-semibold mt-1">Total:</div>
                      <div className="text-right font-bold text-blue-600 mt-1">LKR {item.total.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">MRP</TableHead>
                      <TableHead className="text-right">Disc. (%)</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead className="text-right">Add. Disc. (%)</TableHead>
                      <TableHead className="text-right">Final Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit}s
                        </TableCell>
                        <TableCell className="text-right">
                          LKR {item.mrp.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {item.discount}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {item.sellingPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {item.additionalDiscount}%
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          LKR {item.finalPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {item.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Section */}
              <div className="mt-6 border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        LKR {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Bill Discount:
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Discount %"
                          value={billDiscount}
                          onChange={(e) =>
                            setBillDiscount(parseFloat(e.target.value) || 0)
                          }
                          className="w-24 h-10 text-right"
                        />
                        <span>%</span>
                        <span className="font-medium text-green-600">
                          -LKR {billDiscountAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <span>Final Total:</span>
                      <span>LKR {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details (Read Only)</CardTitle>
          <CardDescription>Payment amount is managed in the main bill page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType} className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="font-normal cursor-pointer">
                  Cash
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="credit" />
                <Label htmlFor="credit" className="font-normal cursor-pointer">
                  Credit
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="font-normal cursor-pointer">
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cheque" id="cheque" />
                <Label htmlFor="cheque" className="font-normal cursor-pointer">
                  Cheque
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidAmount">Paid Amount (LKR)</Label>
            <Input
              id="paidAmount"
              placeholder="Enter paid amount"
              value={paidAmount}
              disabled
              className="w-full h-10 bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              To add or change payments, please use the main bill details page.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Balance</Label>
            <div
              className={`text-2xl font-bold ${
                balance > 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              LKR {balance.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add bottom padding to account for fixed action bar on mobile */}
      <div className="h-24 sm:h-0"></div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 sm:static sm:p-0 sm:bg-transparent sm:border-none sm:z-auto flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-8 pb-4 sm:pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none">
        <Button variant="outline" onClick={() => router.push("/bills")} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={handleUpdateBill}
          disabled={items.length === 0 || !customerId || !billNo.trim()}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          Update Bill
        </Button>
        <Button
          onClick={handleUpdateAndPrint}
          disabled={items.length === 0 || !customerId || !billNo.trim()}
          className="w-full sm:w-auto"
        >
          <Printer className="w-4 h-4 mr-2" />
          Update & Print Invoice
        </Button>
      </div>
    </div>
  );
}
