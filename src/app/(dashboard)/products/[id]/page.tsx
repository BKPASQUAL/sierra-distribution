// src/app/(dashboard)/products/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCcw,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

// Types
interface Product {
  id: string;
  sku: string;
  name: string;
  type: string;
  size: string;
  rollLength: number;
  stock: number;
  minStock: number;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  totalValue: number;
  totalCost: number;
  profitMargin: number;
}

interface Transaction {
  id: string;
  product_id: string;
  transaction_type: "sale" | "purchase" | "adjustment" | "return";
  quantity: number;
  reference_id: string | null;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  order?: {
    order_number: string;
    order_date: string;
    customer: {
      name: string;
    };
  } | null;
  purchase?: {
    purchase_id: string;
    purchase_date: string;
  } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
    fetchTransactions();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (response.ok && data.product) {
        const dbProduct = data.product;

        // Map database product to UI product
        const unitOfMeasure = dbProduct.unit_of_measure || dbProduct.name;
        const rollLengthMatch = unitOfMeasure?.match(/(\d+)(?:m| meter)/i);
        const sizeMatch =
          dbProduct.name.match(/(\d+\.\d+|\d+)mm/i) ||
          dbProduct.description?.match(/Size: (\d+\.\d+|\d+)/i);

        const mrp = dbProduct.mrp ?? 0;
        const sellingPrice = dbProduct.selling_price ?? mrp;
        const costPrice = dbProduct.cost_price ?? 0;
        const stock = dbProduct.stock_quantity ?? 0;
        const minStock = dbProduct.reorder_level ?? 0;

        const mappedProduct: Product = {
          id: dbProduct.id.toString(),
          sku: dbProduct.sku,
          name: dbProduct.name,
          type: dbProduct.category || "Other",
          size: sizeMatch
            ? sizeMatch[1] + (dbProduct.name.includes("mm") ? "mm" : "")
            : "N/A",
          rollLength: rollLengthMatch ? parseInt(rollLengthMatch[1]) : 100,
          stock: stock,
          minStock: minStock,
          mrp: mrp,
          sellingPrice: sellingPrice,
          costPrice: costPrice,
          totalValue: stock * mrp,
          totalCost: stock * costPrice,
          profitMargin: mrp > 0 ? ((mrp - costPrice) / mrp) * 100 : 0,
        };

        setProduct(mappedProduct);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/transactions`);
      const data = await response.json();

      if (response.ok && data.transactions) {
        // Don't group - just display transactions as-is
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Button onClick={() => router.push("/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  // Stock status
  const stockStatus =
    product.stock === 0
      ? { label: "Out of Stock", color: "text-red-600", bgColor: "bg-red-50" }
      : product.stock < product.minStock
      ? {
          label: "Low Stock",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        }
      : { label: "In Stock", color: "text-green-600", bgColor: "bg-green-50" };

  // Get transaction icon and color
  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "sale":
        return {
          icon: <TrendingDown className="w-3 h-3 mr-1" />,
          variant: "default" as const,
          label: "SALE",
        };
      case "purchase":
        return {
          icon: <TrendingUp className="w-3 h-3 mr-1" />,
          variant: "secondary" as const,
          label: "PURCHASE",
        };
      case "adjustment":
        return {
          icon: <Activity className="w-3 h-3 mr-1" />,
          variant: "outline" as const,
          label: "ADJUSTMENT",
        };
      case "return":
        return {
          icon: <RefreshCcw className="w-3 h-3 mr-1" />,
          variant: "destructive" as const,
          label: "RETURN",
        };
      default:
        return {
          icon: null,
          variant: "outline" as const,
          label: type.toUpperCase(),
        };
    }
  };

  // Get the display date - use order_date for sales, purchase_date for purchases
  const getTransactionDate = (transaction: Transaction) => {
    if (
      transaction.transaction_type === "sale" &&
      transaction.order?.order_date
    ) {
      return transaction.order.order_date;
    }
    if (
      transaction.transaction_type === "purchase" &&
      transaction.purchase?.purchase_date
    ) {
      return transaction.purchase.purchase_date;
    }
    return transaction.created_at;
  };

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/products")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={`${stockStatus.bgColor} ${stockStatus.color} border-0`}
        >
          {stockStatus.label}
        </Badge>
      </div>

      {/* Product Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Basic details and specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-lg font-semibold">{product.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size</p>
              <p className="text-lg font-semibold">{product.size}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Length</p>
              <p className="text-lg font-semibold">{product.rollLength}m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p
                className={`text-lg font-semibold ${
                  product.stock === 0
                    ? "text-red-600"
                    : product.stock < product.minStock
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {product.stock} rolls
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Min Stock Level</p>
              <p className="text-lg font-semibold">{product.minStock} rolls</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Price</p>
              <p className="text-lg font-semibold">
                LKR {product.costPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selling Price</p>
              <p className="text-lg font-semibold text-green-600">
                LKR {product.sellingPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRP</p>
              <p className="text-lg font-semibold">
                LKR {product.mrp.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All transactions for this product (each line item shown
                separately)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
              disabled={transactionsLoading}
            >
              {transactionsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">
                Loading transactions...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No transactions found for this product
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => {
                      const badge = getTransactionBadge(
                        transaction.transaction_type
                      );
                      const transactionDate = getTransactionDate(transaction);

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(transactionDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>
                              {badge.icon}
                              {badge.label}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              transaction.quantity > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.quantity > 0 ? "+" : ""}
                            {transaction.quantity} rolls
                          </TableCell>
                          <TableCell>
                            {transaction.order?.customer?.name ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {transaction.order.customer.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {transaction.order?.order_number
                              ? transaction.order.order_number
                              : transaction.purchase?.purchase_id
                              ? transaction.purchase.purchase_id
                              : transaction.reference_id
                              ? `${
                                  transaction.reference_type || "REF"
                                }: ${transaction.reference_id.substring(
                                  0,
                                  8
                                )}...`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
