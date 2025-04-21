const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    // Decode base64 and load PDF
    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Iterate through annotation objects
    annotations.forEach(ann => {
      const pageIndex = ann.page - 1;
      const page = pages[pageIndex];
      if (!page) return;

      // Optional default dimensions if missing
      const width = ann.dimensions?.width || 100;
      const height = ann.dimensions?.height || 20;

      // Draw red rectangle (no fill, only stroke)
      page.drawRectangle({
        x: ann.position.x,
        y: ann.position.y,
        width,
        height,
        borderColor: rgb(1, 0, 0),
        borderWidth: 2,
        color: undefined, // ensures no fill
        opacity: 1,
      });
    });

    // Return updated PDF
    const annotatedPdfBytes = await pdfDoc.save();
    const annotatedPdfBase64 = Buffer.from(annotatedPdfBytes).toString('base64');

    res.json({ annotatedPdfBase64 });
  } catch (err) {
    console.error('Annotation Error:', err);
    res.status(500).send('Error annotating PDF');
  }
});

app.get('/', (req, res) => {
  res.send('PDF Annotator API is running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('PDF Annotator API running...');
});
