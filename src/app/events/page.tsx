import DashboardWorkspace from "@/components/dashboard-workspace";
import { getMockSnapshot } from "@/lib/mock-data";

export default function EventsPage() {
  return <DashboardWorkspace section="events" initialData={getMockSnapshot()} />;
}
