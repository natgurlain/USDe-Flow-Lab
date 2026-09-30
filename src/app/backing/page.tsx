import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "Backing & Risks · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="backing" {...props} />;
}
