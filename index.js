const express = require('express');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    annotations.forEach(ann => {
      const pageIndex = ann.page - 1;
      const page = pages[pageIndex];
      if (!page) return;

      // ✅ Draw red rectangle (no fill, red border)
      page.drawRectangle({
        x: ann.position.x,
        y: ann.position.y,
        width: ann.dimensions?.width || 100,  // fallback width if missing
        height: ann.dimensions?.height || 20, // fallback height if missing
        borderColor: rgb(1, 0, 0),
        borderWidth: 1,
        color: undefined  // No fill
      });

      // ✅ Optional: draw label text above the rectangle
      if (ann.note) {
        page.drawText(ann.note, {
          x: ann.position.x,
          y: ann.position.y + (ann.dimensions?.height || 20) + 5, // offset above rectangle
          size: 10,
          font,
          color: rgb(1, 0, 0)
        });
      }
    });

    const annotatedPdfBytes = await pdfDoc.save();
    const annotatedPdfBase64 = Buffer.from(annotatedPdfBytes).toString('base64');

    res.json({ annotatedPdfBase64 });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error annotating PDF');
  }
});

app.get('/', (req, res) => {
  res.send('PDF Annotator API is running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ PDF Annotator API running...');
});
