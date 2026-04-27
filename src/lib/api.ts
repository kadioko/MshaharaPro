const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function downloadPayslip(employeeId: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/payslips/${employeeId}`);

  if (!response.ok) {
    throw new Error(`Failed to download payslip: ${response.statusText}`);
  }

  return response.blob();
}
