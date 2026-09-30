import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "Yield · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="yield" {...props} />;
}
