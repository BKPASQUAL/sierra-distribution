// src/app/(dashboard)/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Building2,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// User type definition
interface SystemUser {
  id: string;
  name: string;
  email: string;
  username?: string; // Added username field
  role: "Admin" | "Staff";
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
}

export default function SettingsPage() {
  // Auth state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // User management state
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Form state
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    username: "",
    role: "Staff" as "Admin" | "Staff",
    status: "Active" as "Active" | "Inactive",
    password: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [companyForm, setCompanyForm] = useState({
    name: "Sierra Distribution",
    email: "info@sierradistribution.lk",
    phone: "+94 11 234 5678",
    address: "456 Industrial Zone, Colombo 10",
    city: "Colombo",
    postalCode: "00100",
    country: "Sri Lanka",
    taxId: "TIN-123456789",
    website: "www.sierradistribution.lk",
  });

  // Check user role on mount
  useEffect(() => {
    checkUserRole();
  }, []);

  // Fetch users only if user is admin
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const checkUserRole = async () => {
    try {
      setIsCheckingAuth(true);
      const supabase = createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setIsAdmin(false);
        return;
      }

      const userRole = user.user_metadata?.role;
      const userNameFromMeta = user.user_metadata?.name;

      setUserName(userNameFromMeta || user.email || "User");
      setCurrentUserEmail(user.email || "");
      setIsAdmin(userRole === "Admin");

      if (!userRole) {
        const { data: userData } = await supabase
          .from("users")
          .select("role, name")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserName(userData.name || user.email || "User");
          setIsAdmin(userData.role === "Admin");
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch("/api/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Toggle user status (Active/Inactive)
  const handleToggleUserStatus = async (user: SystemUser) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    setTogglingUserId(user.id);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          role: user.role,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user status");
      }

      // Update local state
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );

      toast.success(
        `User ${
          newStatus === "Active" ? "activated" : "deactivated"
        } successfully`,
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user status",
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  // Add or update user
  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedUser) {
        // UPDATE existing user
        const updateData: any = {
          name: userForm.name,
          username: userForm.username,
          role: userForm.role,
          status: userForm.status,
        };

        // Only include password if it was entered
        if (userForm.password && userForm.password.length > 0) {
          if (userForm.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            setIsSubmitting(false);
            return;
          }
          updateData.password = userForm.password;
        }

        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update user");
        }

        const data = await response.json();

        if (data.warning) {
          toast.warning(data.warning);
        } else {
          toast.success(
            "User updated successfully! " +
              (userForm.password ? "Password was also changed." : ""),
          );
        }

        await fetchUsers();
      } else {
        // CREATE new user
        if (!userForm.password) {
          toast.error("Password is required for new users");
          setIsSubmitting(false);
          return;
        }

        if (userForm.password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          setIsSubmitting(false);
          return;
        }

        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            username: userForm.username,
            password: userForm.password,
            role: userForm.role,
            status: userForm.status,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create user");
        }

        toast.success("User created successfully!");
        await fetchUsers();
      }

      setIsUserDialogOpen(false);
      setSelectedUser(null);
      resetUserForm();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save user",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast.success("User deleted successfully!");
      await fetchUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change OWN password (Self-Service)
  const handleChangePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUserEmail,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        throw new Error("Incorrect current password");
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCompanyDetails = () => {
    toast.success("Company details saved successfully!");
    console.log("Company details:", companyForm);
  };

  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      username: "",
      role: "Staff",
      status: "Active",
      password: "",
    });
  };

  const openUserDialog = (user?: SystemUser) => {
    if (user) {
      setSelectedUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        username: user.username || "",
        role: user.role,
        status: user.status,
        password: "", // Empty password for edit mode (unless changing)
      });
    } else {
      setSelectedUser(null);
      resetUserForm();
    }
    setIsUserDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Never";
    }
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Access Restricted</h2>
                <p className="text-muted-foreground">
                  Sorry, <strong>{userName}</strong>! Only administrators can
                  access the Settings page.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system configuration and user accounts
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <User className="w-4 h-4 mr-2" />
            User Accounts
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            Company Details
          </TabsTrigger>
        </TabsList>

        {/* User Accounts Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Add and manage system users</CardDescription>
                </div>
                <Button onClick={() => openUserDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <>
                {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-card">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-sm">{user.name}</h3>
                            <div className="text-xs text-muted-foreground mt-1">
                                {user.username ? (
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] dark:bg-slate-800">
                                    {user.username}
                                    </span>
                                ) : (
                                    <span className="italic">No username</span>
                                )}
                            </div>
                          </div>
                          <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === "Admin"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
                            >
                              {user.role}
                            </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground break-all">
                            {user.email}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-2">
                           <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status:</span>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.status === "Active"}
                                  onCheckedChange={() =>
                                    handleToggleUserStatus(user)
                                  }
                                  disabled={togglingUserId === user.id}
                                />
                                <span className="text-xs">
                                  {togglingUserId === user.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    user.status
                                  )}
                                </span>
                              </div>
                           </div>
                           <div className="text-right text-xs text-muted-foreground flex items-center justify-end">
                                Created: {formatDate(user.created_at).split(",")[0]}
                           </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                             <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => openUserDialog(user)}
                              >
                                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                              </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>
                          {user.username ? (
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {user.username}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "Admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.status === "Active"}
                              onCheckedChange={() =>
                                handleToggleUserStatus(user)
                              }
                              disabled={togglingUserId === user.id}
                            />
                            <span className="text-sm text-muted-foreground">
                              {togglingUserId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                user.status
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openUserDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Password Tab */}
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm New Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleChangePassword} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Details Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update company details for invoices and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Company Logo */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 400x400px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Details Form */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email *</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyForm.email}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone *</Label>
                    <Input
                      id="companyPhone"
                      value={companyForm.phone}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companyForm.website}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          website: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      value={companyForm.address}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={companyForm.city}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={companyForm.postalCode}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          postalCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={companyForm.country}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / TIN</Label>
                    <Input
                      id="taxId"
                      value={companyForm.taxId}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          taxId: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleSaveCompanyDetails}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Update user account information"
                : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Full Name *</Label>
              <Input
                id="userName"
                placeholder="Enter full name"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            {/* Added Username Input */}
            <div className="space-y-2">
              <Label htmlFor="userUsername">Username (Optional)</Label>
              <Input
                id="userUsername"
                placeholder="jdoe"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({ ...userForm, username: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Can be used as an alternative login to email
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email *</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@sierra.com"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                disabled={isSubmitting || !!selectedUser}
                className="w-full"
              />
              {selectedUser && (
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRole">Role *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: "Admin" | "Staff") =>
                  setUserForm({ ...userForm, role: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="userStatus">Status *</Label>
                <Select
                  value={userForm.status}
                  onValueChange={(value: "Active" | "Inactive") =>
                    setUserForm({ ...userForm, status: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="userPassword">
                {selectedUser ? "New Password (Optional)" : "Password *"}
              </Label>
              <div className="relative w-full">
                <Input
                  id="userPassword"
                  type={showUserPassword ? "text" : "password"}
                  placeholder={
                    selectedUser
                      ? "Leave empty to keep current"
                      : "Enter password (min 6 chars)"
                  }
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  disabled={isSubmitting}
                >
                  {showUserPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUserDialogOpen(false);
                setSelectedUser(null);
                resetUserForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {selectedUser ? "Updating..." : "Creating..."}
                </>
              ) : selectedUser ? (
                "Update User"
              ) : (
                "Add User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedUser?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
