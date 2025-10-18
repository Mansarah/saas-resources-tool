"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Globe, Image } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const companyProfileSchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyProfileFormProps {
  initialData: {
    name: string;
    website: string;
    logo: string;
  };
}

export default function CompanyProfileForm({
  initialData,
}: CompanyProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  
  const updateCompanyProfileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      website?: string;
      logo?: string;
    }) => {
      const response = await axios.put("/api/admin/company-profile", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
    },
  });

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: initialData.name,
      website: initialData.website,
      logo: initialData.logo,
    },
  });

  const onSubmit = async (data: CompanyProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateCompanyProfileMutation.mutateAsync({
        name: data.name,
        website: data.website,
        logo: data.logo,
      });

      toast.success("Company profile updated successfully");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update company profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="border-0 shadow-sm">
      
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Company Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            placeholder="Enter company name" 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            placeholder="https://example.com" 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Logo URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Image className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            placeholder="https://example.com/logo.png" 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a publicly accessible URL to your company logo
                      </p>
                    </FormItem>
                  )}
                />
              </div>
              
              {form.formState.isDirty && (
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}