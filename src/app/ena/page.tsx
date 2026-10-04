import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "ENA & Buybacks · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="ena" {...props} />;
}
