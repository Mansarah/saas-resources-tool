import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async () => {
    const session = await getServerSession(authOptions)
    if(!session?.user.id){
        redirect('/auth/signin')
    }

    const companyId = session?.user.companyId

    const timeOffRequest = await prisma.timeOffRequest.findMany({
        where:{
            employee:{
                companyId:companyId
            },
        },
        include:{
            employee:true,
            manager:true,
        },
        orderBy:{
            createdAt:'desc'
        }
    })
  return (
        <div className="space-y-8 ">
      <div className="flex flex-col mb-2 ">
        <p className="text-3xl font-bold">Time Off Requests</p>
        <p className="text-gray-500">View and manage all time off requests</p>
      </div>
      <Card>
        <CardContent className="p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeOffRequest?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.employee.firstName} {request.employee.lastName}
                  </TableCell>
                  <TableCell>
                    {formatDate(request.startDate) +
                      " - " +
                      formatDate(request.endDate)}
                  </TableCell>
                  <TableCell className="capitalize">{request.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "PENDING"
                          ? "secondary"
                          : request.status === "APPROVED"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {request.status.charAt(0) +
                        request.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.manager
                      ? `${request.manager.firstName} ${request.manager.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="link" asChild>
                      <Link href={`/admin/time-off-requests/${request.id}`}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default page