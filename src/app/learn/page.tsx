import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "Learn · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="learn" {...props} />;
}
