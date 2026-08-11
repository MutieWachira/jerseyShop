import { jsPDF } from "jspdf";

function formatCurrency(amount: number) {
  return `Ksh ${Number(amount).toLocaleString()}`;
}

export async function generateReceiptPdfBlob(order: any, receiptNumber: string): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PURCHASE RECEIPT", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt #: ${receiptNumber}`, 14, 28);
  doc.text(`Order #: ${order.orderNumber || order.id}`, 14, 34);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);

  doc.setFont("helvetica", "bold");
  doc.text("Billed Customer Info", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.shippingName || "Customer"}`, 14, 56);
  doc.text(`${order.shippingEmail || ""} | ${order.shippingPhone || ""}`, 14, 62);
  doc.text(`${order.shippingAddress || ""}, ${order.shippingCity || ""}`, 14, 68);
  doc.text(`Payment Method: ${order.paymentMethod || "N/A"}`, 14, 74);
  doc.text(`Order Status: ${order.status || "N/A"}`, 14, 80);

  let cursorY = 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Order Items", 14, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Item", 14, cursorY);
  doc.text("Size/Ver", 90, cursorY);
  doc.text("Qty", 120, cursorY);
  doc.text("Unit", 135, cursorY);
  doc.text("Custom", 160, cursorY);
  doc.text("Total", 196, cursorY, { align: "right" });

  cursorY += 4;
  doc.setLineWidth(0.3);
  doc.line(14, cursorY, 196, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");

  (order.items || []).forEach((item: any) => {
    const itemName = item.product?.name || item.productName || item.name || "Item";
    const itemQty = item.quantity ?? 0;
    const unitPrice = item.unitPrice ?? item.price ?? 0;
    const customizationCost = item.customizationCost ?? item.customisationCost ?? 0;
    const itemTotal = item.totalPrice ?? itemQty * unitPrice + customizationCost;
    const customizationLabel = customizationCost > 0 ? formatCurrency(customizationCost) : "-";
    const customizationText =
      item.customization?.toString()?.trim() ||
      item.customisation?.toString()?.trim() ||
      item.customizationDetails?.toString()?.trim() ||
      "";

    const wrappedName = doc.splitTextToSize(itemName, 60);
    doc.text(wrappedName, 14, cursorY);
    doc.text(`${item.size || "-"}/${item.version || "-"}`, 90, cursorY);
    doc.text(String(itemQty), 120, cursorY);
    doc.text(formatCurrency(unitPrice), 135, cursorY);
    doc.text(customizationLabel, 160, cursorY);
    doc.text(formatCurrency(itemTotal), 196, cursorY, { align: "right" });

    cursorY += Math.max(wrappedName.length, 1) * 5 + 6;

    if (customizationText) {
      const customizationLines = doc.splitTextToSize(`Customization: ${customizationText}`, 170);
      doc.setFontSize(9);
      doc.text(customizationLines, 14, cursorY);
      cursorY += customizationLines.length * 5 + 4;
      doc.setFontSize(10);
    }

    if (cursorY > 250) {
      doc.addPage();
      cursorY = 20;
    }
  });

  if (cursorY + 80 > 290) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Order Summary", 14, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const storedSubtotal = order.subtotal ?? 0;
  const customizationTotal = (order.items || []).reduce((sum: number, item: any) => {
    return sum + (item.customizationCost ?? item.customisationCost ?? 0);
  }, 0);

  const itemSubtotal = (order.items || []).reduce((sum: number, item: any) => {
    const itemQty = item.quantity ?? 0;
    const unitPrice = item.unitPrice ?? item.price ?? 0;
    const customizationCost = item.customizationCost ?? item.customisationCost ?? 0;
    const lineTotal = item.totalPrice ?? itemQty * unitPrice + customizationCost;
    return sum + (lineTotal - customizationCost);
  }, 0);

  const displaySubtotal = (order.items && order.items.length > 0) ? itemSubtotal : storedSubtotal;
  const discountAmount = order.discountAmount ?? 0;
  const shippingFee = order.shippingFee ?? 0;
  const taxAmount = order.tax ?? 0;
  const finalTotal = order.total ?? 0;

  const summaryLines = [
    { label: customizationTotal > 0 ? "Items Subtotal" : "Subtotal", value: displaySubtotal },
    ...(customizationTotal > 0 ? [{ label: "Customization", value: customizationTotal }] : []),
    { label: "Discount", value: -Math.abs(discountAmount) },
    { label: "Shipping", value: shippingFee },
    { label: "Tax", value: taxAmount },
  ];

  summaryLines.forEach((entry) => {
    doc.text(entry.label, 14, cursorY);
    doc.text(formatCurrency(entry.value), 196, cursorY, { align: "right" });
    cursorY += 6;
  });

  doc.setLineWidth(0.3);
  doc.line(14, cursorY, 196, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Total Paid", 14, cursorY);
  doc.text(formatCurrency(finalTotal), 196, cursorY, { align: "right" });

  return new Uint8Array(doc.output("arraybuffer"));
}
