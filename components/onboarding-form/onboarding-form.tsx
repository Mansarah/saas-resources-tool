/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

import { Building2, Users, Mail, Briefcase, Globe, Image } from "lucide-react";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(55),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").max(100),
  department: z.string().optional(),
  invitationCode: z
    .string()
    .length(6, "Invitation code must be 6 characters long"),
});

const adminSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(55),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").max(100),
  companyName: z.string().min(1, "Company name is required").max(100),
  companyWebsite: z
    .string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal("")),
  companyLogo: z.string().url().optional().or(z.literal("")),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;
type AdminFormValues = z.infer<typeof adminSchema>;

interface OnboardingFormProps {
  userEmail: string;
  firstName: string;
  lastName: string;
}

const OnboardingForm = ({
  userEmail,
  firstName,
  lastName,
}: OnboardingFormProps) => {
  const [accountType, setAccountType] = useState<"admin" | "employee">("employee");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const queryClient = useQueryClient();
  const router = useRouter();
  const { update } = useSession();


  const createEmployeeMutation = useMutation({
    mutationFn: async (data: { department?: string; invitationCode: string }) => {
      const response = await axios.post("/api/onboarding/employee", data);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user"] }),
        update() // Force session update
      ]);
      
      toast.success("Profile completed successfully!");
      router.replace("/employee");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || err?.message || "Failed to complete onboarding");
      setIsProcessing(false);
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: { companyName: string; companyWebsite?: string; companyLogo?: string }) => {
      const response = await axios.post("/api/onboarding/admin", data);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user"] }),
        update() // Force session update
      ]);
      
      toast.success("Company setup completed successfully!");
      router.replace("/admin");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || err?.message || "Failed to complete onboarding");
      setIsProcessing(false);
    },
  });

  const employeeForm = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName,
      lastName,
      email: userEmail,
      department: "",
      invitationCode: "",
    },
  });

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      firstName,
      lastName,
      email: userEmail,
      companyName: "",
      companyWebsite: "",
      companyLogo: "",
    },
  });

  const handleEmployeeSubmit = (data: EmployeeFormValues) => {
    setError(null);
    setIsProcessing(true);
    createEmployeeMutation.mutate({
      department: data.department,
      invitationCode: data.invitationCode,
    });
  };

  const handleAdminSubmit = (data: AdminFormValues) => {
    setError(null);
    setIsProcessing(true);
    createAdminMutation.mutate({
      companyName: data.companyName,
      companyWebsite: data.companyWebsite,
      companyLogo: data.companyLogo,
    });
  };


  if (isProcessing) {
    return (
      <div className="p-6 bg-card rounded-lg border border-border text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <h2 className="text-lg font-bold text-foreground">Completing Setup...</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we set up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Account Type</Label>
        <RadioGroup
          defaultValue="employee"
          value={accountType}
          onValueChange={(value: string) => setAccountType(value as "admin" | "employee")}
          className="grid grid-cols-2 gap-2"
        >
          <div>
            <RadioGroupItem
              value="employee"
              id="employee"
              className="peer sr-only"
            />
            <Label
              htmlFor="employee"
              className={cn(
                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                accountType === "employee" && "border-primary bg-accent"
              )}
            >
              <Users className={cn(
                "w-4 h-4 mb-1",
                accountType === "employee" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs font-medium">Employee</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value="admin"
              id="admin"
              className="peer sr-only"
            />
            <Label
              htmlFor="admin"
              className={cn(
                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                accountType === "admin" && "border-primary bg-accent"
              )}
            >
              <Building2 className={cn(
                "w-4 h-4 mb-1",
                accountType === "admin" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs font-medium">Business Admin</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Form Content */}
      {accountType === "employee" ? (
        <Form {...employeeForm}>
          <form
            onSubmit={employeeForm.handleSubmit(handleEmployeeSubmit)}
            className="space-y-4"
          >
            {/* Personal Info Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                  <Users className="w-3 h-3 text-primary" />
                </div>
                <Label className="text-sm font-medium">Personal Information</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={employeeForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">First Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted h-8 text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={employeeForm.control}
                  name="lastName" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted h-8 text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={employeeForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted h-8 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Work Info Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                  <Briefcase className="w-3 h-3 text-primary" />
                </div>
                <Label className="text-sm font-medium">Work Information</Label>
              </div>

              <FormField
                control={employeeForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Department (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Engineering, Sales, etc."
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={employeeForm.control}
                name="invitationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Invitation Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="Enter 6-digit code"
                          className="h-8 text-sm pl-8"
                          maxLength={6}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter the invitation code provided by your company admin
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-8 text-sm"
              disabled={createEmployeeMutation.isPending || isProcessing}
            >
              {createEmployeeMutation.isPending ? "Joining Team..." : "Join Team"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...adminForm}>
          <form
            onSubmit={adminForm.handleSubmit(handleAdminSubmit)}
            className="space-y-4"
          >
            {/* Personal Info Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                  <Users className="w-3 h-3 text-primary" />
                </div>
                <Label className="text-sm font-medium">Your Information</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={adminForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">First Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted h-8 text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted h-8 text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={adminForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted h-8 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Company Info Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-primary" />
                </div>
                <Label className="text-sm font-medium">Company Information</Label>
              </div>

              <FormField
                control={adminForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Company Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your company name"
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={adminForm.control}
                  name="companyWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="https://"
                            className="h-8 text-sm pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adminForm.control}
                  name="companyLogo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Logo URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Image className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="Logo URL"
                            className="h-8 text-sm pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-8 text-sm"
              disabled={createAdminMutation.isPending || isProcessing}
            >
              {createAdminMutation.isPending ? "Creating Company..." : "Create Company"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default OnboardingForm;