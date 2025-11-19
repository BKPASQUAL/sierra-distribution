// src/app/(dashboard)/bills/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Calendar,
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import export libraries
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Types for API data
interface Customer {
  name: string;
  phone: string | null;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  customer_id: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_status: "unpaid" | "partial" | "paid";
  payment_method: string | null;
  customers: Customer;
  paid_amount?: number;
  due_amount?: number;
}

interface Payment {
  id: string;
  order_id: string | null;
  amount: number;
  cheque_status: "pending" | "passed" | "returned" | null;
}

export default function BillsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Alert States
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch orders and payments from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders
        const ordersResponse = await fetch("/api/orders");
        const ordersData = await ordersResponse.json();

        // Fetch payments
        const paymentsResponse = await fetch("/api/payments");
        const paymentsData = await paymentsResponse.json();

        if (ordersData.orders && paymentsData.payments) {
          const ordersWithBalance = ordersData.orders.map((order: Order) => {
            // Calculate paid amount for this order (exclude returned cheques)
            const orderPayments = paymentsData.payments.filter(
              (p: Payment) =>
                p.order_id === order.id && p.cheque_status !== "returned"
            );

            const paidAmount = orderPayments.reduce(
              (sum: number, p: Payment) => sum + p.amount,
              0
            );

            const dueAmount = order.total_amount - paidAmount;

            return {
              ...order,
              paid_amount: paidAmount,
              due_amount: dueAmount,
            };
          });

          setOrders(ordersWithBalance);
          setPayments(paymentsData.payments);
        } else {
          console.error("Failed to fetch data");
        }
      } catch (error) {
        console.error("Network error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch customers for filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (data.customers) {
          setCustomers(data.customers);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    customerFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    dateFilter,
  ]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer =
      customerFilter === "all" || order.customer_id === customerFilter;

    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      order.payment_status === paymentStatusFilter;

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.payment_method === paymentMethodFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.order_date);
      const now = new Date();

      if (dateFilter === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
      }
    }

    return (
      matchesSearch &&
      matchesCustomer &&
      matchesPaymentStatus &&
      matchesPaymentMethod &&
      matchesDate
    );
  });

  // Pagination Logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Calculate stats
  const totalBills = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  // Calculate total balance (sum of all due amounts)
  const totalBalance = orders.reduce((sum, o) => sum + (o.due_amount || 0), 0);

  const pendingBills = orders.filter((o) => o.payment_status !== "paid").length;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "unpaid":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Report Generation Functions
  const generateExcelReport = () => {
    if (filteredOrders.length === 0) {
      alert("No bills to export. Please adjust your filters.");
      return;
    }

    const excelData = filteredOrders.map((order) => ({
      "Invoice No": order.order_number,
      Date: new Date(order.order_date).toLocaleDateString(),
      Customer: order.customers.name,
      Phone: order.customers.phone || "N/A",
      "Total Amount (LKR)": order.total_amount,
      "Paid Amount (LKR)": order.paid_amount || 0,
      "Due Amount (LKR)": order.due_amount || 0,
      "Payment Status": order.payment_status.toUpperCase(),
      "Payment Method": order.payment_method || "N/A",
    }));

    // Add summary row
    const totalAmount = filteredOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0
    );
    const totalPaid = filteredOrders.reduce(
      (sum, o) => sum + (o.paid_amount || 0),
      0
    );
    const totalDue = filteredOrders.reduce(
      (sum, o) => sum + (o.due_amount || 0),
      0
    );

    excelData.push({
      "Invoice No": "",
      Date: "",
      Customer: "TOTAL",
      Phone: "",
      "Total Amount (LKR)": totalAmount,
      "Paid Amount (LKR)": totalPaid,
      "Due Amount (LKR)": totalDue,
      "Payment Status": "",
      "Payment Method": "",
    } as any);

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills Report");

    // Auto-width columns
    const maxWidth = excelData.reduce((w: any, r: any) => {
      return Object.keys(r).map((k, i) => {
        const currentWidth = w[i] || 10;
        const cellValue = String(r[k] || "");
        return Math.max(currentWidth, cellValue.length + 2);
      });
    }, []);

    ws["!cols"] = maxWidth.map((w: number) => ({ width: w }));

    // Generate file
    const fileName = `Bills_Report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);

    setSuccessMessage(
      `Excel report generated successfully! (${filteredOrders.length} bills)`
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const generatePDFReport = () => {
    if (filteredOrders.length === 0) {
      alert("No bills to export. Please adjust your filters.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add title
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Sierra Distribution", 14, 15);
    doc.setFontSize(12);
    doc.text("Customer Bills Report", 14, 22);

    // Add metadata
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Bills: ${filteredOrders.length}`, 14, 33);

    // Add filter information
    let filterText = "Filters: ";
    if (customerFilter !== "all") {
      const customer = customers.find((c) => c.id === customerFilter);
      filterText += `Customer: ${customer?.name || "Unknown"} | `;
    }
    if (paymentStatusFilter !== "all") {
      filterText += `Status: ${paymentStatusFilter} | `;
    }
    if (paymentMethodFilter !== "all") {
      filterText += `Method: ${paymentMethodFilter} | `;
    }
    if (dateFilter !== "all") {
      filterText += `Period: ${dateFilter} | `;
    }
    if (filterText !== "Filters: ") {
      doc.text(filterText, 14, 38);
    }

    // Prepare table data (removed Phone column to fit portrait)
    const tableData = filteredOrders.map((order) => [
      new Date(order.order_date).toLocaleDateString("en-GB"),
      order.order_number,
      order.customers.name,
      order.total_amount.toLocaleString(),
      (order.paid_amount || 0).toLocaleString(),
      (order.due_amount || 0).toLocaleString(),
      order.payment_status.charAt(0).toUpperCase() +
        order.payment_status.slice(1),
    ]);

    // Add totals row
    const totalAmount = filteredOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0
    );
    const totalPaid = filteredOrders.reduce(
      (sum, o) => sum + (o.paid_amount || 0),
      0
    );
    const totalDue = filteredOrders.reduce(
      (sum, o) => sum + (o.due_amount || 0),
      0
    );

    tableData.push([
      "",
      "TOTAL",
      "",
      totalAmount.toLocaleString(),
      totalPaid.toLocaleString(),
      totalDue.toLocaleString(),
      "",
    ]);

    // Generate table using autoTable
    autoTable(doc, {
      head: [
        [
          "Date",
          "Invoice No",
          "Customer",
          "Total (LKR)",
          "Paid (LKR)",
          "Due (LKR)",
          "Status",
        ],
      ],
      body: tableData,
      startY: filterText !== "Filters: " ? 43 : 38,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 22, halign: "center" }, // Date
        1: { cellWidth: 28, halign: "left" }, // Invoice No
        2: { cellWidth: 50, halign: "left" }, // Customer
        3: { cellWidth: 25, halign: "right" }, // Total
        4: { cellWidth: 25, halign: "right" }, // Paid
        5: { cellWidth: 25, halign: "right" }, // Due
        6: { cellWidth: 20, halign: "center" }, // Status
      },
      didParseCell: (data: any) => {
        // Bold and highlight the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
      margin: { left: 14, right: 14 },
    });

    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save PDF
    const fileName = `Bills_Report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    setSuccessMessage(
      `PDF report generated successfully! (${filteredOrders.length} bills)`
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              {successMessage}
            </AlertDescription>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="absolute top-2 right-2 rounded-md p-1 hover:bg-green-100"
            >
              <X className="h-4 w-4 text-green-600" />
            </button>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Bills</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Report Generation Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={generateExcelReport}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export to Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generatePDFReport}>
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => (window.location.href = "/bills/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Bill
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Billed amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              LKR {totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Amount due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingBills}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bills with balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm ">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Rows per page Selector */}
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={paymentStatusFilter}
                onValueChange={setPaymentStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(order.order_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customers.name}
                    </TableCell>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell className="text-right font-medium">
                      LKR {order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      LKR {(order.paid_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.payment_status === "paid" ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="font-semibold text-destructive">
                          LKR {(order.due_amount || 0).toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          (window.location.href = `/bills/${order.id}`)
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t py-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(startIndex + 1, totalItems)} to{" "}
              {Math.min(endIndex, totalItems)} of {totalItems} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
