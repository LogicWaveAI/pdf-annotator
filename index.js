const express = require('express');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    if (!pdfBase64 || !annotations || !Array.isArray(annotations)) {
      return res.status(400).json({ error: 'Invalid input data.' });
    }

    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    annotations.forEach((ann) => {
      const page = pages[ann.page - 1];
      if (!page) return;

      // Draw red rectangle (no fill)
      const { x, y } = ann.position;
      const width = ann.dimensions?.width || 100;
      const height = ann.dimensions?.height || 20;

      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: rgb(1, 0, 0),
        borderWidth: 1,
        color: undefined, // ensures no fill
      });

      // Optional: draw the note as red text just above the box
      if (ann.note) {
        page.drawText(ann.note, {
          x,
          y: y + height + 5,
          size: 10,
          font,
          color: rgb(1, 0, 0),
        });
      }
    });

    const outputPdfBytes = await pdfDoc.save();
    const outputPdfBase64 = Buffer.from(outputPdfBytes).toString('base64');
    res.json({ annotatedPdfBase64: outputPdfBase64 });
  } catch (err) {
    console.error('Annotation error:', err);
    res.status(500).send('Error annotating PDF');
  }
});

app.get('/', (req, res) => {
  res.send('PDF Annotator API is running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('PDF Annotator API running...');
});
