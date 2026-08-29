"use client";

import { CaregiverDashboard } from "@/features/caregiver/CaregiverDashboard";
import { PinGate } from "@/features/caregiver/PinGate";

export default function CaregiverPage() {
  return (
    <PinGate>
      <CaregiverDashboard />
    </PinGate>
  );
}
