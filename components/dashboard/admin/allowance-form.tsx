"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Edit } from "lucide-react";


interface AllowanceFormProps {
  employeeId: string;
  employeeName: string;
  currentAllowance: number;
}

export default function AllowanceForm({
  employeeId,
  employeeName,
  currentAllowance,
}: AllowanceFormProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [allowance, setAllowance] = useState<number>(currentAllowance);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
 const queryClient = useQueryClient();

 
  const updateEmployeeAllowanceMutation = useMutation({
    mutationFn: async (data: { employeeId: string; availableDays: number }) => {
      const response = await axios.put("/api/admin/employees/allowance", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees",'team-management','allowance'] });
    },
  });
// console.log("res employe",currentAllowance)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateEmployeeAllowanceMutation.mutateAsync({
        employeeId,
        availableDays: allowance,
      });

      toast.success("Allowance updated successfully");
      setIsOpen(false);
      setAllowance(currentAllowance);
    } catch (error) {
      console.error("Error updating allowance:", error);
      toast.error("Failed to update allowance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
     
         <Button
                          variant="ghost"
                          size="icon"
                       
                          className="h-8 w-8"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Holiday allowance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="employee-name">Employee</Label>
            <Input id="employee-name" value={employeeName} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowance">Holiday allowance (days)</Label>
            <Input
              id="allowance"
              type="number"
              min={0}
              value={allowance}
              onChange={(e) => setAllowance(parseInt(e.target.value))}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Allowance"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
