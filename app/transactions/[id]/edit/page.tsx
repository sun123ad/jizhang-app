import { EditTransactionClient } from "./EditTransactionClient";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditTransactionClient id={id} />;
}
