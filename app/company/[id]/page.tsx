import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/types";
import TopBar from "@/components/TopBar";
import CompanyReport from "@/components/CompanyReport";

interface Props {
  params: { id: string };
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(dir).filter(f => f !== "companies.json" && f.endsWith(".json"));
  return files.map(f => ({ id: f.replace(".json", "") }));
}

export default function CompanyPage({ params }: Props) {
  const filePath = path.join(process.cwd(), "data", `${params.id}.json`);
  if (!fs.existsSync(filePath)) notFound();
  const data: CompanyDetail = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <TopBar />
      <CompanyReport data={data} />
    </div>
  );
}
