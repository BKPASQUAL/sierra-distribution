// src/app/(dashboard)/bills/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added for navigation
import {
  Plus,
  Search,
  Eye,
  Pencil, // Added Edit Icon
  Calendar,
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  FileWarning,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const router = useRouter(); // Initialize router
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

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
                p.order_id === order.id && p.cheque_status !== "returned",
            );

            const paidAmount = orderPayments.reduce(
              (sum: number, p: Payment) => sum + p.amount,
              0,
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

  // Sorting Logic
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = React.useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        // Handle nested properties like customers.name
        const getValue = (obj: any, path: string) => {
          return path.split(".").reduce((o, i) => (o ? o[i] : null), obj);
        };

        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  // Pagination Logic (Uses sortedOrders)
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
  };

  // Calculate stats
  const totalBills = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
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

  // --- REPORT GENERATION FUNCTIONS ---

  const generateExcelReport = () => {
    if (sortedOrders.length === 0) {
      alert("No bills to export. Please adjust your filters.");
      return;
    }

    const excelData = sortedOrders.map((order) => ({
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
    const totalAmount = sortedOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const totalPaid = sortedOrders.reduce(
      (sum, o) => sum + (o.paid_amount || 0),
      0,
    );
    const totalDue = sortedOrders.reduce(
      (sum, o) => sum + (o.due_amount || 0),
      0,
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

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills Report");

    const maxWidth = excelData.reduce((w: any, r: any) => {
      return Object.keys(r).map((k, i) => {
        const currentWidth = w[i] || 10;
        const cellValue = String(r[k] || "");
        return Math.max(currentWidth, cellValue.length + 2);
      });
    }, []);

    ws["!cols"] = maxWidth.map((w: number) => ({ width: w }));

    const fileName = `Bills_Report_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);

    setSuccessMessage(
      `Excel report generated successfully! (${sortedOrders.length} bills)`,
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const generatePDFReport = () => {
    if (sortedOrders.length === 0) {
      alert("No bills to export. Please adjust your filters.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Sierra Distribution", 14, 15);
    doc.setFontSize(12);
    doc.text("Customer Bills Report", 14, 22);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Bills: ${sortedOrders.length}`, 14, 33);

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
    if (sortConfig) {
      filterText += `Sorted By: ${sortConfig.key} (${sortConfig.direction}) | `;
    }

    if (filterText !== "Filters: ") {
      doc.text(filterText, 14, 38);
    }

    const tableData = sortedOrders.map((order) => [
      new Date(order.order_date).toLocaleDateString("en-GB"),
      order.order_number,
      order.customers.name,
      order.total_amount.toLocaleString(),
      (order.paid_amount || 0).toLocaleString(),
      (order.due_amount || 0).toLocaleString(),
      order.payment_status.charAt(0).toUpperCase() +
        order.payment_status.slice(1),
    ]);

    const totalAmount = sortedOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const totalPaid = sortedOrders.reduce(
      (sum, o) => sum + (o.paid_amount || 0),
      0,
    );
    const totalDue = sortedOrders.reduce(
      (sum, o) => sum + (o.due_amount || 0),
      0,
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
        0: { cellWidth: 22, halign: "center" },
        1: { cellWidth: 28, halign: "left" },
        2: { cellWidth: 50, halign: "left" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (data: any) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
      margin: { left: 14, right: 14 },
    });

    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    const fileName = `Bills_Report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    setSuccessMessage(
      `PDF report generated successfully! (${sortedOrders.length} bills)`,
    );
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const generateOutstandingReport = () => {
    // 1. Filter for UNPAID or PARTIAL only
    const outstandingOrders = orders.filter(
      (o) => o.payment_status === "unpaid" || o.payment_status === "partial",
    );

    // 2. Sort by Customer Name (A-Z), then by Due Amount (Desc)
    outstandingOrders.sort((a, b) => {
      // Primary Sort: Customer Name
      const nameA = a.customers.name.toLowerCase();
      const nameB = b.customers.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      // Secondary Sort: Due Amount (High to Low)
      return (b.due_amount || 0) - (a.due_amount || 0);
    });

    if (outstandingOrders.length === 0) {
      alert("No outstanding bills found.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Sierra Distribution", 14, 15);
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text("Outstanding Bills (Grouped by Customer)", 14, 22);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Outstanding Bills: ${outstandingOrders.length}`, 14, 33);

    // 3. Construct Table Data with Group Headers
    const tableBody: any[] = [];
    let currentCustomer = "";
    let customerTotalDue = 0;
    let customerStartIndex = 0;

    outstandingOrders.forEach((order, index) => {
      // Check if customer changed
      if (order.customers.name !== currentCustomer) {
        // If not the first customer, add the previous customer's total row (optional)
        // For cleaner look, we create a GROUP HEADER for the new customer
        currentCustomer = order.customers.name;

        // Calculate total for this new customer to display in header (look ahead)
        customerTotalDue = outstandingOrders
          .filter((o) => o.customers.name === currentCustomer)
          .reduce((sum, o) => sum + (o.due_amount || 0), 0);

        // Add Group Header Row
        tableBody.push([
          {
            content: `${currentCustomer} (Total Due: LKR ${customerTotalDue.toLocaleString()})`,
            colSpan: 6,
            styles: {
              fillColor: [240, 240, 240],
              fontStyle: "bold",
              textColor: [50, 50, 50],
              halign: "left",
            },
          },
        ]);
      }

      // Add the bill row
      tableBody.push([
        new Date(order.order_date).toLocaleDateString("en-GB"),
        order.order_number,
        order.total_amount.toLocaleString(),
        (order.paid_amount || 0).toLocaleString(),
        (order.due_amount || 0).toLocaleString(),
        order.payment_status.toUpperCase(),
      ]);
    });

    // Grand Totals
    const totalAmount = outstandingOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const totalPaid = outstandingOrders.reduce(
      (sum, o) => sum + (o.paid_amount || 0),
      0,
    );
    const totalDue = outstandingOrders.reduce(
      (sum, o) => sum + (o.due_amount || 0),
      0,
    );

    tableBody.push([
      {
        content: "GRAND TOTAL",
        colSpan: 2,
        styles: { fontStyle: "bold", halign: "right" },
      },
      {
        content: totalAmount.toLocaleString(),
        styles: { fontStyle: "bold", halign: "right" },
      },
      {
        content: totalPaid.toLocaleString(),
        styles: { fontStyle: "bold", halign: "right" },
      },
      {
        content: totalDue.toLocaleString(),
        styles: {
          fontStyle: "bold",
          halign: "right",
          textColor: [220, 38, 38],
        },
      },
      "",
    ]);

    autoTable(doc, {
      head: [
        [
          "Date",
          "Invoice No",
          "Total (LKR)",
          "Paid (LKR)",
          "Due (LKR)",
          "Status",
        ],
      ],
      body: tableBody,
      startY: 38,
      theme: "grid",
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" }, // Date
        1: { cellWidth: 35, halign: "left" }, // Invoice
        2: { cellWidth: 30, halign: "right" }, // Total
        3: { cellWidth: 30, halign: "right" }, // Paid
        4: { cellWidth: 30, halign: "right" }, // Due
        5: { cellWidth: 25, halign: "center" }, // Status
      },
      margin: { left: 14, right: 14 },
    });

    const fileName = `Outstanding_By_Customer_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    setSuccessMessage(
      `Outstanding report generated! (${outstandingOrders.length} bills grouped by customer)`,
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={generateExcelReport}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export Current View (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generatePDFReport}>
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Export Current View (PDF)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={generateOutstandingReport}>
                <FileWarning className="w-4 h-4 mr-2 text-red-600" />
                Outstanding (By Customer)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push("/bills/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Bill
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold break-all">
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
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive break-all">
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
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">
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
            <div className="grid grid-cols-2 gap-2 w-full md:flex md:items-center md:w-auto">
              {/* Rows per page Selector */}
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[80px]">
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
                <SelectTrigger className="w-full md:w-[180px]">
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
                <SelectTrigger className="w-full md:w-[140px]">
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
                <SelectTrigger className="w-full md:w-[140px]">
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
                <SelectTrigger className="col-span-2 md:col-span-1 w-full md:w-[140px]">
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
          {/* Mobile View - Cards */}
          <div className="grid gap-4 md:hidden">
            {paginatedOrders.map((order) => (
              <Card key={order.id} className="p-4 border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {order.customers.name}
                    </h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <FileText className="w-3 h-3" />
                      {order.order_number}
                    </div>
                  </div>
                  <Badge
                    variant={
                      order.payment_status === "paid"
                        ? "default"
                        : order.payment_status === "partial"
                          ? "secondary"
                          : "destructive"
                    }
                    className={`capitalize ${
                        order.payment_status === "paid" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : order.payment_status === "partial" 
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {order.payment_status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm my-4 bg-muted/30 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3" /> Date
                    </span>
                    <span className="font-medium text-xs">
                      {new Date(order.order_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Total Amount</span>
                    <span className="font-bold text-sm">
                      LKR {order.total_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Paid Amount</span>
                    <span className="text-green-600 font-medium text-sm">
                      LKR {(order.paid_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-muted-foreground font-medium text-xs">Due Balance</span>
                    <span className="text-destructive font-bold text-sm">
                      LKR {(order.due_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/bills/${order.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/bills/${order.id}/edit`)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
            {paginatedOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No bills found
                </div>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort("order_date")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Date {getSortIcon("order_date")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("customers.name")}
                  className="cursor-pointer w-[200px]"
                >
                  <div className="flex items-center">
                    Customer {getSortIcon("customers.name")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("order_number")}
                  className="cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center">
                    Invoice No {getSortIcon("order_number")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("total_amount")}
                >
                  <div className="flex items-center justify-end">
                    Total {getSortIcon("total_amount")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("paid_amount")}
                >
                  <div className="flex items-center justify-end">
                    Paid {getSortIcon("paid_amount")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer"
                  onClick={() => handleSort("due_amount")}
                >
                  <div className="flex items-center justify-end">
                    Due Amount {getSortIcon("due_amount")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("payment_status")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Payment Status {getSortIcon("payment_status")}
                  </div>
                </TableHead>
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
                    <TableCell className="font-medium max-w-[150px] truncate" title={order.customers.name}>
                      {order.customers.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.order_number}</TableCell>
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
                          order.payment_status,
                        )}`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/bills/${order.id}/edit`)}
                          title="Edit Bill"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                        {/* View Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/bills/${order.id}`)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Pagination Footer */}
        {sortedOrders.length > 0 && (
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
