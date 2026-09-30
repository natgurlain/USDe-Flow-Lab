import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "USDe Flow · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="flow" {...props} />;
}
