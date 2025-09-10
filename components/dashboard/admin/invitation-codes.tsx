"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckIcon, CopyIcon, PlusIcon, RefreshCwIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Code } from "@prisma/client";


interface InvitationCodesProps {
  initialCodes: Code[];
}

const InvitationCodes = ({ initialCodes }: InvitationCodesProps) => {
  const [codes, setCodes] = useState<Code[]>(initialCodes);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();

  const generateInvitationCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/admin/invitation-codes");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
    },
  });
  
  useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setIsLoading(true);
    setError(null);

    try {
      const newCode = await generateInvitationCodeMutation.mutateAsync();
      setCodes((prev) => [newCode, ...prev]);
      toast.success("New code generated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate code");
      setError("Failed to generate code");
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied({ ...copied, [code]: true });
      toast.success("Code copied to clipboard");
    });

    setTimeout(() => {
      setCopied({ ...copied, [code]: false });
    }, 2000);
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-3xl font-bold">Invitation Codes</p>
          <p className="text-gray-500">
            Generate and manage invitation codes for your new employees.
          </p>
        </div>
     
      </div>
      {error && (
        <Alert variant={"destructive"}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Button onClick={handleGenerateCode} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <PlusIcon className="mr-2 h-4 w-4" />
              Generate New code
            </>
          )}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Invitation Codes</CardTitle>
          <CardDescription>
            Codes that can be used to join your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCwIcon className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : codes?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes?.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono text-lg">
                      {code.code}
                    </TableCell>
                    <TableCell>
                      {code.used ? (
                        <Badge variant={"secondary"}>Used</Badge>
                      ) : (
                        <Badge
                          variant={"default"}
                          className="bg-green-500 text-white"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        onClick={() => copyToClipboard(code.code)}
                        disabled={code.used}
                      >
                        {copied[code.code] ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy code</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No active codes</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>How to use invitation codes</CardTitle>
          <CardDescription>
            Share these codes with your employees to join your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Generate a new invitation code using the button above</li>
            <li>Share the 6-digit code with your employee</li>
            <li>
              The employee will sign up and enter this code during onboarding
            </li>
            <li>
              Once used, the code will be marked as &quot;Used&quot; and cannot
              be used again
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationCodes;
