import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "Economics · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="economics" {...props} />;
}
