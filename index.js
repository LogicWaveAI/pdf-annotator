const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();

// Middleware to handle large PDF payloads
app.use(express.json({ limit: '50mb' }));

// Health check route
app.get('/', (req, res) => {
  res.send('PDF Annotator API is running');
});

// Annotation endpoint
app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    // Basic validation
    if (!pdfBase64 || !annotations || !Array.isArray(annotations)) {
      return res.status(400).json({ error: 'Missing or invalid pdfBase64 or annotations array' });
    }

    // Load the PDF
    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Iterate and draw red rectangles
    annotations.forEach((ann, index) => {
      try {
        const pageIndex = ann.page - 1;
        const page = pages[pageIndex];
        if (!page) {
          console.warn(`Warning: Page ${ann.page} does not exist. Skipping annotation index ${index}`);
          return;
        }

        const { x, y } = ann.position || {};
        const { width, height } = ann.dimensions || {};

        if (x == null || y == null || width == null || height == null) {
          console.warn(`Warning: Incomplete dimensions for annotation index ${index}`);
          return;
        }

        // Draw the red border rectangle (no fill)
        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: rgb(1, 0, 0),
          borderWidth: 1,
          color: undefined, // no fill
        });
      } catch (err) {
        console.error(`Failed to process annotation index ${index}:`, err);
      }
    });

    // Save and encode the annotated PDF
    const annotatedPdfBytes = await pdfDoc.save();
    const annotatedPdfBase64 = Buffer.from(annotatedPdfBytes).toString('base64');

    res.json({ annotatedPdfBase64 });
  } catch (err) {
    console.error('Error annotating PDF:', err);
    res.status(500).send('Error annotating PDF');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF Annotator API running on port ${PORT}`);
});
