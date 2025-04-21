const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const pdfBytes = Buffer.from(req.body.pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0]; // ✅ define the page before using it

    // 🎯 Draw a static red rectangle — purely for visibility test
    firstPage.drawRectangle({
      x: 50,
      y: 700,
      width: 300,
      height: 40,
      borderColor: rgb(1, 0, 0),
      borderWidth: 2,
      color: undefined,
    });

    const annotatedPdf = await pdfDoc.save();
    const base64 = Buffer.from(annotatedPdf).toString('base64');

    res.json({ annotatedPdfBase64: base64 });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to annotate');
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ PDF Annotator API running');
});
