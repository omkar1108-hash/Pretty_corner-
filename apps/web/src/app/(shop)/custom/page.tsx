import type { Metadata } from "next";
import CustomForm from "@/components/CustomForm";
import CustomIntro from "@/components/CustomIntro";
import { getCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Custom order" };

export default async function CustomPage() {
  const { materials, types } = await getCatalog();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <CustomIntro />
      <CustomForm materials={materials} types={types} />
    </div>
  );
}
