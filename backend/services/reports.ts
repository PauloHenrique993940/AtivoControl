import { Request, Response } from 'express'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { audit, dateFilter, settings } from '../lib/domain'
import { movementInclude } from './movements'

export async function exportReport(req: Request, res: Response) {
  const type = z.enum(['armamentos', 'municoes', 'coletes', 'responsaveis', 'movimentacoes', 'auditoria']).parse(req.params.tipo)
  const format = z.enum(['pdf', 'xlsx']).parse(req.params.formato)
  const range = dateFilter(req)
  let columns: string[] = [], rows: (string | number)[][] = []
  if (type === 'armamentos') {
    columns = ['Tipo', 'Marca', 'Modelo', 'Calibre', 'Série', 'Registro', 'Local', 'Status']
    rows = (await prisma.armament.findMany({ orderBy: { numSerie: 'asc' } })).map(r => [r.tipo, r.marca, r.modelo, r.calibre, r.numSerie, r.numRegistro, r.local, r.status])
  } else if (type === 'municoes') {
    columns = ['Tipo', 'Calibre', 'Quantidade']; rows = (await prisma.ammunition.findMany({ orderBy: { tipo: 'asc' } })).map(r => [r.tipo, r.calibre, r.quantidade])
  } else if (type === 'coletes') {
    const date = (value: Date | null) => value ? value.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
    columns = ['Marca', 'Modelo', 'Tamanho', 'Proteção', 'Série', 'Patrimônio', 'Aquisição', 'Fabricação', 'Validade', 'Local', 'Status']
    rows = (await prisma.vest.findMany({ orderBy: { numSerie: 'asc' } })).map(r => [r.marca, r.modelo, r.tamanho, r.nivelProtecao, r.numSerie, r.numPatrimonio, date(r.dataAquisicao), date(r.dataFabricacao), date(r.dataValidade), r.local, r.status])
  } else if (type === 'responsaveis') {
    columns = ['Nome', 'Identificação', 'Setor']; rows = (await prisma.responsible.findMany({ orderBy: { nome: 'asc' } })).map(r => [r.nome, r.identificacaoFuncional, r.setor])
  } else if (type === 'movimentacoes') {
    columns = ['Data', 'Tipo', 'Ativo', 'Quantidade', 'Responsável', 'Usuário', 'Destino', 'Motivo']
    rows = (await prisma.movement.findMany({ where: { data: range }, orderBy: { data: 'desc' }, include: movementInclude })).map(r => [r.data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), r.tipo, r.armament?.numSerie || (r.vest ? `Colete ${r.vest.numSerie} · ${r.vest.tamanho}` : `${r.ammunition?.tipo || ''} ${r.ammunition?.calibre || ''}`), r.quantidade || 1, r.responsible?.nome || '', r.user.name, r.destino || '', r.motivo || ''])
  } else {
    columns = ['Data', 'Ação', 'Usuário', 'Detalhes']; rows = (await prisma.auditLog.findMany({ where: { data: range }, orderBy: { data: 'desc' }, include: { user: { select: { name: true } } } })).map(r => [r.data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), r.acao, r.user.name, r.detalhes])
  }
  const config = await settings()
  let bytes: Buffer
  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook(); workbook.creator = 'AtivoControl'; workbook.created = new Date()
    const sheet = workbook.addWorksheet(type)
    sheet.columns = columns.map(header => ({ header, width: header === 'Detalhes' || header === 'Motivo' ? 60 : 24 }))
    sheet.addRows(rows)
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B365D' } }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]; sheet.autoFilter = { from: 'A1', to: { row: 1, column: columns.length } }
    bytes = Buffer.from(await workbook.xlsx.writeBuffer())
  } else {
    bytes = await new Promise<Buffer>((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 35, bufferPages: true })
      const chunks: Buffer[] = []; pdf.on('data', c => chunks.push(c)); pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject)
      pdf.fontSize(18).text(`${config.unidade} - ${type}`); pdf.fontSize(9).text(`Emitido em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | ${rows.length} registros`)
      if (type === 'movimentacoes' || type === 'auditoria') pdf.text(`Período: ${req.query.inicio || 'início'} até ${req.query.fim || 'hoje'}`)
      pdf.moveDown()
      const width = (pdf.page.width - 70) / columns.length
      const drawRow = (cells: (string | number)[], heading = false) => {
        pdf.font(heading ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
        const height = Math.max(...cells.map(cell => pdf.heightOfString(String(cell), { width: width - 8 }))) + 12
        if (pdf.y + height > pdf.page.height - 45) { pdf.addPage(); pdf.y = 35 }
        const y = pdf.y
        cells.forEach((cell, index) => pdf.text(String(cell), 35 + index * width, y, { width: width - 8 }))
        pdf.y = y + height; pdf.moveTo(35, pdf.y - 4).lineTo(pdf.page.width - 35, pdf.y - 4).strokeColor('#dddddd').stroke()
      }
      drawRow(columns, true); rows.forEach(row => drawRow(row))
      if (!rows.length) pdf.text('Nenhum registro encontrado.')
      pdf.end()
    })
  }
  await audit(prisma, req.userId, 'EXPORTAR_RELATORIO', `${type}; formato=${format}; registros=${rows.length}`)
  res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${type}.${format}"`)
  res.send(bytes)
}
