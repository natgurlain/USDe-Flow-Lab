import { DashboardPage, type PageQuery } from "@/components/dashboard-page";
export const metadata = { title: "Sources & Methods · Ethena Explained" };
export default function Page(props: PageQuery) {
  return <DashboardPage section="sources" {...props} />;
}
