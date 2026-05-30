"use client";

import { Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { ReportUserModal } from "@/components/report/ReportUserModal";
import { Button } from "@/components/ui/Button";

interface ProfileReportSectionProps {
  reportedUserId: string;
  reportedUsername: string;
  openReport?: boolean;
}

export function ProfileReportSection({
  reportedUserId,
  reportedUsername,
  openReport,
}: ProfileReportSectionProps) {
  const [modalOpen, setModalOpen] = useState(openReport ?? false);

  useEffect(() => {
    if (openReport) setModalOpen(true);
  }, [openReport]);

  return (
    <>
      <Button
        size="md"
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50"
        onClick={() => setModalOpen(true)}
      >
        <Flag className="h-4 w-4" />
        Laporkan
      </Button>

      <ReportUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        reportedUserId={reportedUserId}
        reportedUsername={reportedUsername}
      />
    </>
  );
}
