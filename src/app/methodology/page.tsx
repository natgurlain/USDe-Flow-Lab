import DashboardWorkspace from "@/components/dashboard-workspace";
import { getMockSnapshot } from "@/lib/mock-data";

export default function MethodologyPage() {
  return <DashboardWorkspace section="methodology" initialData={getMockSnapshot()} />;
}
