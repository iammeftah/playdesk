const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        LevelFormat } = require('docx')
const fs = require('fs')

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
const borders = { top: border, bottom: border, left: border, right: border }

function cell(text, bold = false, bg = null) {
  return new TableCell({
    borders,
    width: { size: 3120, type: WidthType.DXA },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: 'Arial', size: 20 })] })]
  })
}

function cell2(text, bold = false, bg = null, w = 4680) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: 'Arial', size: 20 })] })]
  })
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: '1a1a2e' })]
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: '2456f6' })]
  })
}

function p(text, color = '333333') {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color })]
  })
}

function code(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [new TextRun({ text, font: 'Courier New', size: 20, color: '1a1a2e' })]
  })
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 180 },
    children: [
      new TextRun({ text: '• ', font: 'Arial', size: 22, color: '2456f6' }),
      new TextRun({ text, font: 'Arial', size: 22, color: '333333' })
    ]
  })
}

function gap() {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] })
}

const versionTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3120, 3120, 3120],
  rows: [
    new TableRow({
      children: [
        cell('Command', true, '2456f6'.replace('2456f6', 'dce6ff')),
        cell('Example result', true, 'dce6ff'),
        cell('When to use', true, 'dce6ff'),
      ]
    }),
    new TableRow({ children: [cell('npm version patch'), cell('1.0.0 → 1.0.1'), cell('Bug fixes only')] }),
    new TableRow({ children: [cell('npm version minor'), cell('1.0.0 → 1.1.0'), cell('New feature added')] }),
    new TableRow({ children: [cell('npm version major'), cell('1.0.0 → 2.0.0'), cell('Breaking change')] }),
  ]
})

const workflowTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1440, 3960, 3960],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders, width: { size: 1440, type: WidthType.DXA },
          shading: { fill: 'dce6ff', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Step', bold: true, font: 'Arial', size: 20 })] })]
        }),
        new TableCell({
          borders, width: { size: 3960, type: WidthType.DXA },
          shading: { fill: 'dce6ff', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Command', bold: true, font: 'Arial', size: 20 })] })]
        }),
        new TableCell({
          borders, width: { size: 3960, type: WidthType.DXA },
          shading: { fill: 'dce6ff', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'What happens', bold: true, font: 'Arial', size: 20 })] })]
        }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ borders, width: { size: 1440, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: '1', font: 'Arial', size: 20 })] })] }),
        new TableCell({ borders, width: { size: 3960, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'npm version patch', font: 'Courier New', size: 20 })] })] }),
        new TableCell({ borders, width: { size: 3960, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Updates version in package.json', font: 'Arial', size: 20 })] })] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ borders, width: { size: 1440, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: '2', font: 'Arial', size: 20 })] })] }),
        new TableCell({ borders, width: { size: 3960, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'npm run dist:win', font: 'Courier New', size: 20 })] })] }),
        new TableCell({ borders, width: { size: 3960, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Builds new .exe with new version name', font: 'Arial', size: 20 })] })] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ borders, width: { size: 1440, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: '3', font: 'Arial', size: 20 })] })] }),
        new TableCell({ borders, width: { size: 3960, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Share release/PlayDesk Setup X.X.X.exe', font: 'Courier New', size: 20 })] })] }),
        new TableCell({ borders, width: { size: 3960, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Send to client via Drive / USB', font: 'Arial', size: 20 })] })] }),
      ]
    }),
  ]
})

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
        children: [new TextRun({ text: '🎮 PlayDesk', font: 'Arial', size: 48, bold: true, color: '2456f6' })]
      }),
      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({ text: 'npm version — Guide de versionnage', font: 'Arial', size: 28, color: '666666' })]
      }),

      // What is semver
      h2('Qu\'est-ce que le versionnage sémantique ?'),
      p('Chaque version suit le format :  MAJEUR.MINEUR.CORRECTIF  (ex: 1.4.2)'),
      gap(),

      // The 3 numbers explained
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2000, 5360],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA },
                shading: { fill: 'dce6ff', type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Numéro', bold: true, font: 'Arial', size: 20 })] })] }),
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA },
                shading: { fill: 'dce6ff', type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Nom', bold: true, font: 'Arial', size: 20 })] })] }),
              new TableCell({ borders, width: { size: 5360, type: WidthType.DXA },
                shading: { fill: 'dce6ff', type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Signification', bold: true, font: 'Arial', size: 20 })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'X._._ (MAJEUR)', font: 'Courier New', size: 20, color: 'e53e3e' })] })] }),
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'major', font: 'Arial', size: 20 })] })] }),
              new TableCell({ borders, width: { size: 5360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Changement majeur — incompatible avec l\'ancienne version', font: 'Arial', size: 20 })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: '_.X._ (MINEUR)', font: 'Courier New', size: 20, color: 'dd6b20' })] })] }),
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'minor', font: 'Arial', size: 20 })] })] }),
              new TableCell({ borders, width: { size: 5360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Nouvelle fonctionnalité ajoutée — compatible avec l\'ancienne', font: 'Arial', size: 20 })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: '_._.X (CORRECTIF)', font: 'Courier New', size: 20, color: '38a169' })] })] }),
              new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'patch', font: 'Arial', size: 20 })] })] }),
              new TableCell({ borders, width: { size: 5360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 150, right: 150 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Correction de bug — rien de nouveau', font: 'Arial', size: 20 })] })] }),
            ]
          }),
        ]
      }),

      gap(),
      h2('Les 3 commandes'),
      versionTable,

      gap(),
      h2('Exemple concret pour PlayDesk'),
      p('Version actuelle : 1.0.0'),
      gap(),
      bullet('Tu corriges un bug de timer → npm version patch → devient 1.0.1'),
      bullet('Tu ajoutes la page Statistiques → npm version minor → devient 1.1.0'),
      bullet('Tu refais toute l\'interface → npm version major → devient 2.0.0'),

      gap(),
      h2('Workflow complet pour livrer une mise à jour'),
      workflowTable,

      gap(),
      h2('Règles à retenir'),
      bullet('Ne jamais modifier manuellement le numéro dans package.json — toujours utiliser la commande.'),
      bullet('Après npm version patch/minor/major, le fichier package.json est mis à jour automatiquement.'),
      bullet('Le .exe généré porte automatiquement le nouveau numéro : PlayDesk Setup 1.0.1.exe'),
      bullet('Les clients voient le numéro dans Paramètres → Licence.'),
      bullet('patch pour bugs, minor pour fonctionnalités, major pour refonte.'),

      gap(),
      h2('Commandes rapides'),
      code('npm version patch        # 1.0.0 → 1.0.1  (bug fix)'),
      code('npm version minor        # 1.0.0 → 1.1.0  (nouvelle feature)'),
      code('npm version major        # 1.0.0 → 2.0.0  (refonte majeure)'),
      code('npm run dist:win         # rebuild le .exe avec le nouveau numéro'),
      code('cat package.json | grep version   # voir la version actuelle'),

      gap(),
      new Paragraph({
        spacing: { before: 400 },
        children: [new TextRun({ text: 'PlayDesk — Guide interne développeur', font: 'Arial', size: 18, color: 'aaaaaa' })]
      }),
    ]
  }]
})

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/PlayDesk_npm_version_guide.docx', buf)
  console.log('Done!')
})
