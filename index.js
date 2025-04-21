const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    // Decode the base64 PDF
    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Draw rectangle annotations
    annotations.forEach(ann => {
      const pageIndex = ann.page - 1;
      const page = pages[pageIndex];
      if (!page || !ann.position || !ann.dimensions) return;

      page.drawRectangle({
        x: ann.position.x,
        y: ann.position.y,
        width: ann.dimensions.width,
        height: ann.dimensions.height,
        borderColor: rgb(1, 0, 0),     // Red outline
        borderWidth: 1,
        color: undefined               // No fill
      });
    });

    // Encode the PDF back to base64
    const annotatedPdfBytes = await pdfDoc.save();
    const annotatedPdfBase64 = Buffer.from(annotatedPdfBytes).toString('base64');

    res.json({ annotatedPdfBase64 });
  } catch (err) {
    console.error('Error annotating PDF:', err);
    res.status(500).send('Error annotating PDF');
  }
});

app.get('/', (req, res) => {
  res.send('PDF Annotator API is running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('PDF Annotator API running...');
});

