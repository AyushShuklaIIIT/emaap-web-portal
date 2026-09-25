import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPaymentReceipt,
  PaymentReceiptDetails,
} from "@/services/business/payment.service";
import { getCurrentUser } from "@/lib/current-user";

export default function PrintReceipt() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const [receipt, setReceipt] = useState<PaymentReceiptDetails | null>(null);
  const [error, setError] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (receiptId && currentUser?.userId) {
      getPaymentReceipt(currentUser.userId, receiptId)
        .then((data) => {
          setReceipt(data);
          setTimeout(() => {
            window.print();
          }, 500);
        })
        .catch(() => setError(true));
    }
  }, [receiptId, currentUser?.userId]);

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">Failed to load receipt</div>
    );
  }

  if (!receipt) {
    return <div className="p-8 text-center">Loading receipt...</div>;
  }

  return (
    <div
      className="mx-auto max-w-3xl bg-white p-8 sm:p-12 text-[#1A1A2E]"
      style={{ fontFamily: "sans-serif" }}
    >
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold">e-Maap Verification</h1>
          <p className="text-sm text-[#5C5C70]">Official Payment Receipt</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Receipt No: {receipt.receipt_no}</p>
          <p className="text-sm">
            Date:{" "}
            {new Date(receipt.transaction_date || "").toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <div>
          <h3 className="font-bold text-[#5C5C70] uppercase text-xs">
            Billed To
          </h3>
          <p className="mt-2 font-semibold">
            {currentUser?.businessName || currentUser?.fullName || "Business User"}
          </p>
          <p className="text-sm">{receipt.application.instrument.address}</p>
          <p className="text-sm">
            {receipt.application.instrument.state} -{" "}
            {receipt.application.instrument.pincode}
          </p>
        </div>
        <div className="text-right">
          <h3 className="font-bold text-[#5C5C70] uppercase text-xs">
            Application Ref
          </h3>
          <p className="mt-2 font-semibold">
            {receipt.application.application_no}
          </p>
          <p className="text-sm">Payment Method: {receipt.payment_method}</p>
          <p className="text-sm">
            Transaction ID: {receipt.transaction_id || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E0E0E0] bg-[#F5F7FA]">
              <th className="py-3 px-4 font-bold">Description</th>
              <th className="py-3 px-4 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E8E9EC]">
              <td className="py-4 px-4">
                Verification Fee for{" "}
                {receipt.application.instrument.category.category_name}
                <br />
                <span className="text-xs text-[#5C5C70]">
                  Model: {receipt.application.instrument.model_no} | Serial:{" "}
                  {receipt.application.instrument.serial_number}
                </span>
              </td>
              <td className="py-4 px-4 text-right">₹{receipt.statutory_fee}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 font-bold text-lg border-t border-[#1A1A2E]">
            <span>Total Paid</span>
            <span>₹{receipt.total_amount}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-xs text-[#5C5C70] pt-4 border-t">
        This is a computer-generated receipt and does not require a signature.
      </div>
    </div>
  );
}
