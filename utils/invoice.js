const PDFDocument = require('pdfkit');
const fs = require('fs');

// Function to generate PDF invoice
async function generateInvoice(orderDetails, outputPath) {
    const doc = new PDFDocument();

    // Pipe the PDF content to a file
    doc.pipe(fs.createWriteStream(outputPath));

    // Add watermark background
    const watermark = `${process.env.FILE_UPLOAD_PATH}/uploads/background-kcd.png`;
    const watermarkWidth = 300;
    const watermarkHeight = 300;
    const watermarkX = (doc.page.width - watermarkWidth) / 2;
    const watermarkY = (doc.page.height - watermarkHeight) / 2;
    doc.image(watermark, watermarkX, watermarkY, { width: watermarkWidth, height: watermarkHeight, opacity: 0.2 });

    // Add content to the PDF
    doc.fontSize(12);

    // Company Name
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#333').text('KCD DHAKA', { align: 'center' });
    doc.moveDown();

    // Header
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#333').text('Ticket Invoice', { align: 'center' });
    doc.moveDown();

    // Order Information
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Order Information:');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Participant ID: ${orderDetails.orderId}`, { continued: true });
    doc.text(`Name: ${orderDetails.name}`, { align: 'right' });
    doc.text(`Date: ${orderDetails.date}`, { continued: true });
    doc.text(`Mobile: ${orderDetails.mobile}`, { align: 'right' });
    doc.moveDown();

    // Items
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Items:');
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    orderDetails.items.forEach(item => {
        doc.text(`${item.title}`, { continued: true });
        doc.text(`${item.price}`, { align: 'right' });
        doc.moveDown(0.5);
    });
    doc.moveDown();

    // Pricing Details
    doc.font('Helvetica-Bold').text('Payment Details:').font('Helvetica').fontSize(10).fillColor('#333');
    doc.text(`Subtotal: ${orderDetails.subtotal}`, { align: 'right' });
    doc.text(`VAT: ${orderDetails.vat}`, { align: 'right' });
    doc.text(`Tax: ${orderDetails.tax}`, { align: 'right' });
    doc.text(`Discount: -${orderDetails.discount}`, { align: 'right' });
    doc.text(`Total: ${orderDetails.total}`, { align: 'right' });
    doc.moveDown();

    // Finalize the PDF
    doc.end();
}

module.exports = generateInvoice;
