"use client";

import { useState, useEffect } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReportUserModal } from "@/components/report/ReportUserModal";

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
        size="sm"
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50"
        onClick={() => setModalOpen(true)}
      >
        <Flag className="h-3.5 w-3.5" />
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
