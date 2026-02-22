import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/types";
import TopBar from "@/components/TopBar";
import CompanyReport from "@/components/CompanyReport";

// Next.js 15: params is a Promise
interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(dir).filter(f => f !== "companies.json" && f.endsWith(".json"));
  return files.map(f => ({ id: f.replace(".json", "") }));
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params;
  const filePath = path.join(process.cwd(), "data", `${id}.json`);
  if (!fs.existsSync(filePath)) notFound();
  const data: CompanyDetail = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar />
      <CompanyReport data={data} />
    </div>
  );
}
