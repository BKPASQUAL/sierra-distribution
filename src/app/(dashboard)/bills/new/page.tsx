// src/app/(dashboard)/bills/new/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Printer,
  Check,
  ChevronsUpDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function CreateBillPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [billNo, setBillNo] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState("credit");
  const [paidAmount, setPaidAmount] = useState(0);

  // API data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

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

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (data.customers) {
          setCustomers(data.customers);
        } else {
          console.error("Failed to fetch customers:", data.error);
          alert(`Error fetching customers: ${data.error}`);
        }
      } catch (error) {
        console.error("Network error fetching customers:", error);
        alert("Network error fetching customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (data.products) {
          setProducts(data.products);
        } else {
          console.error("Failed to fetch products:", data.error);
          alert(`Error fetching products: ${data.error}`);
        }
      } catch (error) {
        console.error("Network error fetching products:", error);
        alert("Network error fetching products");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Auto-populate selling price and calculate discount when product is selected
  useEffect(() => {
    if (currentItem.productId) {
      const product = products.find((p) => p.id === currentItem.productId);
      if (product) {
        // Use product's selling_price from database
        const productSellingPrice = product.selling_price;

        // Calculate discount percentage based on MRP and selling_price
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
      // Calculate discount from selling price: discount% = ((MRP - SellingPrice) / MRP) * 100
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
      alert("Please select product and enter quantity");
      return;
    }

    const product = products.find((p) => p.id === currentItem.productId);
    if (!product) return;

    if (quantity > product.stock_quantity) {
      alert(
        `Only ${product.stock_quantity} ${product.unit_of_measure}s available in stock`
      );
      return;
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
  const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);
  const billDiscountAmount = (subtotal * billDiscount) / 100;
  const finalTotal = subtotal - billDiscountAmount;
  const balance = finalTotal - paidAmount;

  // Auto-set paid amount for cash only
  useEffect(() => {
    if (paymentType === "cash") {
      setPaidAmount(finalTotal);
    }
  }, [paymentType, finalTotal]);

  // Save bill
  const handleSaveBill = async () => {
    if (!customerId) {
      alert("Please select a customer");
      return;
    }
    if (!billNo.trim()) {
      alert("Please enter an invoice number");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    try {
      // Prepare order items data - using finalPrice as unit_price
      const orderItems = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.finalPrice,
        discount_percent: item.discount + item.additionalDiscount, // Combined discount
      }));

      // Prepare order data
      const orderData = {
        order_number: billNo,
        customer_id: customerId,
        order_date: billDate,
        items: orderItems,
        subtotal: subtotal,
        discount_amount: billDiscountAmount,
        total_amount: finalTotal,
        payment_method: paymentType,
        paid_amount: paidAmount,
        notes: `Bill created via POS. Balance: LKR ${balance.toLocaleString()}`,
      };

      // Call API to create order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create bill");
      }

      // Determine payment status for message
      let paymentStatusText = "Unpaid";
      if (paidAmount >= finalTotal) {
        paymentStatusText = "Fully Paid";
      } else if (paidAmount > 0) {
        paymentStatusText = "Partially Paid";
      }

      // Show success message with profit information
      const profitInfo = result.profit
        ? `\n\n✅ Total Profit: LKR ${result.profit.toLocaleString()}`
        : "";

      alert(
        `✅ Bill Saved Successfully!${profitInfo}\n\n📦 Stock has been updated.\n💰 Payment Status: ${paymentStatusText}`
      );
      router.push("/bills");
    } catch (error) {
      console.error("Error saving bill:", error);
      alert(`❌ Error saving bill: ${(error as Error).message}`);
    }
  };

  const handleSaveAndPrint = async () => {
    await handleSaveBill();
    // Trigger print dialog
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

  // Calculate final price preview for current item
  const currentFinalPrice = calculateFinalPrice(
    parseFloat(currentItem.sellingPrice) || 0,
    parseFloat(currentItem.additionalDiscount) || 0
  );

  // Get available products (not already added to bill and in stock)
  const availableProducts = products
    .filter((product) => product.stock_quantity > 0)
    .filter((product) => !items.some((item) => item.productId === product.id));

  // Get selected product name for display
  const getSelectedProductName = () => {
    const product = products.find((p) => p.id === currentItem.productId);
    return product ? `${product.name} - ${product.sku}` : "Select product";
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Create New Bill</h1>
          <p className="text-muted-foreground mt-1">
            Generate customer invoice and update stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveBill}
            disabled={items.length === 0 || !customerId || !billNo.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </Button>
          <Button
            onClick={handleSaveAndPrint}
            disabled={items.length === 0 || !customerId || !billNo.trim()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Save & Print
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
                    disabled={loadingCustomers}
                  >
                    <span className="truncate">
                      {loadingCustomers
                        ? "Loading customers..."
                        : customerId
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
          <div className="grid gap-4 md:grid-cols-7">
            <div className="space-y-2">
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
                    className="w-full h-10 justify-between"
                    disabled={loadingProducts}
                  >
                    <span className="truncate">
                      {loadingProducts
                        ? "Loading products..."
                        : currentItem.productId
                        ? getSelectedProductName()
                        : "Select product"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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

            <div className="space-y-2">
              <Label className="invisible">Add</Label>
              <Button onClick={handleAddItem} className="w-full h-10">
                <Plus className="w-4 h-4 mr-2" />
                Add
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

              {/* Totals Section */}
              <div className="mt-6 border-t pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-3">
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
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Select payment method and amount</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
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
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              disabled={paymentType === "cash"}
              className="w-full h-10"
            />
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
            {balance > 0 && (
              <p className="text-xs text-muted-foreground">
                Outstanding balance will be tracked in due invoices
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/bills")}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveBill}
          disabled={items.length === 0 || !customerId || !billNo.trim()}
          variant="outline"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Bill
        </Button>
        <Button
          onClick={handleSaveAndPrint}
          disabled={items.length === 0 || !customerId || !billNo.trim()}
        >
          <Printer className="w-4 h-4 mr-2" />
          Save & Print Invoice
        </Button>
      </div>
    </div>
  );
}
